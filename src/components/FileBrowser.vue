<template>
  <div class="container" ref="container" :style="{ gridTemplateColumns: `${leftWidth}fr 4px 1fr` }">
    <div class="localfile">
      <div class="tool-bar">工具栏</div>
      <div class="path-bar">路径栏</div>
      <div class="file-list">
        <table>
          <thead>
            <tr class="text-left bg-gray-200">
              <th class="p-2">名称</th>
              <th class="p-2">大小</th>
              <th class="p-2">修改日期</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="p-2">1</td>
              <td class="p-2">1</td>
              <td class="p-2">1</td>
            </tr>
            <tr>
              <td class="p-2">1</td>
              <td class="p-2">1</td>
              <td class="p-2">1</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="divider" @mousedown="startDragging"></div>
    <div class="remotefile">
      <div class="tool-bar">工具栏</div>
      <div class="path-bar">路径栏</div>
      <div class="file-list">文件列表</div>
    </div>
  </div>
</template>

<script setup>
import { useTemplateRef, ref } from 'vue';

const container = useTemplateRef('container');
const leftWidth = ref(1);
const isDragging = ref(false);

function startDragging(e) {
  isDragging.value = true;
  document.body.style.cursor = 'ew-resize';
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', stopDragging);
}

const onMouseMove = (e) => {
  if (!isDragging.value || !container.value) return;

  const containerRect = container.value.getBoundingClientRect();
  const width = containerRect.width;
  console.log(e.clientX, containerRect.left, width);
  const newLeftWidth = e.clientX - containerRect.left;

  // 限制最小宽度
  if (newLeftWidth < 100 || newLeftWidth > containerRect.width - 100) return;

  leftWidth.value = newLeftWidth / (width - newLeftWidth);
  console.log(leftWidth.value);
};

const stopDragging = () => {
  isDragging.value = false;
  document.body.style.cursor = '';
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', stopDragging);
};
</script>

<style lang="less" scoped>
.container {
  display: grid;
  height: 100%;
}

.divider {
  background-color: #ccc;
  cursor: ew-resize; /* 水平方向调整的光标 */
}
</style>
