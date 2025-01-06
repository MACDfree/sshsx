<template>
  <dialog ref="connections-dialog" id="connections-dialog">
    <div class="dialog-header">
      <span>登录</span>
    </div>
    <div class="dialog-content">
      <div class="sidebar">
        <ul>
          <li :class="[{ active: currentID === '-1' }]" @click="switchConn('-1')">新增</li>
          <li
            v-for="item in connections"
            :key="item.id"
            :class="[{ active: currentID === item.id }]"
            @click="switchConn(item.id)"
          >
            {{ item.name }}
          </li>
        </ul>
      </div>
      <div class="form-container">
        <form class="form">
          <div class="form-group">
            <label for="protocol">名称</label>
            <input type="text" id="name" value="" v-model="connectionInfo.name" autofocus />
          </div>
          <div class="form-group2">
            <div class="form-group host-group">
              <label for="host">主机*</label>
              <input type="text" id="host" v-model="connectionInfo.options.host" />
            </div>
            <div class="form-group port-group">
              <label for="port">端口*</label>
              <input type="number" id="port" v-model="connectionInfo.options.port" />
            </div>
          </div>
          <div class="form-group2">
            <div class="form-group user-group">
              <label for="user">用户名*</label>
              <input type="text" id="user" v-model="connectionInfo.options.user" />
            </div>
            <div class="form-group pass-group">
              <label for="password">密码</label>
              <input type="password" id="password" value="" v-model="connectionInfo.options.password" />
            </div>
          </div>
          <div class="form-group">
            <label for="privatekey">私钥</label>
            <input type="text" id="privatekey" value="" v-model="connectionInfo.options.privatekey" />
          </div>
          <div class="form-actions">
            <button type="button" class="save" @click="save">保存</button>
            <button type="button" class="delete" v-if="currentID !== '-1'" @click="del">删除</button>
            <button type="button" class="login" v-if="currentID !== '-1'" @click="login">SSH</button>
            <button type="button" class="login" v-if="currentID !== '-1'" @click="loginSFTP">SFTP</button>
            <button type="button" class="close" @click="closeDialog">关闭</button>
          </div>
          <hr />
          <div class="form-group2">
            <div class="form-group">
              <label for="font">字体名称</label>
              <input type="text" id="font" value="" v-model="connectionInfo.options.font" />
            </div>
            <div class="form-group">
              <label for="fontsize">字体大小</label>
              <input type="number" id="fontsize" value="" v-model="connectionInfo.options.fontsize" />
            </div>
          </div>
          <div class="form-group2">
            <div class="form-group">
              <label for="term">终端类型</label>
              <select name="term" v-model="connectionInfo.options.term">
                <option value="xterm-256color">xterm-256color</option>
                <option value="vt100">vt100</option>
              </select>
            </div>
            <div class="form-group">
              <label for="theme">主题</label>
              <select name="theme" v-model="connectionInfo.options.theme">
                <option value="dracula">Dracula</option>
                <option value="solarized_light">Solarized Light</option>
              </select>
            </div>
          </div>
        </form>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref, useTemplateRef, onMounted, toRaw } from 'vue';
import { v4 as uuidv4 } from 'uuid';

const emit = defineEmits(['login']);

const connectionsDialog = useTemplateRef('connections-dialog');

function openConnInfoDialog() {
  window.configAPI.getAllConnConfigs().then((res) => {
    console.log(res);
    connections.value = res;
  });

  if (currentID.value === '-1') {
    connectionInfo.value = {
      id: '',
      name: '',
      options: {
        host: '',
        port: 22,
        user: '',
        password: '',
        privatekey: '',
        font: 'Consolas',
        fontsize: 14,
        term: 'xterm-256color',
        theme: 'dracula',
      },
    };
  }

  connectionsDialog.value.showModal();
}

defineExpose({
  openConnInfoDialog,
});

const connections = ref([]);

const connectionInfo = ref({
  id: '',
  name: '',
  options: {
    host: '',
    port: 22,
    user: '',
    password: '',
    privatekey: '',
    font: 'Consolas',
    fontsize: 14,
    term: 'xterm-256color',
    theme: 'dracula',
  },
});

const currentID = ref('-1');

function switchConn(id) {
  if (id === '-1') {
    connectionInfo.value = {
      id: '',
      name: '',
      options: {
        host: '',
        port: 22,
        user: '',
        password: '',
        privatekey: '',
        font: 'Consolas',
        fontsize: 14,
        term: 'xterm-256color',
        theme: 'dracula',
      },
    };
  } else {
    const index = connections.value.findIndex((conn) => conn.id === id);
    connectionInfo.value = connections.value[index];
  }
  currentID.value = id;
}

async function save(event) {
  // 必填项校验
  if (!connectionInfo.value.options.host) {
    await window.dialogAPI.info('请输入IP地址');
    return;
  }
  if (!connectionInfo.value.options.port) {
    await window.dialogAPI.info('请输入端口');
    return;
  }
  if (!connectionInfo.value.options.user) {
    await window.dialogAPI.info('请输入用户名');
  }

  if (!connectionInfo.value.id) {
    connectionInfo.value.id = uuidv4();
  }

  if (!connectionInfo.value.name) {
    connectionInfo.value.name =
      connectionInfo.value.options.user +
      '@' +
      connectionInfo.value.options.host +
      ':' +
      connectionInfo.value.options.port;
  }

  window.configAPI.addOrUpdateConnConfig(toRaw(connectionInfo.value)).then((res) => {
    if (res === 'add') {
      connections.value.push(connectionInfo.value);
    }
    currentID.value = connectionInfo.value.id;
  });
}

function closeDialog(event) {
  connectionsDialog.value.close();
}

function login(event) {
  // 登录逻辑
  console.log('login');
  emit('login', currentID.value, connectionInfo.value.name, 'ssh');
  connectionsDialog.value.close();
}

function loginSFTP(event) {
  // 登录逻辑
  console.log('loginSFTP');
  emit('login', currentID.value, connectionInfo.value.name, 'sftp');
  connectionsDialog.value.close();
}

async function del(event) {
  const res = await window.dialogAPI.confirm('确定删除？');
  console.log(res);
  if (res.response===1) return;
  window.configAPI.deleteConnConfig(currentID.value).then((res) => {
    console.log(res);
    const index = connections.value.findIndex((conn) => conn.id === currentID.value);
    connections.value.splice(index, 1);
    currentID.value = '-1';
  });
}
</script>

<style lang="less" scoped>
dialog {
  width: 600px;
  height: 350px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  overflow: hidden;

  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);

  .dialog-header {
    font-size: 12px;
    background-color: #e8e8e8;
    padding: 5px;

    span {
      font-weight: bold;
    }
  }
}

.dialog-content {
  font-size: 12px;
  display: flex;
  padding: 5px;
}

.sidebar {
  width: 40%;
  border-right: 1px solid #ccc;
  overflow-y: auto;
  height: 316px;
  scrollbar-width: thin;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      padding: 5px 10px;
      cursor: pointer;
      white-space: nowrap;
    }

    li:hover {
      background-color: #e0e0e0;
    }
    li.active {
      background-color: #e0e0e0;
    }
  }
}

.form-container {
  width: 60%;
  padding: 0 20px;
  height: 316px;
  overflow-y: auto;
  .form-group2 {
    display: flex;
    .form-group:first-child {
      flex-grow: 1;
      margin-right: 5px;
    }
  }
  #port,
  #fontsize {
    width: 80px;
  }
  hr {
    margin: 20px 0;
  }
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-size: 12px;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 4px;
  font-size: 12px;
  border: 1px solid #ccc;
  border-radius: 2px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.form-actions button {
  padding: 6px 10px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button.login {
  background-color: #28a745;
  color: white;
}

.form-actions button.delete {
  background-color: #dc3545;
  color: white;
}
</style>
