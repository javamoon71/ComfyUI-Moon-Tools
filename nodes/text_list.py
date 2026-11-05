# 여러 줄 문자열을 리스트로 관리하고 index에 해당하는 항목을 출력하는 노드
import json

SEPARATOR = "##"
# text_list 입력을 나눈 항목을 프론트엔드로 보내는 ui 키. web/text_list.js와 같아야 한다
UI_ITEMS = "text_list_items"


def item_pair(item):
    # 제목이 붙은 항목은 {"title", "text"} 객체이고, 예전 문자열 항목은 제목이 없다
    if isinstance(item, dict):
        return str(item.get("title", "")).strip(), str(item.get("text", "")).strip()
    return "", str(item).strip()


def parse_items(text):
    # 위젯은 항목 안의 줄바꿈을 보존하려고 JSON 배열로 보낸다. 예전 워크플로는 줄 단위 문자열이다
    try:
        items = json.loads(text)
    except ValueError:
        items = None
    if not isinstance(items, list):
        items = text.splitlines()
    # 빈 항목 판정은 내용 기준이다. 결과는 (제목, 내용) 쌍의 목록
    pairs = (item_pair(item) for item in items)
    return [p for p in pairs if p[1]]


def split_items(text):
    # text_list 입력 문자열을 ##로 나눈다. 제목은 없고, 빈 항목은 위젯 목록과 같이 건너뛴다
    return [("", part.strip()) for part in text.split(SEPARATOR) if part.strip()]


class TextList:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text": ("TEXT_LIST", {"default": ""}),
                # 프론트엔드가 생성 후 제어 위젯을 붙인다. 항목 수 안에서 순환시키는 부분과
                # 예전 random 값을 제어 모드로 옮기는 부분은 web/index_control.js에 있다
                "index": ("INT", {"default": 0, "min": 0, "max": 0xFFFFFFFF, "control_after_generate": "fixed"}),
                # 목록 UI에서 제목을 보일지만 정한다. 출력에는 영향이 없다
                "show_title": ("BOOLEAN", {"default": True, "label_on": "On", "label_off": "Off"}),
            },
            "optional": {
                # 연결하면 위젯 목록 대신 이 문자열을 ##로 나눈 항목을 쓴다. 화면에는 display_name으로 보인다
                "text_list": ("STRING", {"forceInput": True, "display_name": "text list ##"}),
            },
        }

    # 제목을 내용보다 앞에 둔다(사용자 요청). 예전 워크플로의 출력 링크는 다시 연결해야 한다
    RETURN_TYPES = ("STRING", "STRING", "STRING", "STRING")
    RETURN_NAMES = ("title", "text", "title_list", "text_list")
    # title_list/text_list는 번호가 붙은 모든 항목의 제목/내용을 같은 순서의 STRING 리스트로 보낸다
    OUTPUT_IS_LIST = (False, False, True, True)
    FUNCTION = "select"
    CATEGORY = "utils/text"
    # 노드 검색은 name/display_name 외에 이 별칭도 본다. "moon"은 이름에 없어서 별칭이 있어야 찾힌다
    SEARCH_ALIASES = ["moon", "text", "textlist", "text list"]

    def select(self, text, index, show_title=True, text_list=None):
        # 연결되지 않은 선택 입력은 None으로 들어온다. 연결되어 있으면 빈 문자열이어도 위젯 목록을 쓰지 않는다
        items = parse_items(text) if text_list is None else split_items(text_list)
        result = ("", "", [], [])
        if items:
            # show_title은 UI 표시만 정하므로 숨겨도 제목은 출력한다
            title, body = items[index % len(items)]
            result = (title, body, [p[0] for p in items], [p[1] for p in items])
        if text_list is None:
            return result
        # 연결된 문자열은 실행해야 알 수 있으므로, 나눈 항목을 화면 목록에 채우도록 함께 보낸다(web/text_list.js onExecuted)
        return {"ui": {UI_ITEMS: [p[1] for p in items]}, "result": result}
