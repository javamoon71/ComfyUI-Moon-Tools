// Image List·Image List Simple 위젯이 함께 쓰는 목록 해석, 썸네일 주소, 업로드, Ctrl+V 붙여넣기 함수
// ComfyUI는 web 폴더의 모든 .js를 확장으로 불러오지만, 이 파일은 함수만 내보내므로 불러와도 아무 일도 하지 않는다
import { api } from "../../scripts/api.js";
import { pasteTargetWidget } from "./paste_target.js";

export function parseValue(value) {
  try {
    const parsed = JSON.parse(String(value ?? ""));
    if (Array.isArray(parsed)) return parsed.map(String).filter((v) => v.trim());
  } catch {}
  return String(value ?? "").split("\n").filter((v) => v.trim());
}

// 저장 이름은 기본 Load Image와 같은 "subfolder/name" 형식이다
export function thumbnailUrl(item) {
  const slash = item.lastIndexOf("/");
  const subfolder = slash < 0 ? "" : item.slice(0, slash);
  const filename = item.slice(slash + 1);
  const params = new URLSearchParams({ filename, subfolder, type: "input" });
  return api.apiURL(`/view?${params}`);
}

export async function uploadImage(file) {
  const body = new FormData();
  body.append("image", file);
  const resp = await api.fetchApi("/upload/image", { method: "POST", body });
  if (resp.status !== 200) throw new Error(`${resp.status} ${resp.statusText}`);
  const data = await resp.json();
  return data.subfolder ? `${data.subfolder}/${data.name}` : data.name;
}

// 붙여넣기를 받는 위젯 타입. 두 노드를 함께 세어 이미지 목록 노드가 하나만 선택되었을 때만 추가한다
const PASTE_WIDGET_TYPES = ["IMAGE_LIST", "IMAGE_LIST_SIMPLE"];

// 선택된 이미지 목록 노드가 하나면 클립보드 이미지(Ctrl+V)를 그 목록에 추가한다.
// ComfyUI 기본 처리는 이미지 노드가 아니면 새 Load Image 노드를 만들므로 capture 단계에서 먼저 받는다.
// 최신 프론트엔드는 preventDefault된 붙여넣기를 건너뛰고, 그 검사가 없는 예전 버전은 stopPropagation으로 막는다.
// 두 확장이 같은 함수를 등록하므로 브라우저가 리스너를 하나로 합친다
export function pasteIntoImageList(e) {
  const widget = pasteTargetWidget(e, PASTE_WIDGET_TYPES);
  if (!widget) return;
  const files = [...(e.clipboardData?.items ?? [])]
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter(Boolean);
  if (!files.length) return;
  e.preventDefault();
  e.stopPropagation();
  widget.addFiles(files);
}
