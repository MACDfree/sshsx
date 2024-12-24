// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('sshAPI', {
  connect: (clientID, connConfig, termConfig) => ipcRenderer.invoke('ssh:connect', clientID, connConfig, termConfig),
  send: (clientID, data) => ipcRenderer.send('ssh:send', clientID, data),
  receive: (clientID, callback) => ipcRenderer.on(`ssh:receive-${clientID}`, (event, data) => callback(data)),
  setWindow: (clientID, config) => ipcRenderer.send('ssh:set-window', clientID, config),
  close: (clientID, callback) => ipcRenderer.on(`ssh:close-${clientID}`, (event) => callback()),
  bell: () => ipcRenderer.send('bell'),
});

contextBridge.exposeInMainWorld('configAPI', {
  getAllConnConfigs: () => ipcRenderer.invoke('config:get-all-conn-configs'),
  getConnConfig: (connID) => ipcRenderer.invoke('config:get-conn-config', connID),
  addConnConfig: (config) => ipcRenderer.invoke('config:add-conn-config', config),
  updateConnConfig: (connID, config) => ipcRenderer.invoke('config:update-conn-config', connID, config),
  deleteConnConfig: (connID) => ipcRenderer.invoke('config:delete-conn-config', connID)
})
