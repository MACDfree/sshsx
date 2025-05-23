<script setup>
import {
  NFlex,
  NButton,
  NTree,
  NIcon,
  NDropdown,
  useDialog,
  useMessage,
  NModal,
  NForm,
  NGrid,
  NFormItemGi,
  NInput,
  NInputNumber,
  NSelect,
  NGi,
} from 'naive-ui';
import { Folder, FolderOpenOutline, DesktopOutline, EllipsisHorizontal } from '@vicons/ionicons5';
import { ref, h, onMounted, toRaw } from 'vue';
import { v4 as uuidv4 } from 'uuid';

const connections = ref([]);
const dialog = useDialog();
const message = useMessage();
const showEdit = ref(false);
const modalTitle = ref('新建连接');
const connectionInfo = ref({
  id: '',
  name: '',
  group: '',
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
const groups = ref([]);
const terms = [
  {
    label: 'xterm-256color',
    value: 'xterm-256color',
  },
  {
    label: 'vt100',
    value: 'vt100',
  },
];
const themes = [
  {
    label: 'Dracula',
    value: 'dracula',
  },
  {
    label: 'Solarized Light',
    value: 'solarized_light',
  },
];

const buildConnectionTree = async () => {
  let res = await window.configAPI.getAllConnConfigs();

  const grouped = res.reduce((acc, conn) => {
    const groupName = conn.group || '未分组';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(conn);
    return acc;
  }, {});

  groups.value = Object.keys(grouped).map((groupName) => {
    return {
      label: groupName,
      value: groupName,
    };
  });

  connections.value = Object.entries(grouped).map(([groupName, conns]) => {
    return {
      label: groupName,
      key: groupName,
      prefix: () =>
        h(NIcon, null, {
          default: () => h(FolderOpenOutline),
        }),
      children: conns.map((conn) => {
        return {
          ...conn,
          label: conn.name,
          key: conn.id,
          prefix: () =>
            h(NIcon, null, {
              default: () => h(DesktopOutline),
            }),
          suffix: () =>
            h(
              NDropdown,
              {
                trigger: 'click',
                options: [
                  { label: '编辑', key: 'edit' },
                  { label: '删除', key: 'delete' },
                ],
                onSelect: (key, event) => {
                  console.log('选中操作:', key);
                  if (key === 'edit') {
                    modalTitle.value = conn.name;
                    showEdit.value = true;
                    connectionInfo.value = conn;
                  } else if (key === 'delete') {
                    deleteConnection(conn.id, conn.name);
                  }
                },
              },
              {
                default: () =>
                  h(
                    NButton,
                    {
                      text: true,
                      type: 'default',
                      size: 'small',
                      onClick: (event) => {
                        event.stopPropagation();
                      },
                    },
                    {
                      default: () =>
                        h(NIcon, null, {
                          default: () => h(EllipsisHorizontal),
                        }),
                    },
                  ),
              },
            ),
        };
      }),
    };
  });
};

onMounted(async () => {
  await buildConnectionTree();
});

async function deleteConnection(id, name) {
  dialog.warning({
    title: '警告',
    content: `删除 “${name}”？`,
    positiveText: '确定',
    negativeText: '不确定',
    draggable: true,
    onPositiveClick: () => {
      window.configAPI
        .deleteConnConfig(id)
        .then((res) => {
          console.log(res);
          return buildConnectionTree();
        })
        .then(() => {
          message.success('删除成功');
        });
    },
    onNegativeClick: () => {},
  });
}

const openNewConnection = () => {
  connectionInfo.value = {
    id: '',
    name: '',
    group: '',
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
  showEdit.value = true;
};

const rules = {
  name: {
    required: true,
    trigger: ['input', 'blur'],
    message: '请输入名称',
  },
  options: {
    host: {
      required: true,
      trigger: ['input', 'blur'],
      message: '请输入主机',
    },
    port: {
      type: 'number',
      required: true,
      trigger: ['input', 'blur'],
      message: '请输入端口',
    },
  },
};
const saveConnection = async (event) => {
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

  const rawConn = toRaw(connectionInfo.value);
  delete rawConn.label;
  delete rawConn.key;
  delete rawConn.prefix;
  delete rawConn.suffix;

  window.configAPI
    .addOrUpdateConnConfig(rawConn)
    .then((res) => {
      return buildConnectionTree();
    })
    .then(() => {
      message.success('保存成功');
      showEdit.value = false;
    });
};

const updatePrefixWithExpaned = (_keys, _option, meta) => {
  if (!meta.node) return;
  switch (meta.action) {
    case 'expand':
      meta.node.prefix = () =>
        h(NIcon, null, {
          default: () => h(FolderOpenOutline),
        });
      break;
    case 'collapse':
      meta.node.prefix = () =>
        h(NIcon, null, {
          default: () => h(Folder),
        });
      break;
  }
};

const nodeProps = ({ option }) => {
  return {
    onClick() {
      if (!option.children && !option.disabled) {
        modalTitle.value = option.name;
        showEdit.value = true;
        connectionInfo.value = option;
      }
    },
  };
};
</script>

<template>
  <n-flex vertical style="padding: 10px 20px">
    <n-flex>
      <n-button type="primary" size="small" @click="openNewConnection">新增连接</n-button>
    </n-flex>
    <n-tree
      block-line
      expand-on-click
      default-expand-all
      :data="connections"
      :node-props="nodeProps"
      :on-update:expanded-keys="updatePrefixWithExpaned"
    ></n-tree>
  </n-flex>
  <n-modal
    v-model:show="showEdit"
    :mask-closable="false"
    :title="modalTitle"
    preset="card"
    draggable
    :style="{ width: '600px' }"
  >
    <n-form label-placement="top" :model="connectionInfo" size="small" :rules="rules">
      <n-grid :cols="24" :x-gap="24">
        <n-form-item-gi :span="24" label="名称" path="name">
          <n-input v-model:value="connectionInfo.name" placeholder="" />
        </n-form-item-gi>
        <n-form-item-gi :span="24" label="分组" path="group">
          <n-select filterable tag v-model:value="connectionInfo.group" :options="groups" placeholder="" />
        </n-form-item-gi>
        <n-form-item-gi :span="18" label="主机" path="options.host">
          <n-input v-model:value="connectionInfo.options.host" placeholder="" />
        </n-form-item-gi>
        <n-form-item-gi :span="6" label="端口" path="options.port">
          <n-input-number v-model:value="connectionInfo.options.port" placeholder="" />
        </n-form-item-gi>
        <n-form-item-gi :span="24" label="用户名" path="options.user">
          <n-input v-model:value="connectionInfo.options.user" placeholder="" />
        </n-form-item-gi>
        <n-form-item-gi :span="24" label="密码" path="options.password">
          <n-input
            type="password"
            show-password-on="mousedown"
            v-model:value="connectionInfo.options.password"
            placeholder=""
          />
        </n-form-item-gi>
        <n-form-item-gi :span="24" label="私钥" path="options.privatekey">
          <n-input v-model:value="connectionInfo.options.privatekey" placeholder="" />
        </n-form-item-gi>
        <n-form-item-gi :span="18" label="字体" path="options.font">
          <n-input v-model:value="connectionInfo.options.font" placeholder="" />
        </n-form-item-gi>
        <n-form-item-gi :span="6" label="字号" path="options.fontsize">
          <n-input-number v-model:value="connectionInfo.options.fontsize" placeholder="" />
        </n-form-item-gi>
        <n-form-item-gi :span="12" label="终端类型" path="options.term">
          <n-select v-model:value="connectionInfo.options.term" :options="terms" placeholder="" />
        </n-form-item-gi>
        <n-form-item-gi :span="12" label="主题" path="options.theme">
          <n-select v-model:value="connectionInfo.options.theme" :options="themes" placeholder="" />
        </n-form-item-gi>
        <n-gi :span="24">
          <n-flex justify="end">
            <n-button type="primary" @click="saveConnection">保存</n-button>
            <n-button @click="showEdit = false">取消</n-button>
          </n-flex>
        </n-gi>
      </n-grid>
    </n-form>
  </n-modal>
</template>
