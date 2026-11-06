// Image List Simple 노드의 이미지 목록을 원본 비율 썸네일 카드로 보여주고, 드래그 앤 드롭·Ctrl+V로 추가, 카드 드래그로 순서 변경, ✕로 삭제하는 프론트엔드 확장
import { app } from "../../scripts/app.js";
import { parseValue, pasteIntoImageList, thumbnailUrl, uploadImage } from "./image_list_common.js";

const THUMB_HEIGHT = 80;
const GAP = 6;
const CARD_DRAG_TYPE = "application/x-comfyui-moon-image-list-simple-card";

function createImageListSimpleWidget(node, inputName) {
  let items = [];
  let draggedIndex = null;

  // 노드 높이는 사용자가 정한 대로 두고, 넘치는 카드는 목록 안에서 스크롤한다
  const list = document.createElement("div");
  list.style.cssText =
    `height:100%;box-sizing:border-box;overflow-y:auto;display:flex;flex-direction:column;align-items:flex-start;` +
    `gap:${GAP}px;padding:${GAP}px;background:var(--comfy-input-bg);border:1px solid var(--border-color);border-radius:4px;`;

  const clearDropMarks = () => {
    list.querySelectorAll("[data-drop-position]").forEach((el) => {
      el.style.boxShadow = "";
      delete el.dataset.dropPosition;
    });
  };
  // 카드 아래쪽 절반에 놓으면 그 카드 뒤로 옮긴다
  const isAfter = (e, card) => e.clientY >= card.getBoundingClientRect().top + card.offsetHeight / 2;

  const render = () => {
    list.replaceChildren();
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = "이미지를 끌어다 놓거나 Ctrl+V로 붙여넣으세요";
      empty.style.cssText = "margin:auto;opacity:0.5;font-size:12px;text-align:center;";
      list.append(empty);
      return;
    }
    items.forEach((item, i) => {
      const card = document.createElement("div");
      card.draggable = true;
      card.title = item;
      card.style.cssText =
        "position:relative;flex-shrink:0;max-width:100%;box-sizing:border-box;line-height:0;cursor:grab;" +
        "border:2px solid var(--input-text);border-radius:8px;overflow:hidden;";

      card.addEventListener("dragstart", (e) => {
        draggedIndex = i;
        e.dataTransfer.setData(CARD_DRAG_TYPE, String(i));
        e.dataTransfer.effectAllowed = "move";
        e.stopPropagation();
        card.style.opacity = "0.5";
      });
      card.addEventListener("dragend", () => {
        draggedIndex = null;
        card.style.opacity = "";
        clearDropMarks();
      });
      card.addEventListener("dragover", (e) => {
        if (!e.dataTransfer.types.includes(CARD_DRAG_TYPE)) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        const after = isAfter(e, card);
        card.dataset.dropPosition = after ? "after" : "before";
        // 카드 사이 간격에 놓일 위치를 선으로 보여 준다
        card.style.boxShadow = `0 ${after ? GAP - 2 : 2 - GAP}px 0 var(--input-text)`;
      });
      card.addEventListener("dragleave", (e) => {
        if (card.contains(e.relatedTarget)) return;
        card.style.boxShadow = "";
        delete card.dataset.dropPosition;
      });
      card.addEventListener("drop", (e) => {
        if (!e.dataTransfer.types.includes(CARD_DRAG_TYPE) || draggedIndex === null) return;
        e.preventDefault();
        e.stopPropagation();
        const destination = i + (isAfter(e, card) ? 1 : 0);
        const [moved] = items.splice(draggedIndex, 1);
        items.splice(destination > draggedIndex ? destination - 1 : destination, 0, moved);
        draggedIndex = null;
        render();
      });

      // 높이를 맞추고 너비는 원본 비율을 따른다. 노드보다 넓으면 비율을 지킨 채 줄인다
      const thumb = document.createElement("img");
      thumb.src = thumbnailUrl(item);
      thumb.draggable = false;
      thumb.style.cssText = `display:block;height:${THUMB_HEIGHT}px;width:auto;max-width:100%;object-fit:contain;`;

      const number = document.createElement("span");
      number.textContent = String(i + 1);
      number.style.cssText =
        "position:absolute;left:0;bottom:0;padding:2px 6px;font-size:11px;line-height:1.3;" +
        "color:#fff;background:#000b;border-top-right-radius:6px;pointer-events:none;";

      const remove = document.createElement("button");
      remove.textContent = "✕";
      remove.title = "삭제";
      remove.style.cssText =
        "position:absolute;top:4px;right:4px;width:20px;height:20px;padding:0;border:none;border-radius:50%;" +
        "font-size:11px;line-height:20px;color:#fff;background:#000b;cursor:pointer;";
      remove.addEventListener("click", (e) => {
        e.stopPropagation();
        items.splice(i, 1);
        render();
      });

      card.append(thumb, number, remove);
      list.append(card);
    });
  };

  const addFiles = async (files) => {
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      try {
        items.push(await uploadImage(file));
      } catch (e) {
        alert(`이미지 업로드 실패: ${file.name}\n${e.message}`);
      }
      render();
    }
  };

  // 목록 위에 파일을 끌어다 놓으면 업로드한다. ComfyUI가 이미지를 워크플로로 불러오지 않도록 이벤트 전파를 막는다
  const hasFiles = (e) => e.dataTransfer?.types?.includes("Files");
  list.addEventListener("dragover", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.stopPropagation();
    list.style.outline = "2px dashed var(--input-text)";
  });
  list.addEventListener("dragleave", (e) => {
    if (!list.contains(e.relatedTarget)) list.style.outline = "";
  });
  list.addEventListener("drop", (e) => {
    list.style.outline = "";
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.stopPropagation();
    addFiles([...e.dataTransfer.files]);
  });

  const widget = node.addDOMWidget(inputName, "IMAGE_LIST_SIMPLE", list, {
    getValue: () => JSON.stringify(items),
    setValue: (value) => {
      items = parseValue(value);
      render();
    },
    // 최소 높이: 카드 하나
    getMinHeight: () => THUMB_HEIGHT + 4 + GAP * 2 + 2,
  });

  widget.addFiles = addFiles;
  render();
  return { widget };
}

app.registerExtension({
  name: "ComfyUI-Moon-Tools.ImageListSimple",
  setup() {
    // Image List 확장도 같은 함수를 등록하므로 리스너는 하나만 남는다
    document.addEventListener("paste", pasteIntoImageList, true);
  },
  getCustomWidgets() {
    return {
      IMAGE_LIST_SIMPLE: (node, inputName) => createImageListSimpleWidget(node, inputName),
    };
  },
  nodeCreated(node) {
    const widget = node.widgets?.find((w) => w.type === "IMAGE_LIST_SIMPLE");
    if (!widget) return;
    // 목록 밖(제목 영역)에 놓아도 이 노드에 추가한다
    node.onDragOver = (e) => !!e.dataTransfer?.types?.includes("Files");
    node.onDragDrop = (e) => {
      const files = [...(e.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith("image/"));
      if (!files.length) return false;
      widget.addFiles(files);
      return true;
    };
  },
});
