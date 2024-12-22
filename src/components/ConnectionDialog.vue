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
          <div class="form-group">
            <label for="host">主机</label>
            <input type="text" id="host" v-model="connectionInfo.options.host" />
          </div>
          <div class="form-group">
            <label for="port">端口</label>
            <input type="number" id="port" v-model="connectionInfo.options.port" />
          </div>
          <div class="form-group">
            <label for="username">用户名</label>
            <input type="text" id="user" v-model="connectionInfo.options.user" />
          </div>
          <div class="form-group">
            <label for="password">密码</label>
            <input type="password" id="password" value="" v-model="connectionInfo.options.password" />
          </div>
          <div class="form-group">
            <label for="username">私钥</label>
            <input type="text" id="privatekey" value="" v-model="connectionInfo.options.privatekey" />
          </div>
          <div class="form-actions">
            <button class="close">Close</button>
            <button class="login">Login</button>
          </div>
        </form>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { times } from 'lodash';
import { ref, useTemplateRef, onMounted } from 'vue';

const connectionsDialog = useTemplateRef('connections-dialog');

const connections = ref([
  {
    id: '1',
    name: 'macd@192.168.2.21:22',
    options: {
      host: '192.168.2.21',
      port: 22,
      user: 'macd',
      password: '11111',
      privateKeys: '',
    },
  },
  {
    id: '2',
    name: 'macd@192.168.2.22:22',
    options: {
      host: '192.168.2.22',
      port: 22,
      user: 'macd',
      password: '11111',
      privateKeys: '',
    },
  },
  {
    id: '3',
    name: 'macd@192.168.2.23:22',
    options: {
      host: '192.168.2.23',
      port: 22,
      user: 'macd',
      password: '11111',
      privateKeys: '',
    },
  },
  {
    id: '4',
    name: 'macd@192.168.2.24:22',
    options: {
      host: '192.168.2.24',
      port: 22,
      user: 'macd',
      password: '11111',
      privateKeys: '',
    },
  },
]);

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

onMounted(() => {
  console.log(connectionsDialog.value);
  connectionsDialog.value.showModal();
});

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
</script>

<style lang="less" scoped>
dialog {
  width: 700px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  overflow: hidden;

  top: 50%;
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
  width: 35%;
  border-right: 1px solid #ccc;
  overflow-y: auto;

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
  width: 65%;
  padding: 0 20px;
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
  padding: 8px;
  font-size: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-actions button {
  padding: 8px 16px;
  font-size: 14px;
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
