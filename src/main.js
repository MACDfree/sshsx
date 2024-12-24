import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { Client } from 'ssh2';
import {SSHClient} from './main-sshclients';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    //frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.menuBarVisible = false;

  console.log(`__dirname: ${__dirname}`);
  console.log(`MAIN_WINDOW_VITE_DEV_SERVER_URL: ${MAIN_WINDOW_VITE_DEV_SERVER_URL}`);
  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

let sshClients = {};

ipcMain.handle('ssh:connect', async (_, clientID, connConfig, termConfig) => {
  console.log('ssh:connect', clientID);
  const sshClient = new SSHClient(clientID, mainWindow);
  sshClients[clientID] = sshClient;
  return sshClient.connect(connConfig, termConfig);
});

ipcMain.on('ssh:set-window', (event, clientID, config) => {
  const sshClient = sshClients[clientID];
  if (sshClient && sshClient.isClosed) {
    return;
  }
  sshClient.setWindow(config.rows, config.cols);
});

ipcMain.on('ssh:send', (event, clientID, data) => {
  const sshClient = sshClients[clientID];
  if (sshClient && sshClient.isClosed) {
    return;
  }
  sshClient.send(data);
});

ipcMain.on('bell', (event) => {
  shell.beep();
});

let config = {
  hosts: [
    {
      id: '3c7b3718-9839-47ee-aeb7-511792776469',
      name: 'macd@192.168.2.21:22',
      options: {
        host: '192.168.2.21',
        port: 22,
        user: 'macd',
        password: '11111',
        privateKeys: '',
      },
    },
  ],
};

ipcMain.handle('config:get-all-conn-configs', async (event) => {
  return new Promise((resolve, reject) => {
    resolve(config.hosts);
  });
})

ipcMain.handle('config:get-conn-config', async (event, connID) => {
  return new Promise((resolve, reject) => {
    const c = config.hosts.find(host => host.id === connID)
    if (c) {
      resolve(c);
    } else {
      reject(`not found connID: ${connID}`);
    }
  });
})
