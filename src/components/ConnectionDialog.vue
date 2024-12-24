<template>
  <dialog ref="connections-dialog" id="connections-dialog">
    <div class="dialog-header">
      <!-- <img src="icon.png" alt="Icon"> -->
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
            <input type="text" id="name" value="" v-model="connectionInfo.name" />
          </div>
          <div class="form-group2">
            <div class="form-group host-group">
              <label for="host">主机</label>
              <input type="text" id="host" v-model="connectionInfo.options.host" />
            </div>
            <div class="form-group port-group">
              <label for="port">端口</label>
              <input type="number" id="port" v-model="connectionInfo.options.port" />
            </div>
          </div>
          <div class="form-group2">
            <div class="form-group user-group">
              <label for="username">用户名</label>
              <input type="text" id="user" v-model="connectionInfo.options.user" />
            </div>
            <div class="form-group pass-group">
              <label for="password">密码</label>
              <input type="password" id="password" value="" v-model="connectionInfo.options.password" />
            </div>
          </div>
          <div class="form-group">
            <label for="username">私钥</label>
            <input type="text" id="privatekey" value="" v-model="connectionInfo.options.privatekey" />
          </div>
          <div class="form-actions">
            <button type="button" class="save" v-if="currentID === '-1'" @click="save">保存</button>
            <button type="button" class="delete" v-else @click="del">删除</button>
            <button type="button" class="close" @click="closeDialog">关闭</button>
            <button type="button" class="login" v-if="currentID !== '-1'" @click="login">登录</button>
          </div>
        </form>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref, useTemplateRef, onMounted } from 'vue';

const emit = defineEmits(['login'])

const connectionsDialog = useTemplateRef('connections-dialog');

function openConnInfoDialog() {
  window.configAPI.getAllConnConfigs().then((res) => {
    console.log(res);
    connections.value = res;
  });
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
    username: '',
    password: '',
    privatekey: '',
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
        username: '',
        password: '',
        privatekey: '',
      },
    };
  } else {
    const index = connections.value.findIndex((conn) => conn.id === id);
    connectionInfo.value = connections.value[index];
  }
  currentID.value = id;
}

function save(event) {
  // 必填项校验
  if (!connectionInfo.value.name) {
    alert('请输入名称');
    return;
  }
  if (!connectionInfo.value.options.host) {
    alert('请输入主机');
    return;
  }
  if (!connectionInfo.value.options.port) {
    alert('请输入端口');
    return;
  }
  if (!connectionInfo.value.options.user) {
    alert('请输入用户名');
  }
  connectionInfo.value.id = Date.now();
  connections.value.push(connectionInfo.value);
  currentID.value = connectionInfo.value.id;
}

function closeDialog(event) {
  connectionsDialog.value.close();
}

function login(event) {
  // 登录逻辑
  console.log('login');
  emit('login', currentID.value, connectionInfo.value.name);
  connectionsDialog.value.close();
}

function del(event) {
  const res = confirm('确定删除？');
  if (!res) return;
  const index = connections.value.findIndex((conn) => conn.id === currentID.value);
  connections.value.splice(index, 1);
  currentID.value = '-1';
}
</script>

<style lang="less" scoped>
dialog {
  width: 500px;
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
    display: flex;
    align-items: center;

    img {
      width: 20px;
      height: 20px;
      margin-right: 10px;
    }

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
  .form-group2 {
    display: flex;
    .host-group,
    .user-group {
      flex-grow: 1;
      margin-right: 5px;
    }
  }
  #port {
    width: 80px;
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
  padding: 6px 16px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button.login {
  background-color: #28a745;
  color: white;
}

.form-actions button.close {
  background-color: #dc3545;
  color: white;
}
</style>
