
import { NodeSSH } from 'node-ssh'
import { Client } from 'ssh2'

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


    // async ensureConnect () {
    //     await this.sshDriver.connect({

    //     })
    // }

}

// const SFTPClient = require('ssh2-sftp-client');
// Function to transfer files using SCP (SFTP)
// async function transferFileOverSCP(config, localPath, remotePath) {
//     const sftp = new SFTPClient();
//     try {
//         await sftp.connect(config);
//         await sftp.put(localPath, remotePath);
//         console.log('File transferred successfully!');
//     } catch (err) {
//         console.error('Error:', err);
//     } finally {
//         await sftp.end();
//     }
// }
