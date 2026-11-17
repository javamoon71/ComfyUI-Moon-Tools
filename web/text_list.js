// Text List 노드의 TEXT_LIST 입력을 항목 목록으로 보여주고, 클릭한 항목을 여러 줄 입력창으로 편집하게 하는 프론트엔드 확장
import { app } from "../../scripts/app.js";
import { migrateRandom, wrapIndexControl } from "./index_control.js";
import { pasteTargetWidget } from "./paste_target.js";

const LINE_HEIGHT = 18;
const ROW_PADDING = 12;
const ADD_BUTTON_HEIGHT = 30;
const GAP = 4;
const MAX_EDIT_LINES = 10;
const MIN_VIEW_LINES = 2;
const TITLE_HEIGHT = 24;
// Python index 위젯의 max와 같다
const INDEX_MAX = 0xffffffff;
// nodes/text_list.py SEPARATOR와 같다
const SEPARATOR = "##";
// 붙여넣은 글에서 한 줄 전체가 [제목]인 머리줄
const HEADER = /^\s*\[([^\]]*)\]\s*$/;

// 항목은 { title, text }. 제목이 생기기 전 워크플로는 문자열 항목이다
function toItem(value) {
  if (value && typeof value === "object") return { title: String(value.title ?? ""), text: String(value.text ?? "") };
  return { title: "", text: String(value ?? "") };
}

// 예전 워크플로는 줄 단위 문자열로 저장되어 있다
function parseValue(value) {
  const text = String(value ?? "");
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.length ? parsed.map(toItem) : [toItem("")];
  } catch {}
  return text.split("\n").map(toItem);
}

// Ctrl+V로 붙여넣은 글을 항목으로 나눈다. 리스트 형식은 1) JSON/Python 배열 2) ## 구분 3) [제목] 머리줄 순서로
// 하나만 고르고, 셋 다 아니면 전체가 항목 하나다. 앞뒤 공백·줄바꿈은 지우고, 제목과 내용이 모두 빈 항목은 버린다
function parsePasted(value) {
  const text = value.replace(/\r\n?/g, "\n").trim();
  const items = parseArray(text) ?? splitBySeparator(text) ?? splitByHeaders(text) ?? [toItem(text)];
  return items
    .map((item) => ({ title: item.title.trim(), text: item.text.trim() }))
    .filter((item) => item.title || item.text);
}

// 전체가 [ … ]일 때만 배열로 본다. JSON이면 Text List 위젯 값처럼 {title, text} 객체의 제목도 살리고,
// 아니면 Python 리스트 표기(['a', "b"])로 읽는다. 둘 다 아니면 null
function parseArray(text) {
  if (!text.startsWith("[") || !text.endsWith("]")) return null;
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(toItem);
  } catch {}
  return parsePythonList(text)?.map(toItem) ?? null;
}

// 문자열만 든 Python 리스트를 읽는다. 마지막 쉼표는 허용하고, 문자열이 아닌 값이 섞여 있으면 null
function parsePythonList(text) {
  const token = /\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*(,?)\s*/sy;
  const end = text.length - 1; // 닫는 ]의 위치
  const items = [];
  token.lastIndex = 1;
  while (token.lastIndex < end) {
    const match = token.exec(text);
    // 쉼표 없이 다음 값이 이어지면 리스트 표기가 아니다
    if (!match || (!match[3] && token.lastIndex < end)) return null;
    items.push(unescapePython(match[1] ?? match[2]));
  }
  return items.length ? items : null;
}

// \n, \t, \r, \xhh, \uhhhh, \Uhhhhhhhh를 글자로 바꾸고, 나머지(\\, \', \")는 \ 뒤 글자를 그대로 쓴다
function unescapePython(s) {
  return s.replace(/\\(?:x([\da-fA-F]{2})|u([\da-fA-F]{4})|U([\da-fA-F]{8})|([\s\S]))/g, (_, x, u, U, c) => {
    const hex = x ?? u ?? U;
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    return { n: "\n", t: "\t", r: "\r" }[c] ?? c;
  });
}

// text list ## 입력과 같은 규칙으로 나눈다(nodes/text_list.py split_items). 제목은 없다
function splitBySeparator(text) {
  return text.includes(SEPARATOR) ? text.split(SEPARATOR).map(toItem) : null;
}

// 머리줄부터 다음 머리줄 전까지가 한 항목이고 [ ] 안이 제목이다. 첫 머리줄 앞의 글은 제목 없는 항목이다.
// 머리줄만 있고 내용이 하나도 없으면([a, b] 한 줄 등) 이 형식이 아니다
function splitByHeaders(text) {
  const items = [{ title: "", lines: [] }];
  for (const line of text.split("\n")) {
    const header = HEADER.exec(line);
    if (header) items.push({ title: header[1], lines: [] });
    else items.at(-1).lines.push(line);
  }
  if (items.length === 1 || items.slice(1).every((item) => !item.lines.join("").trim())) return null;
  return items.map((item) => ({ title: item.title, text: item.lines.join("\n") }));
}

// 워크플로 JSON 글은 ComfyUI가 그 워크플로를 연다(ComfyUI_frontend usePaste.ts와 같은 판정). 그 동작은 그대로 둔다
function isWorkflowText(text) {
  try {
    const value = JSON.parse(text.slice(text.indexOf("{")));
    return value?.version != null && Array.isArray(value.nodes) && value.extra != null;
  } catch {
    return false;
  }
}

// 선택된 Text List 노드가 하나면 클립보드 글(Ctrl+V)을 항목으로 나눠 목록 끝에 붙인다.
// ComfyUI 기본 처리는 글을 받으면 복사해 둔 노드를 붙여넣으므로, Image List와 같이 capture 단계에서 먼저 받고 막는다.
// 노드를 복사하면 클립보드 글이 비어 있다(최신은 text/html에만 넣고, 예전은 공백 한 칸). 그때와 이미 처리된 붙여넣기는 넘긴다
function pasteIntoTextList(e) {
  const widget = e.defaultPrevented ? null : pasteTargetWidget(e, ["TEXT_LIST"]);
  const text = e.clipboardData?.getData("text/plain") ?? "";
  if (!widget || !text.trim() || isWorkflowText(text)) return;
  e.preventDefault();
  e.stopPropagation();
  const added = parsePasted(text);
  if (added.length) widget.addItems(added);
}

function createTextListWidget(node, inputName) {
  let items = [toItem("")];
  let editing = -1;
  let viewLines = MIN_VIEW_LINES;
  // 편집으로 바뀌기 전 보기 모드 내용 칸의 높이. 편집 입력창이 이보다 작아지지 않게 한다
  let editMinHeight = 0;

  // 노드 높이는 사용자가 정한 대로 두고, 넘치는 항목은 list 안에서 스크롤한다. 추가 버튼은 list 아래에 고정한다
  // 폭을 차지하는 스크롤바(데스크탑 앱 등)가 생기고 사라질 때 입력창 폭이 바뀌지 않게 스크롤바 자리를 늘 비워 둔다
  const container = document.createElement("div");
  container.style.cssText = `display:flex;flex-direction:column;gap:${GAP}px;padding:4px 0;height:100%;box-sizing:border-box;`;
  const list = document.createElement("div");
  list.style.cssText = `flex:1;min-height:0;overflow-y:auto;scrollbar-gutter:stable;display:flex;flex-direction:column;gap:${GAP}px;`;
  container.append(list);

  // show_title 위젯이 Off면 보기/편집 모드 모두 제목을 숨긴다
  const showTitle = () => node.widgets?.find((w) => w.name === "show_title")?.value !== false;

  // 편집 중인 입력창은 한 줄 여유를 두되 최대 줄 수를 넘으면 입력창 안에서 스크롤한다
  const editLineCount = (i) => Math.min(items[i].text.split("\n").length + 1, MAX_EDIT_LINES);

  // Python이 빈 항목을 건너뛰므로 index로 고를 수 있는 항목은 내용이 있는 것뿐이다
  const itemCount = () => items.filter((v) => v.text.trim()).length;

  // text_list(## 문자열) 입력이 연결되면 항목이 실행할 때 정해져 여기서는 개수를 알 수 없다
  const textListLinked = () => node.inputs?.find((input) => input.name === "text_list")?.link != null;

  // index 위젯의 최대값을 항목 수에 맞춰 화살표로 범위를 넘지 않게 한다
  // text_list가 연결되어 있으면 범위를 묶지 않는다. Python이 항목 수로 나눈 나머지를 쓴다
  const refreshIndexRange = () => {
    const indexWidget = node.widgets?.find((w) => w.name === "index");
    if (!indexWidget) return;
    const max = textListLinked() ? INDEX_MAX : Math.max(0, itemCount() - 1);
    indexWidget.options.max = max;
    if (indexWidget.value > max) indexWidget.value = max;
  };

  // index 위젯 값과 번호가 같은 항목의 radio를 선택 상태로 둔다
  const syncRadios = () => {
    const index = String(node.widgets?.find((w) => w.name === "index")?.value);
    list.querySelectorAll("input[data-radio]").forEach((el) => {
      el.checked = !el.disabled && el.value === index;
    });
  };

  // radio로 고른 항목 번호를 index 위젯에 넣는다
  const selectIndex = (value) => {
    const indexWidget = node.widgets?.find((w) => w.name === "index");
    if (!indexWidget) return;
    indexWidget.value = value;
    indexWidget.callback?.(value);
    node.setDirtyCanvas(true, false);
    syncRadios();
  };

  // Python이 빈 항목을 건너뛰므로 번호도 비어 있지 않은 항목만 센다. 번호가 없는 빈 항목은 radio로 고를 수 없다
  const refreshLabels = () => {
    let n = 0;
    [...list.children].forEach((row, i) => {
      const number = items[i].text.trim() ? String(n++) : "";
      row.querySelector("span[data-label]").textContent = number || "-";
      const radio = row.querySelector("input[data-radio]");
      radio.value = number;
      radio.disabled = !number;
    });
    refreshIndexRange();
    syncRadios();
  };

  // 제목 label을 눌렀으면 제목 입력창에, 내용을 눌렀으면 내용 입력창에 포커스를 둔다
  const startEdit = (i, field = "text") => {
    // rows는 줄바꿈 수로 정해 자동 줄바꿈된 긴 줄을 세지 못하므로, 보기 모드 높이를 재 두고 그만큼은 유지한다
    // 새 항목은 아직 그려지지 않아 0이다
    editMinHeight = list.children[i]?.querySelector("div[data-view]")?.offsetHeight ?? 0;
    editing = i;
    render();
    // 행마다 radio(input)가 있으므로 그 항목 안의 제목 입력창을 찾는다
    list.children[i]?.querySelector(field === "title" ? 'input[type="text"]' : "textarea")?.focus();
  };

  // 보기 모드 칸은 click이 아니라 mousedown에서 편집을 시작한다. 다른 항목을 편집 중이면 mousedown의 포커스 이동이
  // 그 입력창의 blur → 다시 그리기를 일으켜 누른 칸이 사라지고 click이 오지 않기 때문이다. 포커스 이동도 막아 새 입력창이 포커스를 지킨다
  const editOnPress = (el, i, field) => {
    el.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      startEdit(i, field);
    });
  };

  const createButton = (text, title, onClick) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.title = title;
    // 편집 중인 입력창의 blur로 다시 그려져 클릭이 사라지지 않게 포커스 이동을 막는다
    button.addEventListener("mousedown", (e) => e.preventDefault());
    button.addEventListener("click", onClick);
    return button;
  };

  // 제목(1줄)을 내용 바로 위에 둔다. 보기 모드에서는 둘 다 글자로, 편집 모드에서는 둘 다 입력창으로 보여준다
  const createBody = (item, i) => {
    const body = document.createElement("div");
    body.style.cssText = "flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;";

    const boxStyle =
      "min-width:0;padding:4px 6px;border-radius:4px;font:inherit;font-size:12px;" +
      `line-height:${LINE_HEIGHT}px;white-space:pre-wrap;word-break:break-all;box-sizing:border-box;` +
      "border:1px solid var(--border-color);background:var(--comfy-input-bg);color:var(--input-text);";
    const titleStyle =
      `height:${TITLE_HEIGHT}px;min-width:0;padding:0 6px;border-radius:4px;font:inherit;font-size:12px;font-weight:bold;` +
      `line-height:${TITLE_HEIGHT - 2}px;box-sizing:border-box;color:var(--input-text);`;

    if (i !== editing) {
      const title = document.createElement("div");
      title.textContent = item.title || "(제목 없음)";
      title.style.cssText =
        titleStyle +
        "border:1px solid transparent;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" +
        `cursor:text;${item.title ? "" : "opacity:0.5;font-weight:normal;"}`;
      editOnPress(title, i, "title");

      const view = document.createElement("div");
      view.textContent = item.text || "(비어 있음)";
      view.dataset.view = "";
      view.style.cssText =
        boxStyle +
        `display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:${viewLines};overflow:hidden;` +
        `cursor:text;${item.text ? "" : "opacity:0.5;"}`;
      editOnPress(view, i, "text");

      if (showTitle()) body.append(title);
      body.append(view);
      return body;
    }

    const title = document.createElement("input");
    title.type = "text";
    title.value = item.title;
    title.placeholder = "제목";
    title.style.cssText =
      titleStyle +
      "flex-shrink:0;border:1px solid var(--border-color);background:var(--comfy-input-bg);outline:1px solid var(--input-text);";
    title.addEventListener("input", () => {
      items[i].title = title.value;
    });

    const textarea = document.createElement("textarea");
    textarea.value = item.text;
    textarea.rows = editLineCount(i);
    textarea.placeholder = "내용";
    textarea.style.cssText =
      boxStyle + `flex-shrink:0;resize:none;outline:1px solid var(--input-text);min-height:${editMinHeight}px;`;
    textarea.addEventListener("input", () => {
      items[i].text = textarea.value;
      textarea.rows = editLineCount(i);
      refreshLabels();
    });

    // 제목은 1줄이라 Enter를 누르면 내용 입력창으로 넘어간다
    title.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      textarea.focus();
    });

    // 제목과 내용 입력창 사이를 오갈 때는 편집을 유지하고, 항목 밖으로 나가면 보기 모드로 돌아간다
    // 다른 항목으로 편집이 넘어가 이 입력창이 지워질 때 오는 blur는 무시한다
    const onBlur = (e) => {
      if (editing !== i || body.contains(e.relatedTarget)) return;
      editing = -1;
      render();
    };
    title.addEventListener("blur", onBlur);
    textarea.addEventListener("blur", onBlur);

    if (showTitle()) body.append(title);
    body.append(textarea);
    return body;
  };

  const render = () => {
    list.replaceChildren();
    items.forEach((item, i) => {
      const row = document.createElement("div");
      row.style.cssText = `display:flex;align-items:flex-start;gap:${GAP}px;flex-shrink:0;`;

      const label = document.createElement("span");
      label.style.cssText = `min-width:24px;text-align:right;opacity:0.7;font-size:12px;line-height:${TITLE_HEIGHT}px;`;
      label.dataset.label = "";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.title = "index로 선택";
      radio.dataset.radio = "";
      radio.style.cssText = `margin:0;height:${TITLE_HEIGHT}px;flex-shrink:0;cursor:pointer;`;
      // 다른 항목을 편집 중일 때 입력창의 blur로 다시 그려져 클릭이 사라지지 않게 포커스 이동을 막는다
      radio.addEventListener("mousedown", (e) => e.preventDefault());
      radio.addEventListener("change", () => selectIndex(Number(radio.value)));

      const remove = createButton("✕", "항목 삭제", () => {
        items.splice(i, 1);
        if (items.length === 0) items.push(toItem(""));
        editing = -1;
        render();
      });
      remove.style.cssText = "width:24px;height:24px;flex-shrink:0;cursor:pointer;";

      row.append(label, radio, createBody(item, i), remove);
      list.append(row);
    });
    refreshLabels();
    fitViewLines();
  };

  // 노드가 커질수록 목록이 스크롤 없이 다 들어가는 만큼 보기 모드 줄 수를 늘린다
  // 편집 중에는 다른 항목이 움직이지 않게 그대로 두고, 노드가 화면에 없어 높이가 0이면 건너뛴다
  const fitViewLines = () => {
    if (editing !== -1 || !list.clientHeight) return;
    const views = list.querySelectorAll("div[data-view]");
    const fits = (n) => {
      views.forEach((el) => el.style.setProperty("-webkit-line-clamp", String(n)));
      return list.scrollHeight <= list.clientHeight;
    };
    // 한 항목이 list 높이보다 많은 줄을 보일 수는 없으므로 그 줄 수까지만 이진 탐색한다
    let lo = MIN_VIEW_LINES;
    let hi = Math.max(lo, Math.floor(list.clientHeight / LINE_HEIGHT));
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (fits(mid)) lo = mid;
      else hi = mid - 1;
    }
    viewLines = lo;
    fits(viewLines);
  };
  // container 크기는 노드 크기로만 정해진다. list는 스크롤바가 생기고 사라질 때도 크기가 바뀌어 줄 수를 맞추다 다시 호출되므로 쓰지 않는다
  new ResizeObserver(fitViewLines).observe(container);

  const add = createButton("+ 항목 추가", "항목 추가", () => {
    items.push(toItem(""));
    startEdit(items.length - 1, showTitle() ? "title" : "text");
  });
  add.style.cssText = `height:${ADD_BUTTON_HEIGHT - 4}px;flex-shrink:0;cursor:pointer;`;
  container.append(add);

  const widget = node.addDOMWidget(inputName, "TEXT_LIST", container, {
    getValue: () => JSON.stringify(items),
    setValue: (value) => {
      items = parseValue(value);
      editing = -1;
      render();
    },
    // 최소 높이: 제목 + 2줄 내용 항목 하나 + 추가 버튼
    getMinHeight: () => TITLE_HEIGHT + 2 + MIN_VIEW_LINES * LINE_HEIGHT + ROW_PADDING + GAP + ADD_BUTTON_HEIGHT + 8,
  });

  // 생성 후 제어는 개수가 0이면 순환하지 않고 기본 동작을 한다
  widget.itemCount = () => (textListLinked() ? 0 : itemCount());
  widget.refreshIndexRange = refreshIndexRange;
  widget.syncRadios = syncRadios;
  widget.render = render;
  // 붙여넣은 항목을 목록 뒤에 붙인다. 제목과 내용이 모두 빈 항목(새 노드의 빈 칸 등)은 지운다
  widget.addItems = (added) => {
    items = [...items.filter((item) => item.title.trim() || item.text.trim()), ...added];
    editing = -1;
    render();
  };
  render();
  return { widget };
}

app.registerExtension({
  name: "ComfyUI-Moon-Tools.TextList",
  setup() {
    document.addEventListener("paste", pasteIntoTextList, true);
  },
  getCustomWidgets() {
    return {
      TEXT_LIST: (node, inputName) => createTextListWidget(node, inputName),
    };
  },
  // TEXT_LIST 위젯이 만들어질 때는 index 위젯이 아직 없어서 노드 생성 후 한 번 더 맞춘다
  // show_title 위젯도 같은 이유로 여기서 연결하고, 워크플로를 불러와 값이 바뀐 뒤에도 다시 그린다
  // index 위젯을 화살표 등으로 바꾸면 radio 선택도 따라가게 한다
  // index의 생성 후 제어는 항목 수 안에서 순환하게 하고, 예전 random 값은 워크플로를 불러올 때 제어 모드로 옮긴다
  nodeCreated(node) {
    const textList = node.widgets?.find((w) => w.type === "TEXT_LIST");
    if (!textList) return;
    textList.refreshIndexRange();

    const index = node.widgets.find((w) => w.name === "index");
    if (index) {
      const callback = index.callback;
      index.callback = function (...args) {
        const result = callback?.apply(this, args);
        textList.syncRadios();
        return result;
      };
    }
    const control = index?.linkedWidgets?.[0];
    if (control) wrapIndexControl(index, control, textList.itemCount);

    const showTitle = node.widgets.find((w) => w.name === "show_title");
    if (showTitle) {
      const callback = showTitle.callback;
      showTitle.callback = function (...args) {
        const result = callback?.apply(this, args);
        textList.render();
        return result;
      };
    }
    const onConfigure = node.onConfigure;
    node.onConfigure = function (...args) {
      const result = onConfigure?.apply(this, args);
      if (control) migrateRandom(node, control, args[0]);
      textList.render();
      return result;
    };
    // text_list 입력을 연결하거나 끊으면 index 범위를 다시 맞춘다
    const onConnectionsChange = node.onConnectionsChange;
    node.onConnectionsChange = function (...args) {
      const result = onConnectionsChange?.apply(this, args);
      textList.refreshIndexRange();
      return result;
    };
    // text_list(## 문자열)를 연결해 실행하면 Python이 나눈 항목 내용을 보낸다(nodes/text_list.py UI_ITEMS).
    // 그 항목으로 입력창을 채운다. 제목은 없으므로 비운다. value 대입은 DOM 위젯의 setValue를 거친다
    const onExecuted = node.onExecuted;
    node.onExecuted = function (output, ...args) {
      const result = onExecuted?.call(this, output, ...args);
      const texts = output?.text_list_items;
      if (Array.isArray(texts)) textList.value = JSON.stringify(texts);
      return result;
    };
    textList.render();
  },
});
