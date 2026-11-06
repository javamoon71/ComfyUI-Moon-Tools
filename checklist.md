# Checklist

## Plan
여러 장의 이미지를 목록으로 관리하고, index(또는 랜덤)에 해당하는 이미지 하나를 출력하는 ComfyUI 커스텀 노드. ComfyUI-Text-List의 이미지 버전.
- 입력: images(IMAGE_LIST 위젯, 업로드한 파일 이름 목록), index(INT, 0부터), random(On/Off)
- 출력: IMAGE, MASK (기본 Load Image 노드와 같은 형식)

## Tasks
- [x] 프로젝트 폴더 생성, git 초기화
- [x] 선택/로드 로직 구현 (`nodes.py`)
- [x] ComfyUI 등록 (`__init__.py`)
- [x] 썸네일 목록 + 업로드/삭제 위젯 (`web/image_list.js`)
- [x] 단위 테스트 작성 및 통과 (`tests/test_nodes.py`)
- [x] README 작성
- [x] 커밋
- [x] GitHub 저장소 생성 및 push
- [ ] ComfyUI PC에서 실제 동작 확인

## Plan 2 — drag and drop 추가
- [x] 목록 위에 놓은 이미지 파일 업로드 (ComfyUI 기본 드롭 처리 막기)
- [x] 노드의 다른 영역에 놓아도 추가 (`onDragOver`/`onDragDrop`)
- [x] README 반영
- [x] ComfyUI PC에서 실제 동작 확인

## Plan 3 — nodes 폴더로 구조 변경
여러 노드를 추가할 수 있도록 노드 파일을 `nodes/` 패키지로 모은다.
- [x] `nodes.py` → `nodes/image_list.py` 이동, `nodes/__init__.py` 추가
- [x] 루트 `__init__.py` import 경로 수정
- [x] 테스트를 `tests/test_image_list.py`로 이동, import 수정
- [x] 테스트 통과 확인
- [ ] ComfyUI PC에서 노드가 그대로 로드되는지 확인

## Plan 4 — Any Index Switch 노드
어떤 타입이든 여러 입력(value0, value1, ...)을 받아 index에 해당하는 값 하나를 출력한다.
- 입력: index(INT), value0~(모든 타입, 연결하면 다음 슬롯 자동 추가)
- 출력: value(모든 타입)
- index는 연결된 입력을 슬롯 순서대로 세어 순환한다. 선택된 입력만 실행한다(lazy).
- [x] 노드 구현 (`nodes/any_index_switch.py`)
- [x] 슬롯 자동 추가/정리 (`web/any_index_switch.js`)
- [x] 등록 (`__init__.py`)
- [x] 단위 테스트 (`tests/test_any_index_switch.py`)
- [x] README 반영
- [ ] ComfyUI PC에서 실제 동작 확인

## Plan 5 — 저장소 이름 변경 (ComfyUI-Moon-Image-List → ComfyUI-Moon-Tools)
- [x] GitHub 저장소 이름 변경 (사용자가 직접), 옛 주소 301 연결 확인
- [x] README 제목, clone 주소 변경
- [x] 프론트엔드 확장 이름 `ComfyUI-Moon-Tools.*`로 변경
- [x] 로컬 git remote 주소 변경

## Plan 6 — Text List 통합 (ComfyUI-Moon-Text-List → nodes)
- [x] `nodes/text_list.py`, `web/text_list.js`, `tests/test_text_list.py` 가져오기 (원본 1d8775a)
- [x] 등록 (`__init__.py`), 노드 키 `TextList`와 표시 이름 유지
- [x] README에 Text List 사용법과 예전 저장소에서 옮겨 오는 방법 추가
- [x] Text List의 checklist / context-notes 이어 붙이기
- [x] 테스트 + 패키지 로드 + JS 문법 검사
- [x] GitHub `ComfyUI-Moon-Tools`에 push, 새 주소로 clone 후 테스트 통과 확인
- [ ] ComfyUI PC: 예전 `ComfyUI-Moon-Text-List` 폴더 삭제 후 세 노드 동작 확인

## Plan 7 — Moon Save Image 통합 (ComfyUI-Moon-SaveImage → nodes)
- [x] `nodes/save_image.py`, `tests/test_save_image.py` 가져오기 (원본 596bb94)
- [x] 테스트의 가짜 `folder_paths`를 테스트가 끝나면 되돌리기 (Image List 테스트와 충돌 방지)
- [x] 등록 (`__init__.py`), 노드 키 `MoonSaveImage`와 표시 이름 유지
- [x] README에 Moon Save Image 사용법, 보안 주의, 예전 저장소에서 옮겨 오는 방법 추가
- [x] Save Image의 checklist / context-notes 이어 붙이기
- [x] 테스트(순서를 바꿔서도) + 패키지 로드 확인
- [x] GitHub `ComfyUI-Moon-Tools`에 push (사용자 확인 후)
- [ ] ComfyUI PC: 예전 `ComfyUI-Moon-SaveImage` 폴더 삭제 후 네 노드 동작 확인

## Plan 8 — 저장소 설명을 네 노드에 맞추기
- [ ] GitHub About 설명 변경 (사용자가 직접)
- [x] README 첫 문단에 네 노드 모두 소개
- [x] 문제 해결: 노드 검색은 `moon`으로 안내, 예전 폴더 충돌에 Save Image 추가
- [x] GitHub에 push (a28db61, raw 파일로 반영 확인)

## Plan 9 — Text List 표시 이름을 Moon Text List로
다른 세 노드처럼 `moon` 검색에 표시 이름으로 걸리게 한다. 노드 키 `TextList`는 그대로 둔다.
- [x] 표시 이름 `Text List` → `Moon Text List (TextList)` (`__init__.py`)
- [x] README의 노드 이름, 섹션 제목·링크, `moon` 검색 버전 안내 정리
- [x] 테스트 + 패키지 로드 확인
- [x] 커밋
- [x] push (ee993d7, GitHub 반영 확인)
- [ ] ComfyUI PC에서 `moon` 검색에 네 노드가 나오는지 확인

## Plan 10 — Any Index Switch index에 생성 후 제어
seed 위젯처럼 실행할 때마다 index를 fixed / increment / decrement / randomize로 바꾼다.
- [x] `index` 입력에 `control_after_generate: "fixed"` 추가 (`nodes/any_index_switch.py`)
- [x] 단위 테스트 (`tests/test_any_index_switch.py`)
- [x] README 반영
- [x] 커밋
- [x] push (4b81625, GitHub 반영 확인)
- [ ] ComfyUI PC에서 increment / randomize 동작 확인

## Plan 11 — 생성 후 제어를 연결된 입력 범위에서 순환
increment는 마지막 다음 0, decrement는 0 다음 마지막, randomize는 0 ~ 개수-1. index가 링크로 연결되면 동작하지 않는다.
- [x] 제어 위젯 훅을 감싸 범위를 잠시 넓히고 넘친 값을 반대쪽 끝으로 (`web/any_index_switch.js`)
- [x] 프론트엔드 제어 로직을 옮긴 Node 하네스로 확인 (고치기 전 JS는 실패)
- [x] README, context-notes 반영
- [x] 커밋
- [x] push (4b81625, GitHub 반영 확인)
- [ ] ComfyUI PC에서 increment / decrement / randomize 순환 확인

## Plan 12 — Any Index Switch index 출력
- [x] 출력 `index`(INT) 추가, `value` 뒤 (`nodes/any_index_switch.py`)
- [x] 값은 순환한 뒤 실제 선택 번호(연결된 입력 기준) + 테스트
- [x] README, context-notes 반영
- [x] 커밋, push
- [ ] ComfyUI PC에서 기존 워크플로 노드에 index 출력이 생기고 value 링크가 유지되는지 확인

## Plan 13 — Any Index Switch 출력을 항상 1개로
선택된 입력이 리스트(항목 여러 개)로 들어오면 노드가 항목 수만큼 실행되어 출력도 여러 개가 됐다(미리보기에 `1`이 4줄).
- [x] `INPUT_IS_LIST = True`로 한 번만 실행, index는 첫 값, 선택된 입력은 첫 항목만 출력 (`nodes/any_index_switch.py`)
- [x] 리스트 입력 테스트 (`tests/test_any_index_switch.py`)
- [x] README, context-notes 반영
- [x] 커밋
- [x] push (9369b3a)
- [ ] ComfyUI PC에서 미리보기에 값이 한 줄만 나오는지 확인 → Plan 14로 바뀜

## Plan 14 — value는 리스트 전체, index만 값 하나
사용자 정정: 값 하나만 내야 하는 것은 `index`이고, `value`는 선택된 리스트 전체를 내야 한다.
- [x] `OUTPUT_IS_LIST = (True, False)`, `switch`가 선택된 리스트를 그대로 반환 (`nodes/any_index_switch.py`)
- [x] lazy 판정이 빈 리스트에서 에러 나지 않게 (`all(item is None ...)`)
- [x] 테스트 수정 + ComfyUI `execution.py` 실행 함수로 버전별 출력 비교
- [x] README, context-notes 반영
- [x] 커밋, push
- [ ] ComfyUI PC: 리스트 입력에서 value 미리보기는 항목 전체, index 미리보기는 한 줄인지 확인

## Text List (ComfyUI-Moon-Text-List에서 통합)
통합 전 저장소의 기록이다(마지막 커밋 1d8775a). 파일 이름은 통합 전 기준이다.

### Plan
여러 줄 문자열을 리스트로 관리하고, index에 해당하는 문자열 하나를 출력하는 ComfyUI 커스텀 노드.
- 입력: text(여러 줄, 한 줄 = 항목 하나), index(INT, 0부터)
- 출력: STRING(index에 해당하는 항목)

### Tasks
- [x] 프로젝트 폴더 생성
- [x] 노드 구현 (`nodes.py`)
- [x] ComfyUI 등록 (`__init__.py`)
- [x] 단위 테스트 작성 및 통과 (`tests/test_nodes.py`)
- [x] git 초기화 및 커밋
- [ ] ComfyUI `custom_nodes`에 연결해 실제 동작 확인

### Plan 2 — 항목별 입력칸 UI
여러 줄 입력창 대신 항목마다 입력칸을 두고, 추가/삭제 버튼으로 관리한다.
- [x] `text` 입력 타입을 커스텀 타입 `TEXT_LIST`로 변경 (`nodes.py`)
- [x] 항목별 입력칸 + 추가/삭제 위젯 구현 (`web/text_list.js`)
- [x] `WEB_DIRECTORY` 등록 (`__init__.py`)
- [x] 단위 테스트 + JS 문법 검사
- [ ] ComfyUI PC에서 실제 동작 확인

### Plan 3 — 랜덤 On/Off
- [x] `random` BOOLEAN 입력 추가, On이면 index 대신 무작위 항목 출력
- [x] On일 때 `IS_CHANGED`로 매 실행마다 다시 뽑기
- [x] 단위 테스트
- [ ] ComfyUI PC에서 실제 동작 확인

### Plan 4 — index 범위 제한
- [x] random은 항목 수 범위 안에서만 뽑는지 확인 (기존 동작 유지)
- [x] index 위젯 최대값을 비어 있지 않은 항목 수 - 1로 맞추고, 범위를 벗어난 값은 최대값으로 당김
- [ ] ComfyUI PC에서 화살표 동작 확인

### Plan 5 — 보기/편집 전환 + 항목 내 줄바꿈
- [x] 항목은 평소 텍스트로 보여주고, 클릭하면 여러 줄 입력창으로 전환, 바깥 클릭 시 복귀
- [x] 저장 형식을 JSON 배열 문자열로 변경 (예전 줄 단위 형식도 읽음)
- [x] Python `parse_items` JSON 지원 + 테스트
- [ ] ComfyUI PC에서 실제 동작 확인

### Plan 6 — 항목 제목
항목마다 내용 위에 1줄 제목을 둔다. 보기 모드에서는 label, 클릭하면 제목/내용을 함께 편집한다.
- [x] 저장 형식을 `{title, text}` 객체 배열로 변경 (예전 문자열 항목도 읽음)
- [x] Python은 내용만 출력 (`item_text`) + 테스트
- [x] 보기 모드 제목 label / 편집 모드 제목 입력창을 내용 바로 위에 배치
- [x] 제목·내용 어느 쪽을 클릭해도 둘 다 편집 가능, 둘 사이 이동 시 편집 유지
- [x] jsdom으로 전환 동작 확인
- [ ] ComfyUI PC에서 실제 동작 확인

### Plan 7 — 제목 숨김
- [x] `show_title` BOOLEAN 입력 추가 (기본 On, 출력에는 영향 없음) + 테스트
- [x] Off면 보기/편집 모드 모두 제목을 숨기고, 새 항목은 내용 입력창부터 포커스
- [x] 토글 변경과 워크플로 불러오기 시 다시 그리기, jsdom으로 확인
- [ ] ComfyUI PC에서 실제 동작 확인

### Plan 8 — title 출력
- [x] 출력 슬롯 `title` 추가 (text 뒤, 기존 링크 유지)
- [x] 제목이 없으면 빈 문자열, `show_title` Off여도 출력
- [x] random일 때 같은 항목의 제목이 나가는지 테스트
- [ ] ComfyUI PC에서 실제 동작 확인

### Plan 9 — text_list 출력
- [x] 출력 슬롯 `text_list` 추가 (title 뒤, `OUTPUT_IS_LIST`로 STRING 리스트)
- [x] 빈 항목 제외, 빈 목록이면 빈 리스트 + 테스트
- [ ] ComfyUI PC에서 실제 동작 확인

### Plan 10 — title_list 출력
- [x] 출력 슬롯 `title_list` 추가 (text_list 뒤, 같은 항목·같은 순서)
- [x] 제목 없는 항목은 빈 문자열 + 테스트
- [ ] ComfyUI PC에서 실제 동작 확인

### Plan 11 — 출력 슬롯 순서 변경
- [x] 출력 순서를 `title, text, title_list, text_list`로 변경 + 테스트/README 반영
- [ ] ComfyUI PC에서 실제 동작 확인

### Plan 12 — 보기 모드 줄 수 자동 확장
- [x] 목록이 스크롤 없이 다 보이면 보기 모드 줄 수를 2줄에서 최대 5줄까지 늘림
- [x] 다시 그릴 때와 노드 크기가 바뀔 때 다시 맞춤, 편집 중에는 유지
- [x] 헤드리스 Chrome으로 높이별 줄 수 확인 + README 반영
- [x] 최대 5줄 제한 제거: 노드 높이에 맞춰 줄 수를 계속 늘림 (이진 탐색)
- [ ] ComfyUI PC에서 실제 동작 확인

### Plan 13 — 노드 검색 별칭
- [x] `SEARCH_ALIASES`에 `moon`, `text`, `textlist`, `text list` 추가 + 테스트/README 반영
- [ ] ComfyUI PC 노드 검색창에서 `moon`으로 찾히는지 확인

### Plan 14 — GitHub 공개용 README + 라이선스
다른 사람이 GitHub에서 받아 설치·사용할 수 있게 문서를 정리한다. 인기 커스텀 노드 README 구성과 라이선스를 참고한다.
- [x] ComfyUI·인기 노드 라이선스, Registry 라이선스 규정, README 구성 조사
- [x] 라이선스 결정: MIT (사용자 선택)
- [x] `LICENSE` 추가
- [x] `README.md` 영어로 재작성 (설치, 업데이트, 사용법, 입출력, UI 문구, 라이선스)
- [x] `README.ko.md` 한국어판 작성, 두 파일 서로 링크
- [x] 마크다운 링크 확인
- [x] 동작하지 않는 `control after generate` 팁 삭제
- [x] GitHub에 push (사용자 확인 후)

### Plan 15 — 저장소 이름 변경 (ComfyUI-Text-List → ComfyUI-Moon-Text-List)
- [x] README.md / README.ko.md 제목, clone 주소, 설치 폴더 경로 변경
- [x] 프론트엔드 확장 이름 `ComfyUI-Moon-Text-List.TextList`로 변경
- [x] 로컬 git remote 주소 변경
- [x] 테스트 + JS 문법 검사
- [x] GitHub 저장소 이름 변경 (사용자가 Settings에서 직접)
- [x] push 후 새 주소로 clone 되는지 확인 (GitHub 라이선스 MIT 인식, 옛 주소 301 연결)

## Moon Save Image (ComfyUI-Moon-SaveImage에서 통합)
통합 전 저장소의 기록이다(마지막 커밋 596bb94). 파일 이름은 통합 전 기준이다.

### Plan
입력 IMAGE를 파일로 저장하는 ComfyUI 커스텀 노드. 기본 `SaveImage` 노드를 바탕으로 WAS `Image Save` 등의 자주 쓰는 옵션을 더한다.
- 입력: images(IMAGE), filename_prefix(STRING, `%date:yyyy-MM-dd%`·`%width%`·`%height%` 치환), output_path(STRING, 비우면 output 폴더, 상대 경로는 output 기준, 절대 경로 허용), file_format(png/jpg/webp), quality(1~100, jpg·webp), save_metadata(On/Off)
- 출력: images(IMAGE, 입력 그대로 통과) + 노드 안 미리보기

### Tasks
- [x] 프로젝트 폴더 생성, git 초기화
- [x] 저장 로직 구현 (`nodes.py`)
- [x] ComfyUI 등록 (`__init__.py`)
- [x] 단위 테스트 작성 및 통과 (`tests/test_nodes.py`)
- [x] VS Code 설정 (`.vscode/settings.json`, unittest 탐색)
- [x] README, LICENSE 작성
- [x] 커밋
- [x] GitHub 저장소 생성 및 push
- [ ] ComfyUI PC에서 실제 동작 확인 (png/jpg/webp 저장, 워크플로 드래그 복원, 절대 경로 미리보기)

### Plan 2 — GitHub 공개 준비
- [x] README 공개용으로 정리: 영어 `README.md` + 한국어 `README.ko.md` (Text-List 구성)
- [x] LICENSE(MIT, javamoon71) 확인
- [ ] 저장소 공개 후 README 스크린샷 추가 (ComfyUI에서 노드 화면 캡처)

## Plan 15 — Moon Remove Background 노드
HF Space `hf-applications/background-removal`(app.py)처럼 배경을 지운 투명(RGBA) 이미지를 만든다. 사용자 요청에 따라 모델은 ComfyUI 기본 "Load Background Removal Model"(배경 제거 모델 불러오기)의 `bg_model`을 연결받아, 기본 구조의 중간에 끼워 쓴다.
- 입력: bg_removal_model(BACKGROUND_REMOVAL), image(IMAGE)
- 출력: mask(MASK, 피사체 1. 기본 Remove Background와 같음), image(IMAGE, RGBA. RGB는 원본 그대로, 알파 = 마스크)
- 기본 Remove Background를 이 노드로 교체해 쓴다(사용자 확인). 입력과 첫 출력(mask)이 기본 노드와 같고 image 출력이 더 있다
- image 출력은 기본 Remove Background → Invert Mask → Join Image with Alpha 결과와 같다
- [x] 노드 구현 (`nodes/remove_background.py`), 마스크는 기본 모델의 `encode_image`
- [x] 등록 (`__init__.py`)
- [x] 단위 테스트 (가짜 모델, `tests/test_remove_background.py`)
- [x] README, context-notes 반영
- [x] 커밋, push
- [ ] ComfyUI PC에서 기본 로더와 연결해 실행 확인

## Plan 16 — Text List 편집 입력창이 보기 모드보다 작아지지 않게
긴 문단(자동 줄바꿈)을 클릭해 편집하면 입력창이 줄바꿈 수만큼(예: 3줄)으로 줄어들었다. 보기 모드 내용 칸의 높이를 유지한다.
- [x] 편집 시작 때 보기 모드 내용 칸 높이를 재서 입력창 `min-height`로 둔다 (`web/text_list.js`)
- [x] 헤드리스 Chrome으로 수정 전(82px → 64px)·후(82px 유지) 확인, JS 문법 검사, Python 테스트
- [x] 커밋, push
- [ ] ComfyUI PC에서 긴 항목을 클릭해 높이가 유지되는지 확인

## Plan 17 — Moon Save Image 헤더 삭제 옵션
`save_metadata` Off여도 jpg는 JFIF 헤더, webp는 빈 EXIF 청크와 VP8X 헤더가 남는다. 이것까지 지우는 옵션을 UI에 추가한다(사용자 선택: `save_metadata`는 두고 `strip_header`를 맨 뒤에 추가).
- [x] `strip_header` BOOLEAN 위젯 추가(기본 Off, `save_metadata`보다 우선) (`nodes/save_image.py`)
- [x] png: 메타데이터 없이 필수 청크만, jpg: APPn·COM 세그먼트 제거, webp: EXIF 없이 단순 형식
- [x] 단위 테스트(형식별 헤더, jpg 이미지 데이터 동일, webp 알파 유지) + 전체 테스트
- [x] README 반영
- [x] 커밋, push
- [ ] ComfyUI PC에서 위젯이 보이고 저장 파일에 헤더가 없는지 확인

## Plan 18 — Text List 항목 radio로 index 선택
항목 입력창 앞에 radio 버튼을 두고, 고르면 index 위젯이 그 항목 번호로 바뀌게 한다. Python은 그대로이고 UI(`web/text_list.js`)만 바꾼다.
- [x] 행마다 번호와 입력창 사이에 radio 추가, 고르면 index 위젯 값 + callback + 캔버스 다시 그리기
- [x] index 위젯 callback을 감싸 화살표 등으로 바꿔도 radio가 따라가게 함, 빈 항목 radio는 비활성
- [x] 헤드리스 Chrome(CDP 실제 클릭)으로 선택·동기화·편집 중 클릭·빈 항목 확인 + 스크린샷 정렬 확인
- [x] README 반영, Python 테스트
- [x] 커밋, push
- [ ] ComfyUI PC에서 radio 클릭 시 index 위젯 숫자가 바로 바뀌는지 확인

## Plan 19 — Moon Text List Unpack 노드
Any Index Switch의 `value`로 나온 텍스트 배열을 받아, 항목 수만큼 `text0`, `text1`, … 출력으로 나눈다.
- 출력 슬롯(사용자 선택): 처음엔 `text0`만, 실행하면 항목 수에 맞춤. 줄어도 연결된 출력은 유지(빈 문자열). 최대 32개
- 텍스트가 아닌 값(사용자 선택): 오류로 멈춤
- [x] 노드 구현 (`nodes/text_list_unpack.py`, `INPUT_IS_LIST`, STRING × 32, `ui.count`)
- [x] 출력 슬롯 조정 프론트엔드 (`web/text_list_unpack.js`, onNodeCreated / onExecuted)
- [x] 등록 (`__init__.py`, 키 `MoonTextListUnpack`)
- [x] 단위 테스트 (`tests/test_text_list_unpack.py`) + 가짜 LiteGraph 노드로 슬롯 조정 확인
- [x] ComfyUI 소스에서 `*` → STRING 검증 통과, 캐시 실행 때도 ui 메시지가 가는지 확인
- [x] README 반영
- [x] 커밋, push
- [ ] ComfyUI PC에서 Any Index Switch → Unpack 연결, 실행 후 출력 수 변화, 워크플로 저장·불러오기 확인

## Plan 20 — Text List Unpack 출력을 연결할 때마다 하나씩 추가
처음에는 `text0` 하나, 연결하면 `text1`이 생기게 한다(사용자 요청). 실행 후 항목 수만큼 보이는 동작(Plan 19)은 그대로 둔다.
- [x] `onConnectionsChange`에서 마지막 연결 출력 뒤에 빈 출력 하나를 둠, 끊으면 정리 (`web/text_list_unpack.js`)
- [x] 항목 수를 `properties.textCount`에 저장해 워크플로를 불러올 때 출력이 줄지 않게 함
- [x] 가짜 LiteGraph 노드로 연결·끊기·실행·불러오기·32개 상한 확인, Python 테스트
- [x] README 반영
- [x] 커밋, push
- [ ] ComfyUI PC에서 `text0` 연결 시 `text1`이 바로 생기는지 확인

## Plan 21 — Text List random을 생성 후 제어로 바꾸기
`random` On/Off 대신 seed 위젯처럼 `index` 아래에서 fixed / increment / decrement / randomize를 고르게 한다(사용자가 제어 위젯 스크린샷 첨부). Any Index Switch(Plan 생성 후 제어 순환)와 같은 방식이다.
- [x] `random` 입력, `IS_CHANGED`, 전용 난수 생성기 제거, `index`에 `control_after_generate: "fixed"` (`nodes/text_list.py`)
- [x] 생성 후 제어가 내용 있는 항목 수(0 ~ 개수-1) 안에서 순환하게 함 (`web/text_list.js`)
- [x] 예전 워크플로의 `random` 값을 제어 모드로 옮김(On → randomize, Off → fixed)
- [x] 단위 테스트 수정 + 가짜 제어 위젯(프론트엔드 main 로직 이식)으로 순환·분포·링크·before 모드·이전 확인
- [x] README 반영
- [x] 커밋, push
- [ ] ComfyUI PC에서 제어 위젯이 보이고, 예전 워크플로의 random On 노드가 randomize로 열리는지 확인

## Plan 22 — Image List에 Ctrl+V로 캡처 이미지 붙여넣기
선택된 Image List 노드에 클립보드 이미지를 붙여넣으면 업로드해 목록 끝에 추가한다. UI(`web/image_list.js`)만 바꾼다.
- [x] `setup`에서 document paste capture 리스너 등록, 선택된 Image List가 하나일 때만 이미지 파일을 `addFiles`로 업로드
- [x] ComfyUI 기본 처리(새 Load Image 노드 생성)를 preventDefault + stopPropagation으로 막음, 글 입력칸·글자 선택·selectOnly는 ComfyUI와 같은 기준으로 건너뜀
- [x] 헤드리스 Chrome에서 실제 ClipboardEvent로 17가지 경우 확인(선택/미선택/두 개 선택/텍스트/입력칸/예전 selected_nodes 등), Python 테스트
- [x] README 반영
- [x] 커밋, push
- [ ] ComfyUI PC에서 캡처(Win+Shift+S) 후 노드 선택 + Ctrl+V로 목록에 추가되는지 확인

## Plan 23 — Image List random을 생성 후 제어로 바꾸기
Text List(Plan 21)와 같이 `random` On/Off 대신 `index`의 fixed / increment / decrement / randomize를 쓴다.
- [x] `random` 입력, 전용 난수 생성기, IS_CHANGED의 NaN 분기 제거, `index`에 `control_after_generate: "fixed"` (`nodes/image_list.py`). 파일 수정 시각 IS_CHANGED는 유지
- [x] 순환·random 이전 함수를 `web/index_control.js`로 옮겨 Text List와 함께 씀
- [x] Image List가 이미지 수(0 ~ 개수-1) 안에서 순환, 예전 random 값 이전 (`web/image_list.js`)
- [x] 단위 테스트 수정 + 가짜 제어 위젯으로 Text List·Image List 모두 확인, 수정 전 Image List JS는 실패 확인
- [x] README 반영(예전 increment 팁을 생성 후 제어 설명으로 바꿈)
- [x] 커밋, push
- [ ] ComfyUI PC에서 Image List 제어 위젯이 보이고, 예전 워크플로의 random On 노드가 randomize로 열리는지 확인

## Plan 24 — Text List에 `text list ##` 문자열 입력 추가
문자열을 `##`로 나눠 항목 목록으로 쓴다. `"1##\n2##\n343434 ##"`은 항목 3개(`1`, `2`, `343434`)와 같다. 처음 요청은 image_list.py였지만 사용자가 Text List라고 바로잡았다.
- [x] 선택 입력 `text_list`(STRING, forceInput, 화면 표시 `text list ##`) 추가, 연결되면 위젯 목록 대신 `##`로 나눈 항목 사용 (`nodes/text_list.py`)
- [x] 연결 중에는 index 범위를 위젯 항목 수에 묶지 않고, 생성 후 제어도 순환하지 않게 함 (`web/text_list.js`)
- [x] 단위 테스트 추가 + 헤드리스 Chrome으로 실제 `text_list.js` 확인(수정 전 JS는 8개 실패)
- [x] README 반영
- [x] 커밋, push
- [ ] ComfyUI PC에서 소켓이 `text list ##`로 보이고, 연결한 문자열의 항목이 index로 선택되는지 확인

## Plan 25 — Text List 스크롤바가 생길 때 입력창 폭 유지
데스크탑 버전에서 노드 크기를 바꾸거나 입력창을 선택하면 모든 입력창의 가로 길이가 줄어든다. 목록이 넘쳐 세로 스크롤바가 생기면 그 폭만큼 항목이 좁아지는 것으로 보고, 스크롤바 자리를 늘 비워 둔다. UI(`web/text_list.js`)만 바꾼다.
- [x] 헤드리스 Chrome에서 재현(폭을 차지하는 스크롤바: 노드 크기 변경·편집 시작 때 307 → 292px)
- [x] 목록에 `scrollbar-gutter: stable` → 같은 시나리오에서 폭이 바뀌지 않는지 확인
- [x] 테스트, context-notes 기록
- [x] 커밋, push
- [ ] ComfyUI 데스크탑에서 노드 크기 변경·입력창 선택 때 폭이 그대로인지 확인

## Plan 26 — Moon Set/Get Variable (Filtered Set/Get, 기획서 P0)
`Filtered Set Get 노드 개발 기획서.pdf`(2026-11-05)의 P0. 연결선 없이 이름으로 값을 넘기는 프론트엔드 전용 Set/Get 가상 노드 쌍이고, Get 이름 목록을 정규식 `filter`로 거른다. 사용자 결정은 이 저장소에 추가, P0까지, Nodes 2.0도 처음부터 지원, 이름은 Moon 형식이다. `web/filtered_setget.js` 하나만 추가한다(Python 없음).
- [x] 프론트엔드 API 확인(ComfyUI_frontend main 63dac6c): 가상 노드 해석, JS 전용 노드 검색 등록, 콤보 목록(두 모드), 메뉴·속성 편집, 붙여넣기 순서
- [x] Set `FSG_SetNode`: 아무 타입 입력 1개 + `Name` 글 위젯, 가상 노드(F-01)
- [x] Get `FSG_GetNode`: `Name` 콤보, 출력 1개, `getInputLink`가 같은 그래프의 같은 이름 Set 입력 링크를 돌려줌(F-02, F-03)
- [x] 이름 중복이면 `_2`, `_3`…으로 바꾸고 토스트(F-05). 이름 입력·붙여넣기·복제 때만, 워크플로 불러오기는 건드리지 않음
- [x] `filter`, `filterCaseSensitive`, `sort` 속성(`node.properties`) + 우클릭 메뉴로 편집, 매칭 규칙 1~6(F-04, F-12)
- [x] 노드 검색 표시 이름 `Moon Set Variable (FSG_SetNode)` / `Moon Get Variable (FSG_GetNode)`와 별칭
- [x] 가짜 LiteGraph로 Node 22 검증(동작 예시 5개, 현재 값 유지, 안내 항목, 중복, 연결 해석), Python 테스트
- [x] README 반영
- [x] 커밋, push
- [ ] ComfyUI(캔버스·Nodes 2.0)에서 확인: 실행 결과가 직접 연결과 같은지, API 내보내기에 Set/Get이 없는지, 목록·필터·이름 중복

## Plan 27 — Text List 다른 항목을 누르면 바로 입력 상태로
한 항목을 편집하다 다른 항목을 누르면 모든 항목이 보기 모드로 돌아가 다시 눌러야 했다. 누른 항목이 바로 입력 상태가 되게 한다. UI(`web/text_list.js`)만 바꾼다.
- [x] 헤드리스 Chrome에서 실제 마우스 입력으로 재현(편집 중 다른 항목 클릭 → 편집 없음, 포커스 BODY)
- [x] 보기 모드 칸은 mousedown에서 편집 시작 + 포커스 이동 막음, blur는 편집이 다른 항목으로 넘어갔으면 무시
- [x] 제목 포커스가 0번 행 radio로 가던 문제 수정(그 항목 안의 `input[type="text"]`)
- [x] 수정 전 6개 실패 → 수정 후 8개 통과, Python 테스트
- [x] 커밋, push
- [ ] ComfyUI(캔버스·Nodes 2.0)에서 항목을 옮겨 가며 바로 입력되는지 확인

## Plan 28 — `text list ##` 입력을 나눈 항목을 Text List 목록에 채우기
`text list ##`에 연결한 문자열(예: 사용자 예시 5개 항목)이 실행에는 쓰이지만 위젯 목록에는 보이지 않았다. 나눈 항목으로 입력창을 채운다. 연결된 문자열은 실행해야 알 수 있으므로 실행 결과로 채운다.
- [x] Python: `text_list`가 연결되어 있으면 나눈 항목 내용을 `ui`로 함께 보냄(`nodes/text_list.py`), 테스트 수정·추가
- [x] JS: `onExecuted`에서 받은 항목으로 위젯 목록을 바꿈(제목은 비움), `web/text_list.js`
- [x] 헤드리스 Chrome으로 사용자 예시 → 입력창 5개 확인, Python 테스트
- [x] README, context-notes
- [x] 커밋, push
- [ ] ComfyUI PC에서 연결 → 실행 → 입력창 5개 확인

## Plan 29 — Moon Image List Simple 노드
Image List처럼 이미지를 배열로 관리하되 index 없이 모든 이미지를 IMAGE 리스트로 출력한다. 추가는 드래그 앤 드롭과 Ctrl+V. UI는 사용자 스크린샷(원본 비율 썸네일 카드, 왼쪽 아래 번호, 오른쪽 위 ✕, 세로 스크롤)을 따른다.
- [x] `nodes/image_list_simple.py`: 입력 `images`(IMAGE_LIST_SIMPLE), 출력 `image_list`(IMAGE, OUTPUT_IS_LIST), Image List의 parse_items/load_image 재사용
- [x] 등록 `MoonImageListSimple` / `Moon Image List Simple (MoonImageListSimple)` (`__init__.py`)
- [x] 업로드·썸네일 주소·목록 해석·Ctrl+V 처리를 `web/image_list_common.js`로 옮기고 Image List가 import, 붙여넣기는 두 노드 위젯을 함께 셈
- [x] 카드 목록 위젯 `web/image_list_simple.js`(드롭, 노드 드롭, Ctrl+V, 카드 드래그 순서 변경, ✕ 삭제)
- [x] 단위 테스트 `tests/test_image_list_simple.py`(66개 통과), 헤드리스 Chrome으로 실제 JS 28개 확인 + 화면 캡처
- [x] README, context-notes
- [x] 커밋, push
- [ ] ComfyUI PC(캔버스·Nodes 2.0)에서 드롭·Ctrl+V·순서 변경과 `image_list` 출력 확인
