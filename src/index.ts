
import { Client } from 'ssh2'
import SftpClient from 'ssh2-sftp-client'

export class ServerProvisioner {
    host
    sshPort
    privateKey
    privateKeyPassPhrase
    userName
    readyTimeout

    // sshClient = new Client()


    constructor({
        host,
        sshPort,
        privateKey,
        userName,
        privateKeyPassPhrase = "",
        readyTimeout = 20000
    }) {
        this.host = host
        this.sshPort = sshPort
        this.privateKey = privateKey
        this.userName = userName
        this.privateKeyPassPhrase = privateKeyPassPhrase
        this.readyTimeout = readyTimeout
    }


    async runCommandOverSSH(command) {
        return new Promise((resolve, reject) => {
            const conn = new Client();
            conn.on('ready', () => {
                conn.exec(command, (err, stream) => {
                    /* istanbul ignore if */
                    if (err) return reject(err);

                    let stdout = '';
                    let stderr = '';

                    stream.on('close', (code, signal) => {
                        conn.end();
                        resolve({ stdout, stderr, code, signal, result: stdout.replace(/\n/g, '') });
                    }).on('data', (data) => {
                        stdout += data;
                    }).stderr.on('data', (data) => {
                        stderr += data;
                    });
                });
            }).connect({
                host: this.host,
                port: this.sshPort,
                username: this.userName,
                privateKey: this.privateKey,
                passphrase: this.privateKeyPassPhrase,
                readyTimeout: this.readyTimeout,
            });
        });
    }

    async transferFileToRemote(localPath, remotePath) {
        const sftp = new SftpClient();
        try {
            await sftp.connect({
                host: this.host,
                port: this.sshPort,
                username: this.userName,
                privateKey: this.privateKey,
                passphrase: this.privateKeyPassPhrase,
                readyTimeout: this.readyTimeout,
            });
            await sftp.put(localPath, remotePath);
        } catch (err) {
            console.error('Error:', err);
            throw err
        } finally {
            await sftp.end();
        }
    }

    async transferFileToLocal(remotePath, localPath) {
        const sftp = new SftpClient();
        try {
            await sftp.connect({
                host: this.host,
                port: this.sshPort,
                username: this.userName,
                privateKey: this.privateKey,
                passphrase: this.privateKeyPassPhrase,
                readyTimeout: this.readyTimeout,
            });
            await sftp.fastGet(remotePath, localPath);
        } catch (err) {
            console.error('Error:', err);
            throw err
        } finally {
            await sftp.end();
        }
    }

    async deleteFileFromRemote(remotePath) {
        const sftp = new SftpClient();
        try {
            await sftp.connect({
                host: this.host,
                port: this.sshPort,
                username: this.userName,
                privateKey: this.privateKey,
                passphrase: this.privateKeyPassPhrase,
                readyTimeout: this.readyTimeout,
            });
            await sftp.delete(remotePath);
        } catch (err) {
            console.error('Error:', err);
            throw err
        } finally {
            await sftp.end();
        }
    }
}

