import { Client } from 'ssh2';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { dir } from 'node:console';

class SSHClient {
  sshStream;
  sftpClient;
  constructor(clientID, win, connConfig) {
    this.sshClient = new Client();
    this.clientID = clientID;
    this.win = win;
    this.isConnected = false;
    if (connConfig.privateKey) {
      connConfig.privateKey = readFileSync(connConfig.privateKey);
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

  async connectShell(termConfig) {
    await this.connect();
    return await new Promise((resolve, reject) => {
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
        stream.stderr.on('data', (data_1) => {
          this.win.webContents.send(`ssh:receive-${this.clientID}`, data_1.toString());
        });
        resolve('shell connected');
      });
    });
  }

  async connectSFTP() {
    await this.connect();
    return await new Promise((resolve, reject) => {
      this.sshClient.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }
        this.sftpClient = sftp;
        resolve('sftp connected');
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
      this.sshClient.exec('echo $HOME', (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        stream
          .on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            stream.close();
          })
          .on('data', (data) => {
            let path = data.toString().trim();
            if (!path.endsWith('/')) {
              path += '/';
            }
            resolve(path);
            console.log('STDOUT: ' + path);
          })
          .stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
          });
      });
    });
  }

  upload(localPath, remotePath) {
    const self = this;
    return new Promise((resolve, reject) => {
      this.sftpClient.fastPut(
        localPath,
        remotePath,
        {
          step: function (total_transferred, chunk, total) {
            console.log('uploaded', total_transferred / total);
            self.win.webContents.send(`ssh:upload-file-process-${self.clientID}`, {
              path: localPath,
              process: total_transferred / total,
            });
          },
        },
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve('uploaded');
        },
      );
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

  async mkdir(dirPath) {
    const sftpClient = this.sftpClient;
    let found = false;
    let basePaths = [];
    let basePath = dirPath;
    do {
      basePath = basePath.substring(0, basePath.lastIndexOf('/'));
      console.log('basePath', basePath);
      if (basePath === '') {
        break;
      }
      found = await this.stat(basePath);
      console.log('found', found);
      if (!found) {
        basePaths.push(basePath);
      }
    } while (!found);

    for (let i = basePaths.length - 1; i >= 0; i--) {
      await new Promise((resolve, reject) => {
        sftpClient.mkdir(basePaths[i], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    await new Promise((resolve, reject) => {
      sftpClient.mkdir(dirPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  download(remotePath, localPath) {
    const self = this;
    return new Promise((resolve, reject) => {
      this.sftpClient.fastGet(
        remotePath,
        localPath,
        {
          step: function (total_transferred, chunk, total) {
            console.log('download', total_transferred / total);
            self.win.webContents.send(`ssh:upload-file-process-${self.clientID}`, {
              path: remotePath,
              process: total_transferred / total,
            });
          },
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

  async remove(remotePath) {
    const sftpClient = this.sftpClient;
    const st = await this.stat(remotePath);
    if (!st) {
      return;
    }
    const fileType = st.mode >>> 12;
    if (fileType === 8) {
      // 普通文件
      await new Promise((resolve, reject) => {
        sftpClient.unlink(remotePath, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    } else if (fileType === 4) {
      // 目录
      const files = await this.readDir(remotePath);
      for (const file of files) {
        console.log('delete', file.filename);
        await this.remove(remotePath + '/' + file.filename);
      }

      await new Promise((resolve, reject) => {
        sftpClient.rmdir(remotePath, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    }
  }
}

export { SSHClient };
