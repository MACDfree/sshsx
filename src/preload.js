// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('sshAPI', {
  connectShell: (clientID, connConfig, termConfig) =>
    ipcRenderer.invoke('ssh:connect-shell', clientID, connConfig, termConfig),
  connectSFTP: (clientID, connConfig) => ipcRenderer.invoke('ssh:connect-sftp', clientID, connConfig),
  disconnect: (clientID) => ipcRenderer.send('ssh:disconnect', clientID),
  send: (clientID, data) => ipcRenderer.send('ssh:send', clientID, data),
  receive: (clientID, callback) => ipcRenderer.on(`ssh:receive-${clientID}`, (event, data) => callback(data)),
  setWindow: (clientID, config) => ipcRenderer.send('ssh:set-window', clientID, config),
  close: (clientID, callback) => ipcRenderer.on(`ssh:close-${clientID}`, (event) => callback()),
  bell: () => ipcRenderer.send('bell'),
  readDir: (clientID, path) => ipcRenderer.invoke('ssh:read-dir', clientID, path),
  getHomeDir: (clientID) => ipcRenderer.invoke('ssh:get-home-dir', clientID),
  uploadFiles: (clientID, filePaths, remotePath) => ipcRenderer.invoke('ssh:upload-files', clientID, filePaths, remotePath),
  getFilePath: (file) => {
    return webUtils.getPathForFile(file);
  },
  showContextMenu: (type, args)=> ipcRenderer.send('ssh:show-context-menu', type, args),
});

contextBridge.exposeInMainWorld('configAPI', {
  getAllConnConfigs: () => ipcRenderer.invoke('config:get-all-conn-configs'),
  getConnConfig: (connID) => ipcRenderer.invoke('config:get-conn-config', connID),
  addOrUpdateConnConfig: (config) => ipcRenderer.invoke('config:add-or-update-conn-config', config),
  deleteConnConfig: (connID) => ipcRenderer.invoke('config:delete-conn-config', connID),
});
