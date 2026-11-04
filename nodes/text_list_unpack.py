# 텍스트 배열(리스트)을 받아 항목마다 따로 된 STRING 출력(text0, text1, ...)으로 나눠 내보내는 노드
import logging

# 출력 슬롯은 실행 전에 정해져야 하므로 최대 개수만큼 선언하고, 보이는 개수는 web/text_list_unpack.js가 실행 결과에 맞춘다
MAX_OUTPUTS = 32


class TextListUnpack:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                # Any Index Switch의 value(타입 *)와 Text List의 text_list(STRING 리스트)를 받는다
                "value": ("STRING", {"forceInput": True}),
            }
        }

    RETURN_TYPES = ("STRING",) * MAX_OUTPUTS
    RETURN_NAMES = tuple(f"text{i}" for i in range(MAX_OUTPUTS))
    FUNCTION = "unpack"
    CATEGORY = "utils/text"
    # 리스트 입력도 항목마다 실행하지 않고 한 번만 실행한다. 리스트가 아닌 값은 항목 1개짜리 리스트로 들어온다
    INPUT_IS_LIST = True

    def unpack(self, value):
        # Any Index Switch의 value는 타입이 *라 텍스트가 아닌 값도 들어올 수 있다
        wrong = next((item for item in value if not isinstance(item, str)), None)
        if wrong is not None:
            raise ValueError(
                f"Moon Text List Unpack: 텍스트 배열이 아닙니다. 텍스트가 아닌 값({type(wrong).__name__})이 들어왔습니다."
            )
        if len(value) > MAX_OUTPUTS:
            logging.warning("Moon Text List Unpack: 항목 %d개 중 앞의 %d개만 출력합니다.", len(value), MAX_OUTPUTS)
        texts = list(value[:MAX_OUTPUTS])
        # 항목보다 뒤의 출력은 빈 문자열이다. count는 프론트엔드가 출력 슬롯 수를 맞추는 데 쓴다
        return {"ui": {"count": [len(texts)]}, "result": tuple(texts + [""] * (MAX_OUTPUTS - len(texts)))}
