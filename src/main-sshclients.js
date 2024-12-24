import { Client } from 'ssh2';

class SSHClient {
  sshStream;
  constructor(clientID, win) {
    this.sshClient = new Client();
    this.clientID = clientID;
    this.win = win;
    this.isClosed = true;
  }

  connect(connConfig, termConfig) {
    return new Promise((resolve, reject) => {
      this.sshClient
        .on('ready', () => {
          this.sshClient.shell(termConfig, (err, stream) => {
            if (err) {
              return reject(err);
            }
            this.isClosed = false
            this.sshStream = stream;
            stream
              .on('data', (data) => {
                this.win.webContents.send(`ssh:receive-${this.clientID}`, data.toString());
              })
              .on('close', () => {
                this.sshClient.end();
                this.isClosed = true;
                this.win.webContents.send(`ssh:close-${this.clientID}`);
              });
            stream.stderr.on('data', (data) => {
              this.win.webContents.send(`ssh:receive-${this.clientID}`, data.toString());
            });
          });
          resolve('connected');
        })
        .on('error', (err) => {
          reject(err);
        })
        .connect(connConfig);
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
}

export { SSHClient };
