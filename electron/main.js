import { app, BrowserWindow, ipcMain, Menu, shell, dialog, clipboard } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import { SSHClient } from './main-sshclients';
import Store from 'electron-store';
import yaml from 'js-yaml';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow;

const store = new Store({
  fileExtension: 'yaml',
  serialize: yaml.dump,
  deserialize: yaml.load,
});

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

let configFilePath;
let configStore;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  configFilePath = store.get('configFilePath');
  if (!configFilePath || !fs.existsSync(configFilePath)) {
    // 弹出文件选择框
    const result = await dialog.showOpenDialog({
      title: '选择配置文件',
      buttonLabel: '选择',
      properties: ['openFile'],
      filters: [{ name: '配置文件', extensions: ['json', 'yaml', 'yml', 'ini'] }],
    });

    // 检查是否选择了文件
    if (result.canceled || result.filePaths.length === 0) {
      app.quit(); // 如果没有选择文件，退出应用
      return;
    }

    // 保存配置文件路径
    configFilePath = result.filePaths[0];
    store.set('configFilePath', configFilePath);
  }

  configStore = ConfigUtil.getInstance(configFilePath);

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
      console.log('uploadFileList', uploadFileList);
      for (const j in uploadFileList) {
        const uploadFilePath = uploadFileList[j];
        const relativePath = path.relative(filePath, uploadFilePath.replace(/\|\|aaisdirbb$/, ''));
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
        if (uploadFilePath.endsWith('||aaisdirbb')) {
          await sshClient.mkdir(remoteFilePath);
        } else {
          await sshClient.upload(uploadFilePath, remoteFilePath);
        }
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
    if (entries.length === 0) {
      uploadFileList.push(dirPath + '||aaisdirbb');
      return;
    }
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

function getStat(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve(false);
          return;
        }
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
}

function mkdir(dirPath) {
  return new Promise((resolve, reject) => {
    fs.mkdir(
      dirPath,
      {
        recursive: true,
      },
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      },
    );
  });
}

async function getAllRemoteFilePaths(sshClient, dirPath) {
  const filePaths = [];

  async function traverse(dPath) {
    const entries = await sshClient.readDir(dPath);
    if (entries.length === 0) {
      filePaths.push(dPath + '/');
    }
    for (const i in entries) {
      const entry = entries[i];
      const fullPath = path.join(dPath, entry.filename).replaceAll('\\', '/'); // 拼接完整路径
      const isdir = entry.attrs.mode >>> 12 === 4;
      if (isdir) {
        await traverse(fullPath); // 如果是文件夹，递归调用
      } else {
        filePaths.push(fullPath); // 如果是文件，添加到列表
      }
    }
  }

  await traverse(dirPath);

  return filePaths;
}

async function download(clientID, remotePath, localPath) {
  const sshClient = sshClients[clientID];
  if (!sshClient) {
    return;
  }
  if (!sshClient.isConnected) {
    delete sshClients[clientID];
    return;
  }

  let stat = await sshClient.stat(remotePath);
  if (!stat) {
    console.log('file not exist', remotePath);
    return;
  }
  console.log('stat', stat);

  const basename = path.basename(remotePath);
  const fileType = stat.mode >>> 12;
  if (fileType === 8) {
    // 普通文件
    console.log('file');
    await sshClient.download(remotePath, path.join(localPath, basename));
  } else if (fileType === 4) {
    // 目录
    console.log('dir');
    const remoteFilePaths = await getAllRemoteFilePaths(sshClient, remotePath);
    console.log(remoteFilePaths);
    for (const remoteFilePath of remoteFilePaths) {
      const relativePath = path.relative(remotePath, remoteFilePath);
      console.log('relativePath', relativePath);
      const localFilePath = path.join(localPath, basename, relativePath);
      console.log('localFilePath', localFilePath);
      const localDirPath = path.dirname(localFilePath);
      console.log('localDirPath', localDirPath);
      let stat = await getStat(localDirPath);
      if (!stat) {
        await mkdir(localDirPath);
      }

      stat = await getStat(localFilePath);
      if (stat) {
        console.log('file exists, need confirm');
      }
      if (remoteFilePath.endsWith('/')) {
        await mkdir(localFilePath);
      } else {
        await sshClient.download(remoteFilePath, localFilePath);
      }
    }
  } else {
    return;
  }
}

ipcMain.on('ssh:show-context-menu', (event, type, args) => {
  let template;
  if (type === 'sftp') {
    template = [
      {
        label: '下载',
        click: async () => {
          const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
          });
          if (canceled) {
            console.log('Dialog was canceled');
            return;
          }
          const localPath = filePaths[0];
          console.log(localPath);
          await download(args.clientID, args.remotePath, localPath);
        },
      },
      {
        label: '删除',
        click: async () => {
          const { response } = await dialog.showMessageBox(mainWindow, {
            message: `是否删除${args.remotePath}？`,
            type: 'warning',
            buttons: ['是', '否'],
          });
          if (response === 0) {
            // TODO
            //await remove(args.clientID, args.remotePath);
          }
        },
      },
      {
        label: '复制路径',
        click: () => {
          clipboard.writeText(args.remotePath);
        },
      },
      {
        label: '复制文件名',
        click: () => {
          const fileName = path.basename(args.remotePath);
          clipboard.writeText(fileName);
        },
      },
      {
        label: '创建文件夹',
        click: () => {
          // TODO
        },
      },
    ];
  } else if (type === 'ssh') {
    template = [
      {
        label: '复制',
        click: () => {
          clipboard.writeText(args.selection);
        },
      },
      {
        label: '粘贴',
        click: () => {
          event.sender.paste();
        },
      },
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
});

class ConfigUtil {
  static getInstance(configFilePath) {
    if (!ConfigUtil.instance) {
      ConfigUtil.instance = new ConfigUtil(configFilePath);
    }
    return ConfigUtil.instance;
  }

  constructor(configFilePath) {
    this.configFilePath = configFilePath;
    if (fs.existsSync(configFilePath)) {
      this.config = yaml.load(fs.readFileSync(configFilePath, 'utf-8')) ?? {};
    } else {
      this.config = {};
    }
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
    this.save();
  }

  save() {
    fs.writeFile(this.configFilePath, yaml.dump(this.config), 'utf-8', (err) => {
      if (err) {
        console.log('save config error', err);
      }
    });
  }
}

ipcMain.handle('config:get-all-conn-configs', async (event) => {
  return new Promise((resolve, reject) => {
    resolve(configStore.get('hosts') ?? []);
  });
});

ipcMain.handle('config:get-conn-config', async (event, connID) => {
  return new Promise((resolve, reject) => {
    const hosts = configStore.get('hosts') ?? [];
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
    const hosts = configStore.get('hosts') ?? [];
    const index = hosts.findIndex((host) => host.id === connConfig.id);
    if (index === -1) {
      hosts.push(connConfig);
      configStore.set('hosts', hosts);
      resolve('add');
    } else {
      hosts[index] = connConfig;
      configStore.set('hosts', hosts);
      resolve('update');
    }
  });
});

ipcMain.handle('config:delete-conn-config', async (event, connID) => {
  return new Promise((resolve, reject) => {
    const hosts = configStore.get('hosts') ?? [];
    const index = hosts.findIndex((host) => host.id === connID);
    if (index === -1) {
      reject(`not found connID: ${connID}`);
    } else {
      hosts.splice(index, 1);
      configStore.set('hosts', hosts);
      resolve(`delete: ${connID}}`);
    }
  });
});


ipcMain.handle('dialog:info', async (event, message) => {
  return await dialog.showMessageBox(mainWindow, {
    type: 'info',
    message,
  });
});

ipcMain.handle('dialog:confirm', async (event, message) => {
  return await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    message,
    buttons: ['确定', '取消'],
    cancelId: 1,
  });
});