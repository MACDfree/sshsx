import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import { SSHClient } from './main-sshclients';
import Store from 'electron-store';
import yaml from 'js-yaml';
import contextMenu from 'electron-context-menu';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

contextMenu({
  showSaveImageAs: true,
});

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

ipcMain.handle('ssh:connect-shell', async (_, clientID, connConfig, termConfig) => {
  console.log('ssh:connect-shell', clientID);
  let sshClient = sshClients[clientID];
  if (!sshClient) {
    sshClient = new SSHClient(clientID, mainWindow, connConfig);
    sshClients[clientID] = sshClient;
  }
  return sshClient.connectShell(termConfig);
});

ipcMain.handle('ssh:connect-sftp', async (_, clientID, connConfig) => {
  console.log('ssh:connect-sftp', clientID);
  let sshClient = sshClients[clientID];
  if (!sshClient) {
    sshClient = new SSHClient(clientID, mainWindow, connConfig);
    sshClients[clientID] = sshClient;
  }
  return sshClient.connectSFTP();
});

ipcMain.on('ssh:disconnect', (event, clientID) => {
  const sshClient = sshClients[clientID];
  if (!sshClient) {
    return;
  }
  if (!sshClient.isConnected) {
    delete sshClients[clientID];
    return;
  }
  sshClient.disconnect();
});

ipcMain.on('ssh:set-window', (event, clientID, config) => {
  const sshClient = sshClients[clientID];
  if (!sshClient) {
    return;
  }
  if (!sshClient.isConnected) {
    delete sshClients[clientID];
    return;
  }
  sshClient.setWindow(config.rows, config.cols);
});

ipcMain.on('ssh:send', (event, clientID, data) => {
  const sshClient = sshClients[clientID];
  if (!sshClient) {
    return;
  }
  if (!sshClient.isConnected) {
    delete sshClients[clientID];
    return;
  }
  sshClient.send(data);
});

ipcMain.on('bell', (event) => {
  shell.beep();
});

ipcMain.handle('ssh:read-dir', async (_, clientID, path) => {
  const sshClient = sshClients[clientID];
  if (!sshClient) {
    return;
  }
  if (!sshClient.isConnected) {
    delete sshClients[clientID];
    return;
  }
  return sshClient.readDir(path);
});

ipcMain.handle('ssh:get-home-dir', async (_, clientID) => {
  const sshClient = sshClients[clientID];
  if (!sshClient) {
    return;
  }
  if (!sshClient.isConnected) {
    delete sshClients[clientID];
    return;
  }
  return sshClient.getHomeDir();
});

ipcMain.handle('ssh:upload-files', async (_, clientID, filePaths, remotePath) => {
  const sshClient = sshClients[clientID];
  if (!sshClient) {
    return;
  }
  if (!sshClient.isConnected) {
    delete sshClients[clientID];
    return;
  }
  for (const i in filePaths) {
    const filePath = filePaths[i];
    const isDir = await isDirectory(filePath);
    const basename = path.basename(filePath);
    console.log(`upload ${filePath} to ${remotePath}${basename}`);
    if (isDir) {
      const uploadFileList = await getAllFilePaths(filePath);
      for (const j in uploadFileList) {
        const uploadFilePath = uploadFileList[j];
        const relativePath = path.relative(filePath, uploadFilePath);
        console.log(`relativePath=${relativePath}`);
        const remoteFilePath = path.join(remotePath, basename, relativePath).replaceAll('\\', '/');
        console.log(`remoteFilePath=${remoteFilePath}`);
        const remoteDirPath = path.dirname(remoteFilePath);
        console.log(`remoteDirPath=${remoteDirPath}`);
        let stat = await sshClient.stat(remoteDirPath);
        if (!stat) {
          await sshClient.mkdir(remoteDirPath);
        }
        stat = await sshClient.stat(remoteFilePath);
        if (stat) {
          // 文件已存在，需要人工确认一下
          console.log('file exists, need confirm');
        }
        await sshClient.upload(filePath, remoteFilePath);
      }
    } else {
      const stat = await sshClient.stat(path.join(remotePath, basename).replaceAll('\\', '/'));
      console.log(stat);
      if (stat) {
        // 文件已存在，需要人工确认一下
        console.log('file exists, need confirm');
      }
      await sshClient.upload(filePath, path.join(remotePath, basename).replaceAll('\\', '/'));
    }
  }

  return 'success';
});

async function getAllFilePaths(dirPath) {
  const uploadFileList = [];

  function readdir(dirPath) {
    return new Promise((resolve, reject) => {
      fs.readdir(dirPath, (err, entries) => {
        if (err) {
          reject(err);
        } else {
          resolve(entries);
        }
      });
    });
  }

  async function traverse(dirPath) {
    const entries = await readdir(dirPath);
    for (const i in entries) {
      const entry = entries[i];
      const fullPath = path.join(dirPath, entry); // 拼接完整路径
      const isdir = await isDirectory(fullPath);
      if (isdir) {
        await traverse(fullPath); // 如果是文件夹，递归调用
      } else {
        uploadFileList.push(fullPath); // 如果是文件，添加到列表
      }
    }
  }

  await traverse(dirPath);

  return uploadFileList;
}

function isDirectory(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats.isDirectory());
      }
    });
  });
}

ipcMain.handle('ssh:start-drag', async (event, clientID, filePath) => {
  const sshClient = sshClients[clientID];
  if (!sshClient) {
    return;
  }
  if (!sshClient.isConnected) {
    delete sshClients[clientID];
    return;
  }

  let stat = await sshClient.stat(filePath);
  if (!stat) {
    console.log('file not exist', filePath)
    return;
  }
  console.log('stat', stat)

  const basename = path.basename(filePath);
  const fileType = stat.mode >>> 12;
  if (fileType === 8) {
    // 普通文件
    console.log('file')
    const tempPath = app.getPath('temp')
    console.log(tempPath)

  } else if (fileType === 4) {
    // 目录
    console.log('dir')
  } else {
    return;
  }

  // event.sender.startDrag({
  //   file: 'E:\\code\\js\\myssh\\my-vue-app\\src',
  //   icon: 'E:\\code\\js\\myssh\\my-vue-app\\src\\drag-and-drop.png',
  // });
});

const store = new Store({
  fileExtension: 'yaml',
  serialize: yaml.dump,
  deserialize: yaml.load,
});

ipcMain.handle('config:get-all-conn-configs', async (event) => {
  return new Promise((resolve, reject) => {
    resolve(store.get('hosts') ?? []);
  });
});

ipcMain.handle('config:get-conn-config', async (event, connID) => {
  return new Promise((resolve, reject) => {
    const hosts = store.get('hosts') ?? [];
    const c = hosts.find((host) => host.id === connID);
    if (c) {
      resolve(c);
    } else {
      reject(`not found connID: ${connID}`);
    }
  });
});

ipcMain.handle('config:add-or-update-conn-config', async (event, connConfig) => {
  return new Promise((resolve, reject) => {
    const hosts = store.get('hosts') ?? [];
    const index = hosts.findIndex((host) => host.id === connConfig.id);
    if (index === -1) {
      hosts.push(connConfig);
      store.set('hosts', hosts);
      resolve('add');
    } else {
      hosts[index] = connConfig;
      store.set('hosts', hosts);
      resolve('update');
    }
  });
});

ipcMain.handle('config:delete-conn-config', async (event, connID) => {
  return new Promise((resolve, reject) => {
    const hosts = store.get('hosts') ?? [];
    const index = hosts.findIndex((host) => host.id === connID);
    if (index === -1) {
      reject(`not found connID: ${connID}`);
    } else {
      hosts.splice(index, 1);
      store.set('hosts', hosts);
      resolve(`delete: ${connID}}`);
    }
  });
});
