// Text List·Image List의 index 생성 후 제어를 항목 수 안에서 순환시키고, 예전 random 값을 제어 모드로 옮기는 공용 함수
// ComfyUI는 web 폴더의 모든 .js를 확장으로 불러오지만, 이 파일은 함수만 내보내므로 불러와도 아무 일도 하지 않는다

// 생성 후 제어가 index를 항목 범위(0 ~ 개수-1) 안에서 순환시키게 한다. 방식은 web/any_index_switch.js와 같다.
// 기본 제어는 min/max에서 멈추고 randomize는 max를 뽑지 않으므로, 제어가 도는 동안만 범위를 넓힌 뒤 넘친 값을 반대쪽 끝으로 돌린다.
// index 입력이 링크로 연결되어 있으면 기본 제어가 값을 바꾸지 않는다
export function wrapIndexControl(index, control, itemCount) {
  for (const hook of ["beforeQueued", "afterQueued"]) {
    const original = control[hook];
    control[hook] = function (...args) {
      const count = itemCount();
      if (!count || control.value === "fixed") return original?.apply(this, args);
      const { min, max } = index.options;
      index.value %= count;
      index.options.min = control.value === "randomize" ? 0 : -1;
      index.options.max = count;
      try {
        original?.apply(this, args);
      } finally {
        index.options.min = min;
        index.options.max = max;
      }
      const wrapped = index.value >= count ? 0 : index.value < 0 ? count - 1 : index.value;
      if (wrapped !== index.value) {
        index.value = wrapped;
        index.callback?.(wrapped);
      }
    };
  }
}

// random(On/Off) 위젯이 있던 예전 워크플로는 그 값이 지금의 생성 후 제어 자리(또는 이름 random)에 저장되어 있다.
// 위치로 복원하든 이름으로 복원하든 제어 모드가 맞게 들어오지 않으므로 On은 randomize, Off는 fixed로 옮긴다
export function migrateRandom(node, control, info) {
  const position = node.widgets.filter((w) => w.serialize !== false).indexOf(control);
  const saved = info?.widgets_values_named ? info.widgets_values_named.random : info?.widgets_values?.[position];
  if (typeof saved === "boolean") control.value = saved ? "randomize" : "fixed";
}
