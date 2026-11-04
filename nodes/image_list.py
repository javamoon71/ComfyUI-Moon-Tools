# 업로드한 이미지 목록을 관리하고 index에 해당하는 이미지를 IMAGE/MASK로 출력하는 노드
import json
import os

import numpy as np
import torch
from PIL import Image, ImageOps


def parse_items(text):
    # 위젯은 파일 이름 목록을 JSON 배열 문자열로 보낸다
    try:
        items = json.loads(text)
    except ValueError:
        items = None
    if not isinstance(items, list):
        items = text.splitlines()
    return [str(item).strip() for item in items if str(item).strip()]


def image_path(name):
    # ComfyUI 밖(테스트)에서도 import할 수 있도록 여기서 불러온다
    import folder_paths

    return folder_paths.get_annotated_filepath(name)


def load_image(path):
    # 기본 Load Image 노드와 같은 형식: IMAGE [1,H,W,3], MASK [1,H,W] (알파가 없으면 64x64 0)
    with Image.open(path) as img:
        img = ImageOps.exif_transpose(img)
        if img.mode == "I":
            img = img.point(lambda i: i * (1 / 255))
        image = torch.from_numpy(np.array(img.convert("RGB")).astype(np.float32) / 255.0)[None,]
        if "A" in img.getbands():
            alpha = np.array(img.getchannel("A")).astype(np.float32) / 255.0
            mask = 1.0 - torch.from_numpy(alpha)
        else:
            mask = torch.zeros((64, 64), dtype=torch.float32)
    return image, mask.unsqueeze(0)


class ImageList:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE_LIST", {"default": "[]"}),
                # 프론트엔드가 생성 후 제어 위젯을 붙인다. 이미지 수 안에서 순환시키는 부분과
                # 예전 random 값을 제어 모드로 옮기는 부분은 web/index_control.js에 있다
                "index": ("INT", {"default": 0, "min": 0, "max": 0xFFFFFFFF, "control_after_generate": "fixed"}),
            }
        }

    RETURN_TYPES = ("IMAGE", "MASK")
    RETURN_NAMES = ("image", "mask")
    FUNCTION = "select"
    CATEGORY = "image"

    @staticmethod
    def pick(images, index):
        items = parse_items(images)
        if not items:
            raise ValueError("Moon Image List: 등록된 이미지가 없습니다.")
        return items[index % len(items)]

    @classmethod
    def IS_CHANGED(cls, images, index):
        # 같은 이름의 파일이 덮어써지면 다시 실행되도록 수정 시각을 함께 쓴다
        try:
            name = cls.pick(images, index)
            return f"{name}:{os.path.getmtime(image_path(name))}"
        except (ValueError, OSError):
            return ""

    def select(self, images, index):
        name = self.pick(images, index)
        path = image_path(name)
        if not os.path.isfile(path):
            raise FileNotFoundError(f"Moon Image List: 이미지 파일을 찾을 수 없습니다: {name}")
        return load_image(path)
