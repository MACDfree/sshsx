<script setup>
import { Folder, FolderOpenOutline, DesktopOutline } from '@vicons/ionicons5';
import { ref, h } from 'vue';
import { NModal, NTree, NIcon, NButton, NButtonGroup } from 'naive-ui';

const emit = defineEmits(['login']);

const showModal = ref(false);

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
            h(NButtonGroup, null, {
              default: () => [
                h(
                  NButton,
                  {
                    text: false,
                    type: 'default',
                    size: 'small',
                    onClick: () => loginSSH(event, conn.id, conn.name),
                  },
                  {
                    default: () => 'SSH',
                  },
                ),
                h(
                  NButton,
                  {
                    text: false,
                    type: 'default',
                    size: 'small',
                    onClick: () => loginSFTP(event, conn.id, conn.name),
                  },
                  {
                    default: () => 'SFTP',
                  },
                ),
              ],
            }),
        };
      }),
    };
  });
};

async function openConnInfoDialog() {
  await buildConnectionTree();
  showModal.value = true;
}

defineExpose({
  openConnInfoDialog,
});

const connections = ref([]);

const nodeProps = ({ option }) => {
  return {
    onClick(event) {
      if (!option.children && !option.disabled) {
        console.log(`[Click] ${option.label}`);
        console.log(option);
        loginSSH(event, option.id, option.label);
      }
    },
  };
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

function closeDialog() {
  showModal.value = false;
}

function loginSSH(event, connectionID, title) {
  event.stopPropagation(); // 阻止事件向上冒泡
  // 登录逻辑
  console.log('login');
  emit('login', connectionID, title, 'ssh');
  closeDialog();
}

function loginSFTP(event, connectionID, title) {
  event.stopPropagation(); // 阻止事件向上冒泡
  // 登录逻辑
  console.log('loginSFTP');
  emit('login', connectionID, title, 'sftp');
  closeDialog();
}
</script>

<template>
  <n-modal :show="showModal" mask-closable :on-mask-click="closeDialog">
    <div class="modal-body">
      <n-tree
        block-line
        expand-on-click
        default-expand-all
        :data="connections"
        :node-props="nodeProps"
        :on-update:expanded-keys="updatePrefixWithExpaned"
      />
    </div>
  </n-modal>
</template>

<style lang="less" scoped>
.modal-body {
  background-color: #fff;
  border-radius: 4px;
  padding: 10px 10px;
  max-height: 350px;
  width: 500px;
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
