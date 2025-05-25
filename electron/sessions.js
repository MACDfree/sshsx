import { SSHClient } from './sshclients.js';
import fs from 'node:fs';

class Session {
  /**
   * @param {string} id - 会话唯一标识符
   * @param {SSHClient} sshClient - SSH客户端实例
   */
  constructor(id, sshClient) {
    this.id = id;
    this.sshClient = sshClient;
    this.tmpDir = '';
    this.watcher = null;
  }

  async clear() {
    this.sshClient.disconnect();
    // 如果有watcher，需要关闭watcher
    if (this.watcher) {
      await this.watcher.close();
    }
    // 然后如果tmpDir路径存在，需要删除
    if (this.tmpDir && fs.existsSync(this.tmpDir)) {
      return new Promise((resolve, reject) => {
        fs.rm(this.tmpDir, { recursive: true, force: true }, (err) => {
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

let sessions = {};

async function getSession(id) {
  const session = sessions[id];
  if (!session) {
    return null;
  }
  if (!session.sshClient.isConnected) {
    clearSession(id);
    return null;
  }
  return session;
}

function addSession(id, sshClient) {
  sessions[id] = new Session(id, sshClient);
  return sessions[id];
}

async function clearSession(id) {
  const session = sessions[id];
  if (!session) {
    return;
  }
  await session.clear();
  delete sessions[id];
}

export { getSession, addSession, clearSession };
