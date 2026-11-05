// 연결선 없이 이름으로 값을 넘기는 Set/Get 가상 노드 쌍과, Get 이름 목록을 정규식 filter로 거르는 프론트엔드 확장
import { app } from "../../scripts/app.js";

const SET_TYPE = "FSG_SetNode";
const GET_TYPE = "FSG_GetNode";
const SET_TITLE = "Moon Set Variable (FSG_SetNode)";
const GET_TITLE = "Moon Get Variable (FSG_GetNode)";
const NAME = "Name";

// Get 목록에 넣는 안내 항목. Set 이름으로 쓰일 일이 없는 값이고, 고르면 이전 값으로 되돌린다
const NO_MATCH = "\u0000fsg:no-match";
const INVALID = "\u0000fsg:invalid-filter";

// ComfyUI 화면이 영문이라 UI 문구는 기획서의 영문 그대로 쓴다
const TEXT = {
  filterTip: "Regex to filter the name list. Leave empty to show all.",
  caseTip: "Match upper and lower case exactly.",
  invalid: "Invalid filter. Using plain text match.",
  noMatch: "No names match the filter.",
  current: (name) => `${name} (current, filtered out)`,
  renamed: (name) => `Name already in use. Renamed to "${name}".`,
};

// filter가 비면 전부, 아니면 정규식에 맞는 이름만 남긴다. 식이 잘못되면 포함 검사로 바꾸고 invalid로 알린다
export function filterNames(names, filter, caseSensitive) {
  if (!filter) return { names, invalid: false };
  try {
    const pattern = new RegExp(filter, caseSensitive ? "" : "i");
    return { names: names.filter((name) => pattern.test(name)), invalid: false };
  } catch {
    const fold = (text) => (caseSensitive ? text : text.toLowerCase());
    const needle = fold(filter);
    return { names: names.filter((name) => fold(name).includes(needle)), invalid: true };
  }
}

// 같은 그래프의 Set 이름. 이름순(대소문자 무시, 같으면 코드 순) 또는 캔버스 위치순(위 → 아래, 왼쪽 → 오른쪽)
// 불러온 워크플로에는 같은 이름이 남아 있을 수 있어 한 번만 넣는다
export function setNames(graph, sort) {
  const sets = (graph?.findNodesByType?.(SET_TYPE) ?? []).filter((node) => nameOf(node));
  if (sort === "position") sets.sort((a, b) => a.pos[1] - b.pos[1] || a.pos[0] - b.pos[0]);
  const names = [...new Set(sets.map(nameOf))];
  if (sort !== "position") names.sort((a, b) => compare(a.toLowerCase(), b.toLowerCase()) || compare(a, b));
  return names;
}

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function nameOf(node) {
  return String(node.widgets?.find((w) => w.name === NAME)?.value ?? "");
}

function findSet(graph, name) {
  if (!name) return undefined;
  return graph?.findNodesByType?.(SET_TYPE)?.find((node) => nameOf(node) === name);
}

// 최신 프론트엔드는 warning(title), 예전 버전은 add({ severity })를 쓴다
function warn(message) {
  const toast = app.extensionManager?.toast;
  if (typeof toast?.warning === "function") toast.warning(message);
  else toast?.add?.({ severity: "warn", summary: message, life: 5000 });
}

class SetVariableNode extends LGraphNode {
  static title = SET_TITLE;

  constructor(title) {
    super(title);
    // 실행 요청에서 빠지고, 연결된 Get이 이 노드 입력의 원본으로 바뀐다
    this.isVirtualNode = true;
    this.serialize_widgets = true;
    this.addInput("value", "*");
    this.addWidget("text", NAME, "", (value) => this.applyName(value), {});
  }

  // 이름 앞뒤 공백을 지우고, 같은 그래프에 같은 이름의 Set이 있으면 _2, _3…을 붙여 알린다(F-05)
  applyName(value) {
    const widget = this.widgets.find((w) => w.name === NAME);
    const name = String(value ?? "").trim();
    const taken = new Set(
      (this.graph?.findNodesByType?.(SET_TYPE) ?? []).filter((node) => node !== this).map(nameOf),
    );
    let unique = name;
    for (let n = 2; unique && taken.has(unique); n++) unique = `${name}_${n}`;
    if (widget.value !== unique) widget.value = unique;
    if (unique !== name) warn(TEXT.renamed(unique));
    this.setDirtyCanvas?.(true, true);
  }

  // 붙여넣기·복제는 그래프에 넣은 뒤 configure를 부르므로 여기서 중복을 고친다.
  // 워크플로 불러오기(configuringGraph)는 저장된 그대로 둔다
  onConfigure() {
    if (!app.configuringGraph) this.applyName(nameOf(this));
  }
}

class GetVariableNode extends LGraphNode {
  static title = GET_TITLE;

  constructor(title) {
    super(title);
    this.isVirtualNode = true;
    this.serialize_widgets = true;
    // 값은 node.properties에 두어 워크플로 JSON에 함께 저장된다. 속성 패널이 있는 예전 프론트엔드는 거기서도 편집한다
    this.addProperty("filter", "", "string");
    this.addProperty("filterCaseSensitive", false, "boolean");
    this.addProperty("sort", "name", "enum", { values: ["name", "position"] });
    this.addOutput("value", "*");
    // 안내 항목을 골랐을 때 되돌릴 값
    this.lastName = "";
    // values를 함수로 두어 목록을 열 때마다 다시 계산한다(캔버스, Nodes 2.0 모두)
    this.addWidget(
      "combo",
      NAME,
      "",
      (value) => {
        const widget = this.widgets.find((w) => w.name === NAME);
        if (value === NO_MATCH || value === INVALID) widget.value = this.lastName;
        else this.lastName = value;
        this.setDirtyCanvas?.(true, true);
      },
      { values: () => this.nameList(), getOptionLabel: (value) => this.optionLabel(value) },
    );
  }

  currentName() {
    return String(this.widgets?.find((w) => w.name === NAME)?.value ?? "");
  }

  matches() {
    const { filter, filterCaseSensitive, sort } = this.properties;
    return filterNames(setNames(this.graph, sort), String(filter ?? ""), !!filterCaseSensitive);
  }

  // 현재 값이 필터 밖이어도 지우지 않고 맨 위에 둔다. 안내 항목은 그 아래, 맞는 이름은 마지막이다
  nameList() {
    const { names, invalid } = this.matches();
    const current = this.currentName();
    const list = [];
    if (current && !names.includes(current)) list.push(current);
    if (invalid) list.push(INVALID);
    if (!names.length) list.push(NO_MATCH);
    return [...list, ...names];
  }

  // 위젯에 보이는 값에도 쓰인다. 필터 밖인 현재 값은 노드에서도 (current, filtered out)으로 보인다
  optionLabel(value) {
    if (value === NO_MATCH) return TEXT.noMatch;
    if (value === INVALID) return TEXT.invalid;
    if (!value) return "";
    if (value === this.currentName() && this.isFilteredOut(value)) return TEXT.current(value);
    return value;
  }

  // Set이 있는데 필터에 걸러진 경우만. 없는 이름은 필터와 상관없으므로 그대로 보인다
  isFilteredOut(name) {
    const { names } = this.matches();
    return !names.includes(name) && setNames(this.graph, "name").includes(name);
  }

  // 실행 요청을 만들 때 프론트엔드가 가상 노드의 출력 원본을 이 링크로 찾는다.
  // 같은 그래프에서 이름이 같은 Set의 입력 링크를 돌려주면 그 Set 입력의 원본으로 바뀐다(F-03)
  getInputLink() {
    return findSet(this.graph, this.currentName())?.getInputLink(0) ?? null;
  }

  onConfigure() {
    this.lastName = this.currentName();
  }

  // 설정한 필터가 잘못된 식이면 알린다. 워크플로를 불러올 때는 알리지 않는다
  onPropertyChanged(name, value) {
    if (name === "filter" && !app.configuringGraph && filterNames([], String(value ?? ""), false).invalid) warn(TEXT.invalid);
    this.setDirtyCanvas?.(true, true);
  }

  // 현재 프론트엔드 노드 메뉴에는 속성 패널이 없어서 필터 속성을 우클릭 메뉴로 편집한다
  getExtraMenuOptions(_canvas, options) {
    const { filter, filterCaseSensitive, sort } = this.properties;
    options.push(
      { content: `Filter: ${filter ? filter : "(show all)"}`, callback: () => this.editFilter() },
      {
        content: `Match case: ${filterCaseSensitive ? "On" : "Off"}`,
        callback: () => this.setProperty("filterCaseSensitive", !filterCaseSensitive),
      },
      {
        content: `Sort: ${sort === "position" ? "Canvas position" : "Name"}`,
        callback: () => this.setProperty("sort", sort === "position" ? "name" : "position"),
      },
    );
  }

  async editFilter() {
    const current = String(this.properties.filter ?? "");
    const dialog = app.extensionManager?.dialog;
    const value = dialog?.prompt
      ? await dialog.prompt({ title: "Filter", message: TEXT.filterTip, defaultValue: current, placeholder: "^#" })
      : window.prompt(TEXT.filterTip, current);
    if (value != null) this.setProperty("filter", value);
  }
}

app.registerExtension({
  name: "ComfyUI-Moon-Tools.FilteredSetGet",
  registerCustomNodes() {
    LiteGraph.registerNodeType(SET_TYPE, SetVariableNode);
    LiteGraph.registerNodeType(GET_TYPE, GetVariableNode);
    SetVariableNode.category = "utils";
    GetVariableNode.category = "utils";
  },
  // JS로만 등록한 노드는 검색 목록에 타입 이름으로 들어가므로 표시 이름과 별칭을 바꾼다
  beforeRegisterVueAppNodeDefs(defs) {
    const info = {
      [SET_TYPE]: { display_name: SET_TITLE, description: "Store an input under a name for Moon Get Variable." },
      [GET_TYPE]: { display_name: GET_TITLE, description: "Output the input of the Moon Set Variable with the chosen name." },
    };
    for (const def of defs) {
      if (!info[def.name]) continue;
      Object.assign(def, info[def.name]);
      def.search_aliases = ["moon", "set", "get", "variable", "set get", "filtered set get"];
    }
  },
});
