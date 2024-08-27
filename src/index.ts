
import { Client } from 'ssh2'
import SftpClient from 'ssh2-sftp-client'
import { v4 as uuidv4 } from "uuid"
import fs from 'fs-extra';

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

    async sftPConnect(sftp) {
        try {
            await sftp.connect({
                host: this.host,
                port: this.sshPort,
                username: this.userName,
                privateKey: this.privateKey,
                passphrase: this.privateKeyPassPhrase,
                readyTimeout: this.readyTimeout,
            });
        }
        catch (err) {
            console.error('sftPConnect', err.message)
            throw err
        }
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
            await this.sftPConnect(sftp)
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
            await this.sftPConnect(sftp)
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
            await this.sftPConnect(sftp)
            await sftp.delete(remotePath);
        } catch (err) {
            console.error('Error:', err);
            throw err
        } finally {
            await sftp.end();
        }
    }

    async readFile(remotePath) {
        const runCommand: any = await this.runCommandOverSSH(`cat ${remotePath}`)
        const result = runCommand?.stdout
        return result
    }

    async write(remotePath, content = "") {
        const uuid = uuidv4()
        const filePath = `/tmp/${uuid}`
        await fs.writeFile(filePath, content, "utf8")

        await this.transferFileToRemote(filePath, remotePath)
        await fs.remove(filePath)
    }

    async writeJsonFile(remotePath, contentObj = {}) {
        await this.write(remotePath, JSON.stringify(contentObj))
    }
    async readJsonFile(remotePath) {
        const res = await this.readFile(remotePath)
        try {
            const result = JSON.parse(res)
            return result
        } catch (err) {
            console.error('readJsonFile', err.message)
            throw err
        }
    }

    // async readJsonFile(remotePath) {
    //     const runCommand: any = await this.runCommandOverSSH(`cat ${remotePath}`)
    //     const result = runCommand?.stdout
    //     return result
    // }
}

