// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  connectSSH: (config) => ipcRenderer.invoke('connect-ssh', config),
  sendData: (data) => ipcRenderer.send('send-data', data),
  onData: (callback) =>
    ipcRenderer.on('ssh-data', (event, data) => callback(data)),
  setWindow: (config) => ipcRenderer.send('set-window', config),
  bell: () => ipcRenderer.send('bell'),
});
