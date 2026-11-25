// Text List·Image List·Image List Simple 목록 아래의 Add·Copy·Clear 버튼(아이콘 + 글자)과 항목 옆 X 삭제 버튼을 같은 모양으로 만드는 공용 함수
// ComfyUI는 web 폴더의 모든 .js를 확장으로 불러오지만, 이 파일은 함수만 내보내므로 불러와도 아무 일도 하지 않는다

export const LIST_BUTTON_HEIGHT = 26;

// 24x24 선 아이콘. 색은 버튼 글자색을 따른다
const ICONS = {
  add: '<path d="M12 5v14M5 12h14"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  clear: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  remove: '<path d="M6 6l12 12M18 6L6 18"/>',
};
const CHECK_ICON = '<path d="M5 12l5 5 9-10"/>';
const BUTTON_STYLE =
  "box-sizing:border-box;flex-shrink:0;margin:0;opacity:1;cursor:pointer;" +
  "border:1px solid var(--border-color);border-radius:6px;background:var(--comfy-input-bg);";

const iconSvg = (kind) =>
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ` +
  `stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${ICONS[kind]}</svg>`;

// 기본 버튼 모양은 캔버스와 Nodes 2.0에서 다르게 보이므로 모양은 부르는 쪽에서 모두 인라인으로 정한다
function createButton(kind, title, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.title = title;
  button.dataset.kind = kind;
  button.addEventListener("pointerenter", () => (button.style.filter = "brightness(1.3)"));
  button.addEventListener("pointerleave", () => (button.style.filter = ""));
  // 편집 중인 입력창(Text List)이 버튼을 누를 때 blur로 다시 그려져 클릭이 사라지지 않게 포커스 이동을 막는다
  button.addEventListener("mousedown", (e) => e.preventDefault());
  button.addEventListener("click", onClick);
  return button;
}

// 버튼 아이콘을 잠시 초록 체크로 바꿔 동작이 끝났음을 보여 준다. 글자를 바꾸면 버튼 폭이 달라져 옆 버튼이 움직인다
export function flashCheck(button) {
  const svg = button.querySelector("svg");
  clearTimeout(button.flashTimer);
  svg.innerHTML = CHECK_ICON;
  svg.style.color = "#3fb950";
  button.flashTimer = setTimeout(() => {
    svg.innerHTML = ICONS[button.dataset.kind];
    svg.style.color = "";
  }, 1500);
}

// kind는 "add", "copy", "clear". Clear는 지우는 버튼이라 빨간 글자로 구분한다
export function createListButton(kind, label, title, onClick) {
  const button = createButton(kind, title, onClick);
  button.innerHTML = `${iconSvg(kind)}<span>${label}</span>`;
  button.style.cssText =
    `display:inline-flex;align-items:center;justify-content:center;gap:6px;height:${LIST_BUTTON_HEIGHT}px;` +
    `padding:0 12px;${BUTTON_STYLE}` +
    "font-family:inherit;font-size:12px;font-weight:600;line-height:1;" +
    `color:${kind === "clear" ? "#e5534b" : "var(--input-text)"};`;
  return button;
}

// 항목 한 줄 옆에 두는 24x24 X 아이콘 삭제 버튼
export function createRemoveButton(title, onClick) {
  const button = createButton("remove", title, onClick);
  button.innerHTML = iconSvg("remove");
  button.style.cssText =
    `display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;${BUTTON_STYLE}` +
    "color:var(--input-text);";
  return button;
}
