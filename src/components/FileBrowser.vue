<template>
  <n-flex vertical :size="[12, 2]" class="sftp-file">
    <n-space :size="[4, 12]">
      <n-button size="tiny" type="primary" @click="changePath(currentPath)"> 刷新 </n-button
      ><n-button size="tiny" type="primary" @click="openFileDialog()"> 上传 </n-button>
    </n-space>
    <div class="path-bar">
      <span v-for="path in splitPaths" :key="path.realPath" @click="clickPath(path.realPath)">{{ path.path }}</span>
    </div>
    <div class="file-list" @dragover.prevent @drop.prevent="handleDropFiles">
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
          <tr v-for="row in fileList" :key="row.id">
            <td
              v-for="col in columns"
              :key="col.key"
              :class="{ [col.key]: true, selected: currentID === row.id }"
              @click="selected(col.key, row.id)"
              @dblclick="openFile(col.key, row)"
              @contextmenu.prevent="showContextMenu($event, col.key, row.name)"
            >
              <span v-if="col.key === 'name'">{{ fileTypeIcon[row['type']] }}</span>
              {{ row[col.key] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </n-flex>
  <n-modal
    v-model:show="showPathModal"
    style="width: 500px; position: fixed; top: 60px; left: 50%; transform: translateX(-50%)"
  >
    <n-input-group style="background-color: #fff; padding: 5px">
      <n-input :style="{ width: '450px' }" size="small" v-model:value="pathModalPath" />
      <n-button type="primary" size="small" @click="gotoPath(pathModalPath)"> 前往 </n-button>
    </n-input-group>
  </n-modal>
  <n-modal v-model:show="showFileTransferModal" style="width: 600px">
    <n-flex vertical :size="[0, 2]" style="padding: 10px 5px; background-color: #fff">
      <div>{{ fileTransferTitle }}</div>
      <n-table :bordered="false" size="small">
        <thead>
          <tr>
            <th style="width: 70%">文件名称</th>
            <th style="width: 30%">进度</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fileInfo in transferFileArray" :key="fileInfo.path">
            <td>{{ fileInfo.path }}</td>
            <td>
              <n-progress type="line" status="success" :percentage="fileInfo.process" indicator-placement="inside" />
            </td>
          </tr>
        </tbody>
      </n-table>
    </n-flex>
  </n-modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { NButton, NSpace, NFlex, NModal, NInputGroup, NInput, useMessage, NTable, NProgress } from 'naive-ui';
import bytes from 'bytes';

const props = defineProps({
  // 这个是连接配置的ID
  connId: {
    type: String,
    default: () => '',
  },
  // 这个是连接实例的ID
  clientId: {
    type: String,
    default: () => '',
  },
  isActive: {
    type: Boolean,
    default: () => false,
  },
});

const fileTypeIcon = {
  d: '📁',
  '-': '📄',
  l: '🔗',
  b: '💽', //块设备 (block device)
  c: '⌨️', //字符设备 (character device)
  p: '🪠', //管道文件 (FIFO/pipe)
  s: '🔌', //套接字 (socket)
};

const currentPath = ref('');
const currentID = ref(-1);
const showPathModal = ref(false);
const pathModalPath = ref('');
const showFileTransferModal = ref(false);
const fileTransferTitle = ref('');
const transferFileList = ref({});
const message = useMessage();

const splitPaths = computed(() => {
  let paths = currentPath.value.split('/');
  paths = paths.filter((path) => path).map((path) => path + '/');
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

const clickPath = (path) => {
  if (path === currentPath.value) {
    console.log('当前路径，应该要打开路径输入页面');
    pathModalPath.value = path;
    showPathModal.value = true;
    return;
  }
  console.log('clickPath', path);
  changePath(path);
};

const gotoPath = (path) => {
  // 判断path是否以/结尾，如果不以/结尾，则加上/
  if (!path.endsWith('/')) {
    path = path + '/';
  }
  changePath(path, (status) => {
    if (status === 'success') {
      showPathModal.value = false;
    }
  });
};

const changePath = (path, callback) => {
  readDir(path, (status) => {
    if (status === 'success') {
      currentPath.value = path;
      callback && callback('success');
    } else {
      message.error('无法进入该目录');
      callback && callback('error');
    }
  });
};

const selected = (key, id) => {
  if (key !== 'name') {
    return;
  }
  currentID.value = id;
};

const openFile = (key, row) => {
  if (key !== 'name') {
    return;
  }
  if (row.type === 'd') {
    const path = currentPath.value + row.name + '/';
    changePath(path);
  }
};

const columns = ref([
  { key: 'name', title: '名称', width: 200 },
  { key: 'size', title: '大小', width: 100 },
  { key: 'changed', title: '修改日期', width: 180 },
  { key: 'rights', title: '权限', width: 100 },
  { key: 'owner', title: '所有者', width: 80 },
]);

const fileList = ref([]);

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

function readDir(path, callback) {
  window.sshAPI
    .readDir(props.clientId, path)
    .then((data) => {
      console.log(data);
      let files = data
        .map((file, index) => {
          let f = {
            id: index,
            name: file.filename,
            size: bytes(file.attrs.size),
            changed: formatTimestamp(file.attrs.mtime * 1000),
          };

          // longname: drwxrwxr-x    2 macd     macd         4096 Oct  6 23:02 wol
          const ss = file.longname.split(/\s+/);
          f.rights = ss[0].slice(1);
          f.owner = ss[3];
          f.type = ss[0].slice(0, 1);

          if (f.type === 'd') {
            f.size = '';
          }

          return f;
        })
        .sort((a, b) => {
          if (a.type === b.type) {
            return a.name.localeCompare(b.name);
          } else {
            return -a.type.localeCompare(b.type);
          }
        });
      console.log(files);
      fileList.value = files;
      callback && callback('success');
    })
    .catch((e) => {
      console.log(e);
      callback && callback('error');
    });
}

onMounted(async () => {
  const connConfig = await window.configAPI.getConnConfig(props.connId);
  console.log(connConfig);

  const msg = await window.sshAPI.connectSFTP(props.clientId, {
    host: connConfig.options.host,
    port: connConfig.options.port,
    username: connConfig.options.user,
    password: connConfig.options.password,
    privateKey: connConfig.options.privatekey,
  });
  console.log(msg);

  const homeDir = await window.sshAPI.getHomeDir(props.clientId);
  currentPath.value = homeDir;
  readDir(currentPath.value);
});

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);

  // 获取年、月、日、小时、分钟和秒，并补零
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // 拼接成所需格式
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const handleDropFiles = (event) => {
  const files = Array.from(event.dataTransfer.files);
  const filePaths = Array.from(files).map((file) => {
    return window.sshAPI.getFilePath(file);
  });
  console.log(filePaths);
  window.sshAPI.uploadFiles(props.clientId, filePaths, currentPath.value).then((ret) => {
    console.log(ret);
    changePath(currentPath.value);
  });
};

const showContextMenu = (event, columnName, fileName) => {
  if (columnName !== 'name') {
    return;
  }
  window.sshAPI.showContextMenu('sftp', { clientID: props.clientId, remotePath: currentPath.value + fileName });
};

const openFileDialog = async () => {
  const { filePaths, canceled } = await window.dialogAPI.showOpenDialog({
    title: '选择上传文件',
    buttonLabel: '选择文件',
    properties: ['openFile', 'multiSelections'],
  });
  if (canceled) {
    return;
  }
  console.log(filePaths);
  window.sshAPI.uploadFiles(props.clientId, filePaths, currentPath.value).then((ret) => {
    console.log(ret);
    changePath(currentPath.value);
  });
};

window.sshAPI.transferFileList(props.clientId, (transferType, fileList) => {
  console.log(transferType, fileList);
  transferFileList.value = fileList.reduce((acc, filePath) => {
    acc[filePath] = 0;
    return acc;
  }, {});
  if (transferType === 'download') {
    fileTransferTitle.value = '下载';
  } else if (transferType === 'upload') {
    fileTransferTitle.value = '上传';
  }
  showFileTransferModal.value = true;
});

const transferFileArray = computed(() => {
  return Object.entries(transferFileList.value).map(([path, process]) => {
    return { path: path, process: process };
  });
});

window.sshAPI.uploadFileProcess(props.clientId, (processInfo) => {
  transferFileList.value[processInfo.path] = Math.floor(processInfo.process * 100);
});

window.sshAPI.deleteFileListen(props.clientId, (stat) => {
  if (stat === 'start') {
    // TODO
  } else if (stat === 'end') {
    message.success('删除成功');
    changePath(currentPath.value);
  }
});
</script>

<style lang="less" scoped>
.sftp-file {
  height: 100%;
  font-size: 13px;
  overflow: hidden;
}
.path-bar {
  display: inline-flex;
  flex-direction: row-reverse;
  justify-content: flex-end;
  padding: 5px 3px;
  color: #000;
  background-color: #99b4d1;
  & > span {
    cursor: default;
  }
  & > span:hover {
    color: #666;
  }
  & > span:hover ~ span {
    color: #666;
  }
}
.file-list {
  flex: 1;
  height: 100%;
  overflow: auto;
  padding-bottom: 10px;
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
      left: 3px;
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

  td.name {
    cursor: default;
    user-select: none;
    &:hover {
      background-color: #eee;
    }
    &.selected {
      background-color: #cce8ff;
    }
  }
}
</style>
