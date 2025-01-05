import { Client } from 'ssh2';
import { readFileSync } from 'node:fs';

class SSHClient {
  sshStream;
  sftpClient;
  constructor(clientID, win, connConfig) {
    this.sshClient = new Client();
    this.clientID = clientID;
    this.win = win;
    this.isConnected = false;
    if (connConfig.privateKey) {
      connConfig.privateKey = readFileSync(connConfig.privateKey)
    }
    this.connConfig = connConfig;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve('connected');
        return;
      }
      this.sshClient
        .on('ready', () => {
          this.isConnected = true;
          resolve('connected');
        })
        .on('error', (err) => {
          reject(err);
        })
        .connect(this.connConfig);
    });
  }

  connectShell(termConfig) {
    return this.connect().then(() => {
      return new Promise((resolve, reject) => {
        this.sshClient.shell(termConfig, (err, stream) => {
          if (err) {
            reject(err);
            return;
          }
          this.sshStream = stream;
          stream
            .on('data', (data) => {
              this.win.webContents.send(`ssh:receive-${this.clientID}`, data.toString());
            })
            .on('close', () => {
              this.sshClient.end();
              this.isConnected = false;
              this.win.webContents.send(`ssh:close-${this.clientID}`);
            });
          stream.stderr.on('data', (data) => {
            this.win.webContents.send(`ssh:receive-${this.clientID}`, data.toString());
          });
          resolve('shell connected');
        });
      });
    });
  }

  connectSFTP() {
    return this.connect().then(() => {
      return new Promise((resolve, reject) => {
        this.sshClient.sftp((err, sftp) => {
          if (err) {
            reject(err);
            return;
          }
          this.sftpClient = sftp;
          resolve('sftp connected');
        });
      });
    });
  }

  setWindow(rows, cols) {
    if (this.sshStream) {
      this.sshStream.setWindow(rows, cols, 0, 0);
    }
  }

  send(data) {
    if (this.sshStream) {
      this.sshStream.write(data);
    }
  }

  disconnect() {
    if (this.sshClient) {
      this.sshClient.end();
    }
  }

  readDir(path) {
    return new Promise((resolve, reject) => {
      this.sftpClient.readdir(path, (err, list) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(list);
      });
    });
  }

  getHomeDir() {
    return new Promise((resolve, reject) => {
      this.sftpClient.ext_home_dir(this.connConfig.username, (err, path) => {
        if (err) {
          reject(err);
          return;
        }
        if (!path.endsWith('/')) {
          path += '/';
        }
        resolve(path);
      });
    });
  }

  upload(localPath, remotePath) {
    return new Promise((resolve, reject) => {
      this.sftpClient.fastPut(localPath, remotePath, {
        step: function(total_transferred, chunk, total) {
          console.log('uploaded', total_transferred/total);
        }
      }, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve('uploaded');
      });
    });
  }

  stat(remotePath) {
    return new Promise((resolve, reject) => {
      this.sftpClient.stat(remotePath, (err, stats) => {
        if (err) {
          console.log('stat error', err);
          if (err.code === 2) {
            // 没有这个文件
            resolve(false);
            return;
          }
          reject(err);
          return;
        }
        resolve(stats);
      });
    });
  }

  mkdir(dirPath) {
    return new Promise((resolve, reject) => {
      this.sftpClient.mkdir(dirPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  download(remotePath, localPath) {
    return new Promise((resolve, reject) => {
      this.sftpClient.fastGet(remotePath, localPath,{
        step: function(total_transferred, chunk, total) {
          console.log('download', total_transferred/total);
        }
      }, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}

export { SSHClient };
