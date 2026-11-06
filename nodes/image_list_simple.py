# 업로드한 이미지 목록을 관리하고 모든 이미지를 IMAGE 리스트로 출력하는 단순한 노드
import os

from .image_list import image_path, load_image, parse_items


class ImageListSimple:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                # 값은 Image List와 같은 파일 이름 JSON 배열이다. 카드 목록, 드래그 앤 드롭, Ctrl+V 붙여넣기,
                # 순서 변경, 삭제는 web/image_list_simple.js가 맡는다
                "images": ("IMAGE_LIST_SIMPLE", {"default": "[]"}),
            }
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image_list",)
    # 크기가 다른 이미지도 담을 수 있도록 batch 대신 리스트로 내보낸다. 받는 노드는 이미지마다 한 번씩 실행된다
    OUTPUT_IS_LIST = (True,)
    FUNCTION = "load"
    CATEGORY = "image"

    @staticmethod
    def paths(images):
        items = parse_items(images)
        if not items:
            raise ValueError("Moon Image List Simple: 등록된 이미지가 없습니다.")
        return [(name, image_path(name)) for name in items]

    @classmethod
    def IS_CHANGED(cls, images):
        # 같은 이름의 파일이 덮어써지면 다시 실행되도록 수정 시각을 함께 쓴다
        try:
            return ";".join(f"{name}:{os.path.getmtime(path)}" for name, path in cls.paths(images))
        except (ValueError, OSError):
            return ""

    def load(self, images):
        result = []
        for name, path in self.paths(images):
            if not os.path.isfile(path):
                raise FileNotFoundError(f"Moon Image List Simple: 이미지 파일을 찾을 수 없습니다: {name}")
            result.append(load_image(path)[0])
        return (result,)
