// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('sshAPI', {
  connect: (clientID, connConfig, termConfig) => ipcRenderer.invoke('ssh:connect', clientID, connConfig, termConfig),
  disconnect: (clientID) => ipcRenderer.send('ssh:disconnect', clientID),
  send: (clientID, data) => ipcRenderer.send('ssh:send', clientID, data),
  receive: (clientID, callback) => ipcRenderer.on(`ssh:receive-${clientID}`, (event, data) => callback(data)),
  setWindow: (clientID, config) => ipcRenderer.send('ssh:set-window', clientID, config),
  close: (clientID, callback) => ipcRenderer.on(`ssh:close-${clientID}`, (event) => callback()),
  bell: () => ipcRenderer.send('bell'),
});

contextBridge.exposeInMainWorld('configAPI', {
  getAllConnConfigs: () => ipcRenderer.invoke('config:get-all-conn-configs'),
  getConnConfig: (connID) => ipcRenderer.invoke('config:get-conn-config', connID),
  addOrUpdateConnConfig: (config) => ipcRenderer.invoke('config:add-or-update-conn-config', config),
  deleteConnConfig: (connID) => ipcRenderer.invoke('config:delete-conn-config', connID)
})
