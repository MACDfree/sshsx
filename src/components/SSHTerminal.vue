<template>
  <div class="terminal-container">
    <div ref="terminalDiv" class="terminal"></div>
  </div>
</template>

<script setup>
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { FitAddon } from '@xterm/addon-fit';
import { onMounted, useTemplateRef, watch, nextTick } from 'vue';
import _ from 'lodash';

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

const emit = defineEmits(['close']);

const terminalDiv = useTemplateRef('terminalDiv');

let resizeTerminal;
let terminal;

onMounted(async () => {
  console.log(`props.connId: ${props.connId}, props.clientId: ${props.clientId}`);

  terminal = new Terminal({
    // cursorBlink: true,
    // fontSize: 14,
    fontFamily: 'Consolas',
  });
  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open(terminalDiv.value);
  terminal.focus();
  fitAddon.fit();

  // 防抖
  resizeTerminal = _.debounce(() => {
    fitAddon.fit();
    window.sshAPI.setWindow(props.clientId, { cols: terminal.cols, rows: terminal.rows });
  }, 100);
  window.addEventListener('resize', resizeTerminal); // 监听窗口大小变化

  const connConfig = await window.configAPI.getConnConfig(props.connId);
  console.log(connConfig);

  window.sshAPI
    .connectShell(
      props.clientId,
      {
        host: connConfig.options.host,
        port: connConfig.options.port,
        username: connConfig.options.user,
        password: connConfig.options.password,
      },
      {
        cols: terminal.cols,
        rows: terminal.rows,
        term: 'xterm-256color',
      },
    )
    .then((message) => {
      console.log(message);
      terminal.writeln('Connected to SSH server.');
    })
    .catch((error) => {
      terminal.writeln(`Error: ${error.message}`);
    });

  terminal.onData((data) => {
    window.sshAPI.send(props.clientId, data);
  });

  terminal.onBell((event) => {
    console.log('Bell', event);
    window.sshAPI.bell();
  });

  window.sshAPI.receive(props.clientId, (data) => {
    terminal.write(data);
  });

  window.sshAPI.close(props.clientId, () => {
    terminal.writeln('Connection closed.');
    emit('close', props.clientId);
  });
});

watch(
  () => props.isActive,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        if (terminal) {
          terminal.focus();
        }
        // 激活窗口时，调整终端大小
        if (resizeTerminal) {
          resizeTerminal();
        }
      });
    }
  },
);
</script>

<style lang="less" scoped>
.terminal-container {
  width: 100%;
  height: 100%;
  background-color: #000;
  overflow-y: hidden;
  overflow-x: hidden;
  .terminal {
    height: 100%;
  }
}
</style>
