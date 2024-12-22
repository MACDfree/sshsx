<template>
  <div class="terminal-container">
    <div ref="terminalDiv" class="terminal"></div>
  </div>
</template>

<script setup>
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { FitAddon } from '@xterm/addon-fit';
import { onMounted, useTemplateRef } from 'vue';
import _ from 'lodash';

const terminalDiv = useTemplateRef('terminalDiv');

onMounted(() => {
  const terminal = new Terminal({
    // cursorBlink: true,
    // fontSize: 14,
    fontFamily: 'Consolas',
  });
  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open(terminalDiv.value);
  fitAddon.fit();

  // 防抖
  const resizeTerminal = _.debounce(() => {
    console.log('resized');
    fitAddon.fit();
    window.electronAPI.setWindow({ cols: terminal.cols, rows: terminal.rows });
  }, 200);
  window.addEventListener('resize', resizeTerminal); // 监听窗口大小变化

  const config = {
    host: '192.168.2.21',
    port: 22,
    username: 'macd',
    password: '11111',
    cols: terminal.cols,
    rows: terminal.rows,
    term: 'xterm-256color',
  };

  window.electronAPI
    .connectSSH(config)
    .then((message) => {
      console.log(message);
      terminal.writeln('Connected to SSH server.');
    })
    .catch((error) => {
      terminal.writeln(`Error: ${error.message}`);
    });

  terminal.onData((data) => {
    window.electronAPI.sendData(data);
  });

  terminal.onBell((event) => {
    console.log('Bell', event);
    window.electronAPI.bell();
  });

  window.electronAPI.onData((data) => {
    // console.log(data);
    terminal.write(data);
  });
});
</script>

<style lang="less" scoped>
.terminal-container {
  width: 100%;
  height: 100%;
  display: flex;
  background-color: #000;
  overflow-y: hidden;
  .terminal {
    flex: 1; /* 使终端填充父容器 */
  }
}
</style>
