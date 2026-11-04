# TextListUnpack 노드가 텍스트 배열을 항목별 출력으로 나누고 텍스트가 아닌 값을 거부하는지 검증하는 테스트
import os
import sys
import unittest

import torch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nodes.any_index_switch import AnyIndexSwitch
from nodes.text_list_unpack import MAX_OUTPUTS, TextListUnpack


class TestTextListUnpack(unittest.TestCase):
    def setUp(self):
        self.node = TextListUnpack()

    def test_declares_fixed_string_outputs(self):
        self.assertIs(TextListUnpack.INPUT_IS_LIST, True)
        self.assertEqual(TextListUnpack.RETURN_TYPES, ("STRING",) * MAX_OUTPUTS)
        self.assertEqual(TextListUnpack.RETURN_NAMES[:3], ("text0", "text1", "text2"))
        self.assertEqual(len(TextListUnpack.RETURN_NAMES), MAX_OUTPUTS)

    def test_unpacks_items_in_order(self):
        result = self.node.unpack(["a", "b", "c"])
        self.assertEqual(result["ui"], {"count": [3]})
        self.assertEqual(result["result"][:3], ("a", "b", "c"))
        # 항목보다 뒤의 출력은 빈 문자열이다
        self.assertEqual(set(result["result"][3:]), {""})
        self.assertEqual(len(result["result"]), MAX_OUTPUTS)

    def test_single_string_and_empty_list(self):
        # 리스트가 아닌 STRING 출력은 INPUT_IS_LIST 때문에 항목 1개짜리 리스트로 들어온다
        self.assertEqual(self.node.unpack(["only"])["ui"], {"count": [1]})
        result = self.node.unpack([])
        self.assertEqual(result["ui"], {"count": [0]})
        self.assertEqual(set(result["result"]), {""})

    def test_receives_any_index_switch_value(self):
        # Any Index Switch가 고른 Text List의 text_list 리스트 전체가 그대로 들어온다
        value, _ = AnyIndexSwitch().switch([1], value0=(None,), value1=["x", "y"])
        self.assertEqual(self.node.unpack(value)["result"][:2], ("x", "y"))

    def test_rejects_non_text(self):
        for value in ([torch.rand(1, 2, 2, 3)], ["a", 3]):
            with self.assertRaisesRegex(ValueError, "텍스트 배열이 아닙니다"):
                self.node.unpack(value)

    def test_more_items_than_outputs_keeps_first(self):
        items = [str(i) for i in range(MAX_OUTPUTS + 5)]
        with self.assertLogs(level="WARNING"):
            result = self.node.unpack(items)
        self.assertEqual(result["ui"], {"count": [MAX_OUTPUTS]})
        self.assertEqual(result["result"], tuple(items[:MAX_OUTPUTS]))


if __name__ == "__main__":
    unittest.main()
