# 입력 IMAGE를 png/jpg/webp 파일로 저장하고 미리보기를 보여 주는 노드
import io
import json
import os
import re
import uuid
from datetime import datetime

import numpy as np
from PIL import Image
from PIL.PngImagePlugin import PngInfo


def format_date(fmt, now):
    # ComfyUI 프론트엔드의 %date:...% 형식과 같은 토큰을 쓴다
    def part(match):
        token = match.group(0)
        if token == "yyyy":
            return str(now.year)
        if token == "yy":
            return str(now.year)[2:]
        value = {"d": now.day, "M": now.month, "h": now.hour, "m": now.minute, "s": now.second}[token[0]]
        return str(value).zfill(len(token))

    return re.sub(r"yyyy|yy|dd?|MM?|hh?|mm?|ss?", part, fmt)


def apply_tokens(text, width, height, now):
    # 프론트엔드는 기본 Save 노드에만 치환을 적용하므로 여기서 직접 바꾼다
    text = re.sub(r"%date:([^%]*)%", lambda m: format_date(m.group(1), now), text)
    return text.replace("%width%", str(width)).replace("%height%", str(height))


def next_counter(folder, filename):
    # 기본 SaveImage와 같은 규칙: {filename}_{번호}_.{확장자} 중 가장 큰 번호 + 1
    pattern = re.compile(re.escape(filename) + r"_(\d+)_\.", re.IGNORECASE)
    counters = [int(m.group(1)) for name in os.listdir(folder) if (m := pattern.match(name))]
    return max(counters, default=0) + 1


def relative_subfolder(folder, base):
    # folder가 base 안이면 /view에 넘길 하위 폴더, 밖이면 None
    try:
        rel = os.path.relpath(folder, base)
    except ValueError:  # Windows에서 드라이브가 다르면 상대 경로를 만들 수 없다
        return None
    if rel == os.pardir or rel.startswith(os.pardir + os.sep):
        return None
    return "" if rel == os.curdir else rel.replace(os.sep, "/")


def to_pil(image):
    array = 255.0 * image.cpu().numpy()
    return Image.fromarray(np.clip(array, 0, 255).astype(np.uint8))


def strip_jpeg_header(data):
    # SOS 앞의 APPn(JFIF, EXIF 등)과 COM 세그먼트를 뺀다. 남는 세그먼트는 디코딩에 필요하다
    out = bytearray(data[:2])
    i = 2
    while data[i + 1] != 0xDA:
        end = i + 2 + int.from_bytes(data[i + 2:i + 4], "big")
        if not (0xE0 <= data[i + 1] <= 0xEF or data[i + 1] == 0xFE):
            out += data[i:end]
        i = end
    return bytes(out + data[i:])


def save_file(img, path, file_format, quality, metadata, strip_header):
    # strip_header면 metadata는 비어 있다. png는 메타데이터가 없으면 필수 청크만 남는다
    if file_format == "png":
        info = None
        if metadata:
            info = PngInfo()
            for key, value in metadata.items():
                info.add_text(key, json.dumps(value))
        img.save(path, pnginfo=info, compress_level=4)
    elif file_format == "webp":
        # SaveAnimatedWEBP와 같은 형식이라 ComfyUI에 끌어다 놓으면 워크플로가 열린다
        exif = Image.Exif()
        tag = 0x0110
        for key, value in metadata.items():
            exif[tag] = f"{key}:{json.dumps(value)}"
            tag -= 1
        if strip_header:
            # EXIF를 넘기지 않으면 빈 EXIF 청크와 확장 헤더(VP8X)가 붙지 않는다. 알파가 있으면 VP8X는 필요해서 남는다
            img.save(path, quality=quality)
        else:
            img.save(path, quality=quality, exif=exif)
    else:
        # JPEG EXIF는 64KB 제한이 있어 워크플로를 넣지 않는다
        img = img.convert("RGB")
        if strip_header:
            # Pillow는 JFIF 헤더를 항상 쓰므로 저장한 바이트에서 지운다
            buffer = io.BytesIO()
            img.save(buffer, "JPEG", quality=quality)
            with open(path, "wb") as file:
                file.write(strip_jpeg_header(buffer.getvalue()))
        else:
            img.save(path, quality=quality)


def save_preview(img, temp_dir):
    # output 밖에 저장한 파일은 /view로 열 수 없어서 temp 폴더에 사본을 둔다
    os.makedirs(temp_dir, exist_ok=True)
    name = f"MoonSaveImage_{uuid.uuid4().hex[:8]}.png"
    img.save(os.path.join(temp_dir, name), compress_level=1)
    return {"filename": name, "subfolder": "", "type": "temp"}


class MoonSaveImage:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "filename_prefix": ("STRING", {"default": "ComfyUI"}),
                "output_path": ("STRING", {"default": ""}),
                "file_format": (["png", "jpg", "webp"], {"default": "png"}),
                "quality": ("INT", {"default": 95, "min": 1, "max": 100}),
                "save_metadata": ("BOOLEAN", {"default": True, "label_on": "On", "label_off": "Off"}),
                # On이면 save_metadata와 상관없이 메타데이터와 형식 헤더(JFIF, EXIF, VP8X)를 빼고 이미지 데이터만 남긴다
                # 맨 뒤에 두어 예전 워크플로의 위젯 값 순서가 그대로 맞는다
                "strip_header": ("BOOLEAN", {"default": False, "label_on": "On", "label_off": "Off"}),
            },
            "hidden": {"prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO"},
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("images",)
    FUNCTION = "save"
    OUTPUT_NODE = True
    CATEGORY = "image"

    def save(self, images, filename_prefix, output_path, file_format, quality, save_metadata, strip_header,
             prompt=None, extra_pnginfo=None):
        # ComfyUI 밖(테스트)에서도 import할 수 있도록 여기서 불러온다
        import folder_paths

        output_dir = folder_paths.get_output_directory()
        height, width = images.shape[1:3]
        now = datetime.now()
        target = os.path.join(
            output_dir,
            apply_tokens(output_path, width, height, now),
            apply_tokens(filename_prefix, width, height, now),
        )
        folder, filename = os.path.split(os.path.normpath(target))
        os.makedirs(folder, exist_ok=True)

        metadata = {}
        if save_metadata and not strip_header:
            if prompt is not None:
                metadata["prompt"] = prompt
            metadata.update(extra_pnginfo or {})

        counter = next_counter(folder, filename)
        subfolder = relative_subfolder(folder, output_dir)
        results = []
        for image in images:
            img = to_pil(image)
            file = f"{filename}_{counter:05}_.{file_format}"
            save_file(img, os.path.join(folder, file), file_format, quality, metadata, strip_header)
            if subfolder is None:
                results.append(save_preview(img, folder_paths.get_temp_directory()))
            else:
                results.append({"filename": file, "subfolder": subfolder, "type": "output"})
            counter += 1

        return {"ui": {"images": results}, "result": (images,)}
