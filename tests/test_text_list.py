# TextList 노드의 항목 선택 동작을 검증하는 테스트
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nodes.text_list import TextList


class TestTextList(unittest.TestCase):
    def setUp(self):
        self.node = TextList()

    def run_node(self, *args, **kwargs):
        # text_list가 연결되면 {"ui", "result"}로 돌아오므로 출력 튜플만 꺼낸다
        out = self.node.select(*args, **kwargs)
        return out["result"] if isinstance(out, dict) else out

    def pick(self, *args, **kwargs):
        # 선택 결과(text, title)만 비교한다. 리스트 출력은 별도 테스트에서 본다
        title, body = self.run_node(*args, **kwargs)[:2]
        return body, title

    def test_select_by_index(self):
        text = "apple\nbanana\ncherry"
        self.assertEqual(self.pick(text, 0), ("apple", ""))
        self.assertEqual(self.pick(text, 2), ("cherry", ""))

    def test_index_wraps(self):
        self.assertEqual(self.pick("a\nb\nc", 3), ("a", ""))
        self.assertEqual(self.pick("a\nb\nc", 7), ("b", ""))

    def test_skips_blank_lines_and_strips(self):
        text = "  first  \n\n   \nsecond\r\n"
        self.assertEqual(self.pick(text, 1), ("second", ""))

    def test_empty_text(self):
        self.assertEqual(self.pick("", 5), ("", ""))
        self.assertEqual(self.pick("\n  \n", 0), ("", ""))

    def test_json_items_keep_newlines(self):
        text = json.dumps(["line1\nline2", "  ", " single \n"])
        self.assertEqual(self.pick(text, 0), ("line1\nline2", ""))
        self.assertEqual(self.pick(text, 1), ("single", ""))
        self.assertEqual(self.pick(text, 2), ("line1\nline2", ""))

    def test_titled_items_output_text_and_title(self):
        text = json.dumps([
            {"title": " Style ", "text": " line1\nline2 "},
            {"title": "제목만", "text": "  "},
            "plain",
            {"text": "no title key"},
        ])
        self.assertEqual(self.pick(text, 0), ("line1\nline2", "Style"))
        self.assertEqual(self.pick(text, 1), ("plain", ""))
        self.assertEqual(self.pick(text, 2), ("no title key", ""))

    def test_show_title_off_still_outputs_title(self):
        text = json.dumps([{"title": "Style", "text": "body"}])
        self.assertEqual(self.pick(text, 0, show_title=False), ("body", "Style"))

    def test_json_empty_list(self):
        self.assertEqual(self.pick("[]", 0), ("", ""))

    def test_text_list_outputs_all_items(self):
        text = json.dumps([{"title": "A", "text": " a "}, {"title": "빈", "text": " "}, "b\nc"])
        self.assertEqual(self.node.select(text, 0)[3], ["a", "b\nc"])
        self.assertEqual(self.node.select(text, 1)[3], ["a", "b\nc"])
        self.assertEqual(self.node.select("", 0)[3], [])
        self.assertEqual(TextList.OUTPUT_IS_LIST, (False, False, True, True))

    def test_title_list_matches_text_list(self):
        text = json.dumps([{"title": " A ", "text": "a"}, {"title": "빈", "text": " "}, "b", {"text": "c"}])
        out = self.node.select(text, 0)
        self.assertEqual(out[3], ["a", "b", "c"])
        self.assertEqual(out[2], ["A", "", ""])
        self.assertEqual(self.node.select("", 0)[2], [])

    def test_text_list_input_splits_by_separator(self):
        # 사용자 예시: 3개 항목을 담은 목록과 같이 처리한다
        joined = "1##\n2##\n343434 ##"
        out = self.run_node("", 0, text_list=joined)
        self.assertEqual(out, ("", "1", ["", "", ""], ["1", "2", "343434"]))
        self.assertEqual(self.pick("", 2, text_list=joined), ("343434", ""))
        self.assertEqual(self.pick("", 4, text_list=joined), ("2", ""))

    def test_text_list_input_replaces_widget_items(self):
        widget = json.dumps([{"title": "A", "text": "widget"}])
        self.assertEqual(self.run_node(widget, 0, text_list="x##y")[3], ["x", "y"])
        self.assertEqual(self.pick(widget, 0, text_list="x##y"), ("x", ""))
        # 연결되어 있으면 비어 있어도 위젯 목록으로 돌아가지 않는다
        self.assertEqual(self.run_node(widget, 0, text_list=" ## \n"), ("", "", [], []))
        # 연결되지 않으면(None) 위젯 목록을 쓴다
        self.assertEqual(self.pick(widget, 0, text_list=None), ("widget", "A"))

    def test_text_list_input_keeps_newlines_inside_item(self):
        self.assertEqual(self.run_node("", 0, text_list="a\nb##c")[3], ["a\nb", "c"])

    def test_text_list_input_sends_items_to_ui(self):
        # 사용자 예시: 나눈 항목 5개를 화면 목록에 채우도록 ui로 보낸다
        joined = "첫번째 내용##\n두번째 행의 내용##\n세번째 행\n##\n네번째\n\n##\n다섯째 행"
        out = self.node.select("", 1, text_list=joined)
        items = ["첫번째 내용", "두번째 행의 내용", "세번째 행", "네번째", "다섯째 행"]
        self.assertEqual(out["ui"], {"text_list_items": items})
        self.assertEqual(out["result"], ("", "두번째 행의 내용", [""] * 5, items))
        # 빈 문자열이면 빈 목록을 보낸다
        self.assertEqual(self.node.select("", 0, text_list="")["ui"], {"text_list_items": []})

    def test_widget_list_has_no_ui(self):
        # 연결되지 않으면 위젯 목록이 원본이므로 화면을 바꾸지 않는다
        self.assertIsInstance(self.node.select("a\nb", 0), tuple)

    def test_text_list_input_is_optional_socket(self):
        spec = TextList.INPUT_TYPES()["optional"]["text_list"]
        self.assertEqual(spec, ("STRING", {"forceInput": True, "display_name": "text list ##"}))

    def test_search_aliases(self):
        self.assertEqual(TextList.SEARCH_ALIASES, ["moon", "text", "textlist", "text list"])

    def test_index_has_control_after_generate(self):
        # 무작위 선택은 random 입력 대신 index의 생성 후 제어(randomize)로 한다. 기본 fixed라 예전 index는 바뀌지 않는다
        required = TextList.INPUT_TYPES()["required"]
        self.assertEqual(required["index"][1]["control_after_generate"], "fixed")
        self.assertNotIn("random", required)
        self.assertEqual(list(required), ["text", "index", "show_title"])
        self.assertFalse(hasattr(TextList, "IS_CHANGED"))


if __name__ == "__main__":
    unittest.main()
