// Text List·Image List·Image List Simple 목록 아래의 Add·Clear 버튼을 같은 모양(아이콘 + 글자)으로 만드는 공용 함수
// ComfyUI는 web 폴더의 모든 .js를 확장으로 불러오지만, 이 파일은 함수만 내보내므로 불러와도 아무 일도 하지 않는다

export const LIST_BUTTON_HEIGHT = 26;

// 24x24 선 아이콘. 색은 버튼 글자색을 따른다
const ICONS = {
  add: '<path d="M12 5v14M5 12h14"/>',
  clear: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
};

// kind는 "add" 또는 "clear". Clear는 지우는 버튼이라 빨간 글자로 구분한다.
// 기본 버튼 모양은 캔버스와 Nodes 2.0에서 다르게 보이므로 모양을 모두 인라인으로 정한다
export function createListButton(kind, label, title, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.title = title;
  button.innerHTML =
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ` +
    `stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${ICONS[kind]}</svg><span>${label}</span>`;
  button.style.cssText =
    `display:inline-flex;align-items:center;justify-content:center;gap:6px;height:${LIST_BUTTON_HEIGHT}px;` +
    "padding:0 12px;box-sizing:border-box;flex-shrink:0;margin:0;opacity:1;cursor:pointer;" +
    "border:1px solid var(--border-color);border-radius:6px;background:var(--comfy-input-bg);" +
    "font-family:inherit;font-size:12px;font-weight:600;line-height:1;" +
    `color:${kind === "clear" ? "#e5534b" : "var(--input-text)"};`;
  button.addEventListener("pointerenter", () => (button.style.filter = "brightness(1.3)"));
  button.addEventListener("pointerleave", () => (button.style.filter = ""));
  // 편집 중인 입력창(Text List)이 버튼을 누를 때 blur로 다시 그려져 클릭이 사라지지 않게 포커스 이동을 막는다
  button.addEventListener("mousedown", (e) => e.preventDefault());
  button.addEventListener("click", onClick);
  return button;
}
