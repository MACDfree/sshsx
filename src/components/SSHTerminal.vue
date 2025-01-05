<template>
  <div class="terminal-container" :class="currentTheme">
    <div ref="terminalDiv" class="terminal" @contextmenu.prevent="showContextMenu($event)"></div>
  </div>
</template>

<script setup>
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { FitAddon } from '@xterm/addon-fit';
import { onMounted, useTemplateRef, watch, nextTick, ref } from 'vue';
import _ from 'lodash';
// import { ImageAddon } from '@xterm/addon-image';
// import { WebLinksAddon } from '@xterm/addon-web-links';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { SearchAddon } from '@xterm/addon-search';

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
const currentTheme = ref('dracula');

const themes = {
  dracula: {
    background: '#1E1F29',
    black: '#000000',
    blue: '#BD93F9',
    brightBlack: '#555555',
    brightBlue: '#BD93F9',
    brightCyan: '#8BE9FD',
    brightGreen: '#50FA7B',
    brightMagenta: '#FF79C6',
    brightRed: '#FF5555',
    brightWhite: '#FFFFFF',
    brightYellow: '#F1FA8C',
    cursor: '#BBBBBB',
    cursorAccent: undefined,
    cyan: '#8BE9FD',
    extendedAnsi: undefined,
    foreground: '#F8F8F2',
    green: '#50FA7B',
    magenta: '#FF79C6',
    red: '#FF5555',
    selectionBackground: undefined,
    selectionForeground: undefined,
    selectionInactiveBackground: undefined,
    white: '#BBBBBB',
    yellow: '#F1FA8C',
  },
  solarized_light: {
    background: '#FCF4DC',
    black: '#002831',
    blue: '#2176C7',
    brightBlack: '#001E27',
    brightBlue: '#2496D4',
    brightCyan: '#25A89E',
    brightGreen: '#82A11A',
    brightMagenta: '#D3488B',
    brightRed: '#BD3613',
    brightWhite: '#FCF4DC',
    brightYellow: '#B6941D',
    cursor: '#536870',
    cursorAccent: undefined,
    cyan: '#259286',
    extendedAnsi: undefined,
    foreground: '#536870',
    green: '#738A05',
    magenta: '#C61C6F',
    red: '#D11C24',
    selectionBackground: undefined,
    selectionForeground: undefined,
    selectionInactiveBackground: undefined,
    white: '#EAE3CB',
    yellow: '#A57706',
  },
};

let resizeTerminal;
let terminal;
let searchAddon;

onMounted(async () => {
  console.log(`props.connId: ${props.connId}, props.clientId: ${props.clientId}`);

  const connConfig = await window.configAPI.getConnConfig(props.connId);
  console.log(connConfig);

  // const customSettings = {
  //   enableSizeReports: true, // whether to enable CSI t reports (see below)
  //   pixelLimit: 16777216, // max. pixel size of a single image
  //   sixelSupport: true, // enable sixel support
  //   sixelScrolling: true, // whether to scroll on image output
  //   sixelPaletteLimit: 256, // initial sixel palette size
  //   sixelSizeLimit: 25000000, // size limit of a single sixel sequence
  //   storageLimit: 128, // FIFO storage limit in MB
  //   showPlaceholder: true, // whether to show a placeholder for evicted images
  //   iipSupport: true, // enable iTerm IIP support
  //   iipSizeLimit: 20000000, // size limit of a single IIP sequence
  // };

  currentTheme.value = connConfig.options.theme ?? 'dracula';

  terminal = new Terminal({
    // cursorBlink: true,
    fontSize: connConfig.options.fontsize ?? 14,
    fontFamily: connConfig.options.font ?? 'Consolas',
    allowProposedApi: true, // 启用提议的 API
    theme: themes[currentTheme.value],
  });
  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  // const imageAddon = new ImageAddon(customSettings);
  // terminal.loadAddon(imageAddon);
  // terminal.loadAddon(new WebLinksAddon());
  const unicode11Addon = new Unicode11Addon();
  terminal.loadAddon(unicode11Addon);
  terminal.unicode.activeVersion = '11';
  searchAddon = new SearchAddon();
  terminal.loadAddon(searchAddon);
  //searchAddon.findNext('foo');
  terminal.open(terminalDiv.value);
  terminal.focus();
  fitAddon.fit();

  // 防抖
  resizeTerminal = _.debounce(() => {
    fitAddon.fit();
    window.sshAPI.setWindow(props.clientId, { cols: terminal.cols, rows: terminal.rows });
  }, 100);
  window.addEventListener('resize', resizeTerminal); // 监听窗口大小变化

  window.sshAPI
    .connectShell(
      props.clientId,
      {
        host: connConfig.options.host,
        port: connConfig.options.port,
        username: connConfig.options.user,
        password: connConfig.options.password,
        privateKey: connConfig.options.privatekey,
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

const showContextMenu = (event) => {
  window.sshAPI.showContextMenu('ssh', { clientID: props.clientId, selection: terminal.getSelection() });
};
</script>

<style lang="less" scoped>
.terminal-container {
  width: 100%;
  height: 100%;
  overflow-y: hidden;
  overflow-x: hidden;
  .terminal {
    height: 100%;
  }
  &.dracula {
    background-color: #1e1f29;
  }
  &.solarized_light {
    background-color: #fcf4dc;
  }
}
</style>
