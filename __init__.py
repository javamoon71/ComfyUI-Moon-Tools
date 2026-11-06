# ComfyUI에 이 팩의 노드를 등록하는 진입점
from .nodes.any_index_switch import AnyIndexSwitch
from .nodes.image_list import ImageList
from .nodes.image_list_simple import ImageListSimple
from .nodes.remove_background import MoonRemoveBackground
from .nodes.save_image import MoonSaveImage
from .nodes.text_list import TextList
from .nodes.text_list_unpack import TextListUnpack

NODE_CLASS_MAPPINGS = {
    "ImageList": ImageList,
    "TextList": TextList,
    "AnyIndexSwitch": AnyIndexSwitch,
    "MoonSaveImage": MoonSaveImage,
    "MoonRemoveBackground": MoonRemoveBackground,
    "MoonTextListUnpack": TextListUnpack,
    "MoonImageListSimple": ImageListSimple,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "ImageList": "Moon Image List (ImageList)",
    "TextList": "Moon Text List (TextList)",
    "AnyIndexSwitch": "Moon Any Index Switch (AnyIndexSwitch)",
    "MoonSaveImage": "Moon Save Image (MoonSaveImage)",
    "MoonRemoveBackground": "Moon Remove Background (MoonRemoveBackground)",
    "MoonTextListUnpack": "Moon Text List Unpack (MoonTextListUnpack)",
    "MoonImageListSimple": "Moon Image List Simple (MoonImageListSimple)",
}

WEB_DIRECTORY = "./web"
