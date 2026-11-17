// Ctrl+V를 받을 목록 위젯(Image List·Text List)을 선택된 노드에서 찾는 공용 함수
// ComfyUI는 web 폴더의 모든 .js를 확장으로 불러오지만, 이 파일은 함수만 내보내므로 불러와도 아무 일도 하지 않는다
import { app } from "../../scripts/app.js";

// 글 입력칸에 붙여넣을 때는 브라우저 기본 동작에 맡긴다. ComfyUI 붙여넣기 처리와 같은 기준이다
const NON_TEXT_INPUT_TYPES = ["button", "checkbox", "file", "hidden", "image", "radio", "range", "reset", "submit"];

function isTextInput(target) {
  return (
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable) ||
    (target instanceof HTMLInputElement && !NON_TEXT_INPUT_TYPES.includes(target.type))
  );
}

// paste 대상 요소(포커스가 있는 곳)가 속한 노드. Nodes 2.0은 노드 요소에 data-node-id가 있고,
// 예전 캔버스는 DOM 위젯 요소만 노드 위에 떠 있어서 그 요소를 가진 노드를 찾는다
function nodeOf(target, graph) {
  if (!(target instanceof Element) || !graph) return null;
  const id = target.closest("[data-node-id]")?.dataset.nodeId;
  if (id != null) return graph.nodes.find((node) => String(node.id) === id) ?? null;
  return graph.nodes.find((node) => node.widgets?.some((w) => w.element?.contains(target))) ?? null;
}

// 포커스가 있는 노드에 types 위젯이 있으면 그 위젯을 돌려준다. Nodes 2.0은 목록 빈 곳을 눌러도 노드가 선택되지 않고
// 포커스만 그 노드로 가기 때문이다. 아니면 선택된 노드 중 types 위젯이 있는 노드가 하나일 때 그 위젯이고,
// 두 개 이상이면 어디에 넣을지 모호해 null이다.
// 글 입력칸, 글자가 선택된 상태, selectOnly이면 ComfyUI·브라우저 기본 동작에 맡기도록 null이다.
// canvas.current_node는 이름과 달리 마지막으로 그린 노드라서 선택 목록을 본다
export function pasteTargetWidget(e, types) {
  const canvas = app.canvas;
  if (!canvas || canvas.selectOnly || isTextInput(e.target) || window.getSelection()?.isCollapsed === false) return null;
  const focused = nodeOf(e.target, canvas.graph ?? app.graph)?.widgets?.find((w) => types.includes(w.type));
  if (focused) return focused;
  // selected_nodes는 최신 프론트엔드에서 경고를 내므로 selectedItems가 없는 예전 버전에서만 쓴다
  const selected = canvas.selectedItems ? [...canvas.selectedItems] : Object.values(canvas.selected_nodes ?? {});
  const widgets = selected.map((item) => item.widgets?.find((w) => types.includes(w.type))).filter(Boolean);
  return widgets.length === 1 ? widgets[0] : null;
}
