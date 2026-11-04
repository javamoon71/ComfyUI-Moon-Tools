// Text List Unpack 노드의 출력 슬롯 수를 실행 결과의 항목 수에 맞춰 늘리고 줄이는 프론트엔드 확장
import { app } from "../../scripts/app.js";

// 출력은 text0부터 빈틈없이 이어지도록 끝에서만 늘리고 줄인다. 슬롯 위치가 Python 결과의 순서와 같아야 한다.
// 연결된 출력은 항목 수보다 뒤에 있어도 링크가 끊기지 않게 남긴다(그 출력은 빈 문자열이 나간다)
function syncOutputs(node, count) {
  const lastLinked = node.outputs.findLastIndex((output) => output.links?.length);
  const target = Math.max(1, count, lastLinked + 1);
  if (target === node.outputs.length) return;
  while (node.outputs.length > target) node.removeOutput(node.outputs.length - 1);
  while (node.outputs.length < target) node.addOutput(`text${node.outputs.length}`, "STRING");
  node.setSize([node.size[0], node.computeSize()[1]]);
  node.setDirtyCanvas(true, true);
}

app.registerExtension({
  name: "ComfyUI-Moon-Tools.TextListUnpack",
  beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "MoonTextListUnpack") return;
    // 새 노드는 항목 수를 모르므로 text0만 보여 준다. 워크플로를 불러오면 저장된 출력 수가 이 뒤에 다시 채워진다
    const onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function (...args) {
      onNodeCreated?.apply(this, args);
      syncOutputs(this, 1);
    };
    const onExecuted = nodeType.prototype.onExecuted;
    nodeType.prototype.onExecuted = function (message, ...args) {
      onExecuted?.call(this, message, ...args);
      const count = message?.count?.[0];
      if (Number.isInteger(count)) syncOutputs(this, count);
    };
  },
});
