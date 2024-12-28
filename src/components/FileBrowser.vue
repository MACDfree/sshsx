<template>
  <div class="sftp-file">
    <div class="path-bar"><span v-for="path in splitPaths" :key="path.realPath" @click="changePath(path.realPath)">{{ path.path }}</span></div>
    <div class="file-list">
      <table>
        <thead>
          <tr>
            <th v-for="(col, index) in columns" :key="col.key" :style="{ width: col.width + 'px' }">
              {{ col.title }}
              <div class="resize-handle" @mousedown="startResize($event, index)"></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data" :key="row.id">
            <td v-for="col in columns" :key="col.key">{{ row[col.key] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const currentPath = ref('/home/macd/');

const splitPaths = computed(() => {
  let paths = currentPath.value.split('/');
  paths = paths.filter(path=>path).map(path=>path+'/');
  paths = ['/', ...paths];
  
  let ret = paths.map((path, index) => {
    return {
      realPath: paths.slice(0, index + 1).join(''),
      path: path,
    };
  });
  ret = ret.reverse();
  return ret;
});

const changePath = (path) => {
  if (path === currentPath.value) {
    console.log('当前路径，应该要打开路径输入页面');
    return;
  }
  console.log('changePath', path);
  currentPath.value = path;
};

const columns = ref([
  { key: 'name', title: '名称', width: 200 },
  { key: 'size', title: '大小', width: 100 },
  { key: 'changed', title: '修改日期', width: 180 },
  { key: 'rights', title: '权限', width: 100 },
  { key: 'owner', title: '所有者', width: 80 },
]);

const data = ref([
  { id: 1, name: 'paperless-ngx', size: '', changed: '2024-12-28 23:21:00', rights: 'rwxrwxr-x', owner: 'macd' },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
  {
    id: 2,
    name: 'supervisord.conf',
    size: '2000 KB',
    changed: '2024-12-28 23:23:00',
    rights: 'rw-rw-r--',
    owner: 'root',
  },
]);

let isDragging = false;

const startResize = (e, index) => {
  isDragging = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  const startX = e.clientX;
  const startWidth = columns.value[index].width;

  const onMouseMove = (moveEvent) => {
    if (!isDragging) {
      return;
    }
    const delta = moveEvent.clientX - startX;
    columns.value[index].width = Math.max(startWidth + delta, 20); // 设置最小宽度
  };

  const onMouseUp = () => {
    isDragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
};
</script>

<style lang="less" scoped>
.sftp-file {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-size: 13px;
  overflow: hidden;
}
.path-bar {
  display: inline-flex;
  flex-direction: row-reverse;
  justify-content: flex-end;
  padding: 5px 3px;
  background-color: #99b4d1;
  &>span {
    cursor: default;
  }
  &>span:hover {
    color: #666;
  }
  &>span:hover ~ span {
    color: #666;
  }
}
.file-list {
  flex: 1;
  height: 100%;
  overflow: auto;
  & > table {
    table-layout: fixed;
    width: 10px;
    border-collapse: collapse;
  }
  th {
    position: sticky;
    top: 0;
    background-color: #fff;
    z-index: 1;
    text-align: left;
  }
  .resize-handle {
    cursor: col-resize;
    position: absolute;
    top: 0;
    right: 0;
    width: 5px;
    height: 100%;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 2;
      width: 2px;
      height: 100%;
      background-color: #ccc;
    }
  }

  th,
  td {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 2px 5px;
  }
  td:nth-child(2) {
    text-align: right;
  }
}
</style>
