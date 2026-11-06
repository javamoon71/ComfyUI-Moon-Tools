# ImageListSimple 노드가 등록한 모든 이미지를 IMAGE 리스트로 출력하는지 검증하는 테스트
import json
import os
import sys
import tempfile
import types
import unittest

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nodes.image_list_simple import ImageListSimple


class TestImageListSimple(unittest.TestCase):
    def setUp(self):
        # ComfyUI의 folder_paths 대신 임시 폴더를 input 폴더로 쓴다
        folder = tempfile.TemporaryDirectory()
        self.addCleanup(folder.cleanup)
        self.input = folder.name
        # Image List 테스트가 넣어 둔 가짜 모듈을 테스트가 끝나면 되돌린다
        self.addCleanup(sys.modules.__setitem__, "folder_paths", sys.modules.get("folder_paths"))
        sys.modules["folder_paths"] = types.SimpleNamespace(
            get_annotated_filepath=lambda name: os.path.join(self.input, name)
        )
        self.save("a.png", (4, 3))
        self.save("b.png", (2, 5), mode="RGBA", color=(0, 255, 0, 0))
        self.save("c.jpg", (6, 6))
        self.node = ImageListSimple()
        self.images = json.dumps(["a.png", "b.png", "c.jpg"])

    def save(self, name, size, mode="RGB", color=(255, 0, 0)):
        Image.new(mode, size, color).save(os.path.join(self.input, name))

    def test_outputs_all_images_in_order(self):
        (images,) = self.node.load(self.images)
        self.assertEqual([tuple(i.shape) for i in images], [(1, 3, 4, 3), (1, 5, 2, 3), (1, 6, 6, 3)])
        self.assertAlmostEqual(images[0][0, 0, 0, 0].item(), 1.0)
        self.assertAlmostEqual(images[1][0, 0, 0, 1].item(), 1.0)

    def test_skips_blank(self):
        (images,) = self.node.load(json.dumps(["", " a.png ", "  "]))
        self.assertEqual(len(images), 1)

    def test_empty_list_raises(self):
        with self.assertRaises(ValueError):
            self.node.load("[]")

    def test_missing_file(self):
        with self.assertRaises(FileNotFoundError):
            self.node.load(json.dumps(["a.png", "nope.png"]))

    def test_is_changed(self):
        before = ImageListSimple.IS_CHANGED(self.images)
        self.assertEqual(before, ImageListSimple.IS_CHANGED(self.images))
        self.assertNotEqual(before, ImageListSimple.IS_CHANGED(json.dumps(["b.png", "a.png", "c.jpg"])))
        # 같은 이름으로 덮어쓴 파일은 수정 시각이 바뀐다
        os.utime(os.path.join(self.input, "c.jpg"), (0, 0))
        self.assertNotEqual(before, ImageListSimple.IS_CHANGED(self.images))
        self.assertEqual(ImageListSimple.IS_CHANGED("[]"), "")

    def test_list_output_without_index(self):
        # 카드 목록 위젯(web/image_list_simple.js) 하나만 쓰고 index는 없다. 출력은 IMAGE 리스트 하나다
        required = ImageListSimple.INPUT_TYPES()["required"]
        self.assertEqual(list(required), ["images"])
        self.assertEqual(required["images"][0], "IMAGE_LIST_SIMPLE")
        self.assertEqual(ImageListSimple.RETURN_TYPES, ("IMAGE",))
        self.assertEqual(ImageListSimple.OUTPUT_IS_LIST, (True,))


if __name__ == "__main__":
    unittest.main()
