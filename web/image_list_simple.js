// Image List Simple 노드의 이미지 목록을 원본 비율 썸네일 카드로 보여주고, 드래그 앤 드롭·Ctrl+V로 추가, 카드 드래그로 순서 변경, ✕로 삭제하는 프론트엔드 확장
import { app } from "../../scripts/app.js";
import { parseValue, pasteIntoImageList, thumbnailUrl, uploadImage } from "./image_list_common.js";

// 썸네일 높이는 노드 안에 카드가 모두 들어가도록 MIN ~ THUMB_HEIGHT 사이에서 고른다
const THUMB_HEIGHT = 80;
const MIN_THUMB_HEIGHT = 32;
const BORDER = 2;
const GAP = 6;
const CARD_DRAG_TYPE = "application/x-comfyui-moon-image-list-simple-card";

function createImageListSimpleWidget(node, inputName) {
  let items = [];
  let draggedIndex = null;
  // 썸네일 원본 비율(너비/높이). 이미지를 불러오기 전에는 1로 본다
  const ratios = new Map();

  // 카드는 노드 폭에 맞춰 가로를 먼저 채우고 넘치면 다음 줄로 간다.
  // 노드 높이는 사용자가 정한 대로 두고, 최소 크기로도 넘치는 줄은 목록 안에서 스크롤한다
  const list = document.createElement("div");
  list.style.cssText =
    `height:100%;box-sizing:border-box;overflow-y:auto;display:flex;flex-wrap:wrap;align-items:flex-start;align-content:flex-start;` +
    `gap:${GAP}px;padding:${GAP}px;background:var(--comfy-input-bg);border:1px solid var(--border-color);border-radius:4px;`;

  // 썸네일 높이를 CSS 변수로 바꾼다. ✕와 번호도 함께 줄인다
  const setThumbHeight = (h) => {
    list.style.setProperty("--moon-thumb", `${h}px`);
    list.style.setProperty("--moon-x", `${Math.max(14, Math.min(20, Math.round(h / 4)))}px`);
    list.style.setProperty("--moon-badge", `${Math.max(9, Math.min(11, Math.round(h / 7)))}px`);
  };
  setThumbHeight(THUMB_HEIGHT);

  // 썸네일 높이 h로 카드를 가로부터 채웠을 때 목록 내용의 높이. flex-wrap 줄바꿈을 그대로 따라 한다
  const layoutHeight = (h, width) => {
    let rows = 1;
    let x = 0;
    for (const item of items) {
      const w = Math.min(h * (ratios.get(item) ?? 1) + BORDER * 2, width);
      if (x > 0 && x + GAP + w > width) {
        rows += 1;
        x = w;
      } else {
        x += (x > 0 ? GAP : 0) + w;
      }
    }
    return rows * (h + BORDER * 2) + (rows - 1) * GAP;
  };

  // 모든 카드가 목록 안에 들어가는 가장 큰 썸네일 높이를 고른다. 최소 크기로도 넘치면 최소 크기로 두고 스크롤한다.
  // 소수점 폭 차이로 브라우저가 줄을 하나 더 만들지 않도록 폭을 1px 덜 잡는다
  const fit = () => {
    const width = list.clientWidth - GAP * 2 - 1;
    const height = list.clientHeight - GAP * 2;
    if (width <= 0 || height <= 0 || items.length === 0) return;
    let lo = MIN_THUMB_HEIGHT;
    let hi = THUMB_HEIGHT;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (layoutHeight(mid, width) <= height) lo = mid;
      else hi = mid - 1;
    }
    setThumbHeight(lo);
  };
  // 크기 변경·목록 변경·이미지 로드가 한 프레임에 여러 번 와도 한 번만 맞춘다.
  // ResizeObserver 콜백 안에서 바로 바꾸면 스크롤바가 생기고 없어지며 관찰 루프 경고가 날 수 있다
  let fitPending = false;
  const scheduleFit = () => {
    if (fitPending) return;
    fitPending = true;
    requestAnimationFrame(() => {
      fitPending = false;
      fit();
    });
  };
  new ResizeObserver(scheduleFit).observe(list);

  const clearDropMarks = () => {
    list.querySelectorAll("[data-drop-position]").forEach((el) => {
      el.style.boxShadow = "";
      delete el.dataset.dropPosition;
    });
  };
  // 카드 오른쪽 절반에 놓으면 그 카드 뒤로 옮긴다
  const isAfter = (e, card) => e.clientX >= card.getBoundingClientRect().left + card.offsetWidth / 2;

  const render = () => {
    list.replaceChildren();
    scheduleFit();
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = "이미지를 끌어다 놓거나 Ctrl+V로 붙여넣으세요";
      // 줄을 위로 붙여 쌓으므로 margin:auto로는 세로 가운데가 되지 않는다. 목록을 채워서 가운데에 둔다
      empty.style.cssText =
        "width:100%;height:100%;display:flex;align-items:center;justify-content:center;text-align:center;opacity:0.5;font-size:12px;";
      list.append(empty);
      return;
    }
    items.forEach((item, i) => {
      const card = document.createElement("div");
      card.draggable = true;
      card.title = item;
      card.style.cssText =
        "position:relative;flex-shrink:0;max-width:100%;box-sizing:border-box;line-height:0;cursor:grab;" +
        `border:${BORDER}px solid var(--input-text);border-radius:8px;overflow:hidden;`;

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
        card.style.boxShadow = `${after ? GAP - 2 : 2 - GAP}px 0 0 var(--input-text)`;
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

      // 높이를 맞추고 너비는 원본 비율을 따른다. 노드보다 넓으면 비율을 지킨 채 줄인다.
      // 비율을 알게 되면 크기를 다시 맞춘다
      const thumb = document.createElement("img");
      thumb.addEventListener("load", () => {
        if (!thumb.naturalWidth || !thumb.naturalHeight) return;
        ratios.set(item, thumb.naturalWidth / thumb.naturalHeight);
        scheduleFit();
      });
      thumb.src = thumbnailUrl(item);
      thumb.draggable = false;
      thumb.style.cssText = "display:block;height:var(--moon-thumb);width:auto;max-width:100%;object-fit:contain;";

      const number = document.createElement("span");
      number.textContent = String(i + 1);
      number.style.cssText =
        "position:absolute;left:0;bottom:0;padding:1px 5px;font-size:var(--moon-badge);line-height:1.3;" +
        "color:#fff;background:#000b;border-top-right-radius:6px;pointer-events:none;";

      const remove = document.createElement("button");
      remove.textContent = "✕";
      remove.title = "삭제";
      remove.style.cssText =
        "position:absolute;top:calc(var(--moon-x) / 5);right:calc(var(--moon-x) / 5);width:var(--moon-x);height:var(--moon-x);" +
        "padding:0;border:none;border-radius:50%;font-size:calc(var(--moon-x) * 0.55);line-height:var(--moon-x);" +
        "color:#fff;background:#000b;cursor:pointer;";
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
    // 최소 높이: 가장 작은 카드 한 줄. 노드를 이만큼 줄일 수 있다
    getMinHeight: () => MIN_THUMB_HEIGHT + BORDER * 2 + GAP * 2 + 2,
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
