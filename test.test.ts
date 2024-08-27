import {
    ServerProvisioner
} from './src/index';
import fs from 'fs-extra';

import { NodeSSH } from 'node-ssh'
import { Client } from 'ssh2'
import { v4 as uuidv4 } from "uuid"




describe('ServerProvisioner', () => {

    let privateSshKey;
    let privateSshKeyWithPasPhrase;
    let privateKeyPassPhrase = "1234";

    beforeEach(async () => {
        if (!privateSshKey) {
            privateSshKey = await fs.readFile("./.~ssh/id_rsa", "utf8")
        }
        if (!privateSshKeyWithPasPhrase) {
            privateSshKeyWithPasPhrase = await fs.readFile("./.~ssh/id_rsa_with_passphrase", "utf8")
        }
        // let publicSshKey = await fs.readFile("./.~ssh/id_rsa.pub")
        // let publicSshKey = await fs.readFile("./.~ssh/id_rsa.pub")

    })

    test('Instance new ServerProvisioner and ensure get property', async () => {
        const vm1 = new ServerProvisioner({
            host: "127.0.0.1",
            sshPort: 22,
            userName: 'root',
            privateKey: "TEST_PRIVATE_KEY",
            privateKeyPassPhrase: "TEST_PRIVATEKEY_PSSPHRASE"
        })

        expect(vm1.host).toBe("127.0.0.1")
        expect(vm1.sshPort).toBe(22)
        expect(vm1.userName).toBe("root")
        expect(vm1.privateKey).toBe("TEST_PRIVATE_KEY")
        expect(vm1.privateKeyPassPhrase).toBe("TEST_PRIVATEKEY_PSSPHRASE")
        // expect(vm1.sshClient).toBeInstanceOf(Client)
    });


    describe('runCommandOverSSH', () => {
        test('Run simple command to server', async () => {
            const vm1 = new ServerProvisioner({
                host: "127.0.0.1",
                sshPort: 2222,
                userName: 'root',
                privateKey: privateSshKey,
            })

            const result: any = await vm1.runCommandOverSSH("whoami")
            expect(result.code).toBe(0)
            expect(result.result).toBe("root")
            expect(result.stdout).toBe("root\n")

        });

        test(
            'Run simple command to server and catch error for invalid configuration',
            async () => {
                try {
                    const vm1 = new ServerProvisioner({
                        host: "127.0.0.1",
                        sshPort: 2222,
                        userName: 'root',
                        privateKey: `asdasd`,
                    })
                    const result: any = await vm1.runCommandOverSSH("whoami")
                } catch (err) {
                    expect(err.message).toBe("Cannot parse privateKey: Unsupported key format")
                }

            },
            10000
        );

        test('Run simple command to server and catch error at runtime', async () => {
            const vm1 = new ServerProvisioner({
                host: "127.0.0.1",
                sshPort: 2222,
                userName: 'root',
                privateKey: privateSshKey,
            })

            const result: any = await vm1.runCommandOverSSH("aaaa")
            expect(result.stderr).toBe("bash: aaaa: command not found\n")

        });


        test('Run simple command to server with sshkey passphrase', async () => {
            const vm1 = new ServerProvisioner({
                host: "127.0.0.1",
                sshPort: 2222,
                userName: 'root',
                privateKey: privateSshKeyWithPasPhrase,
                privateKeyPassPhrase: privateKeyPassPhrase,
            })

            const result: any = await vm1.runCommandOverSSH("whoami")
            expect(result.code).toBe(0)
            expect(result.result).toBe("root")
            expect(result.stdout).toBe("root\n")

        });



    })


    describe('transferFileToRemote and transferFileToLocal', () => {


        test('check error transferFileToRemote', async () => {
            const vm1 = new ServerProvisioner({
                host: "127.0.0.1",
                sshPort: 2222,
                userName: 'root',
                privateKey: 'asd',
            })

            try {
                await vm1.transferFileToRemote(
                    'testPath',
                    '/root/vm_folder/test1.txt'
                )
            } catch (err) {
                expect(err.message).toBe('connect: Cannot parse privateKey: Unsupported key format')
            }
        });
        test('check error transferFileToLocal', async () => {
            const vm1 = new ServerProvisioner({
                host: "127.0.0.1",
                sshPort: 2222,
                userName: 'root',
                privateKey: 'asd',
            })

            try {
                await vm1.transferFileToLocal(
                    '/root/vm_folder/test1.txt',
                    'testPath',
                )
            } catch (err) {
                expect(err.message).toBe('connect: Cannot parse privateKey: Unsupported key format')
            }
        });
        test('check error deleteFileFromRemote', async () => {
            const vm1 = new ServerProvisioner({
                host: "127.0.0.1",
                sshPort: 2222,
                userName: 'root',
                privateKey: 'asd',
            })

            try {
                await vm1.deleteFileFromRemote(
                    '/root/vm_folder/test1.txt',
                )
            } catch (err) {
                expect(err.message).toBe('connect: Cannot parse privateKey: Unsupported key format')
            }
        });

        test('copy simple file', async () => {
            const vm1 = new ServerProvisioner({
                host: "127.0.0.1",
                sshPort: 2222,
                userName: 'root',
                privateKey: privateSshKey,
            })

            const uuid = uuidv4()

            const originalFilePath = `${__dirname}/.~tmp/${uuid}.txt`

            await fs.writeFile(originalFilePath, uuid, "utf8")
            await vm1.transferFileToRemote(
                originalFilePath,
                '/root/vm_folder/test1.txt'
            )
            const fileExist = await fs.exists(`${__dirname}/.~vmfolder/test1.txt`)
            expect(fileExist).toBe(true)

            const originalContent = await fs.readFile(originalFilePath, "utf8")
            const transferredFile = await fs.readFile(`${__dirname}/.~vmfolder/test1.txt`, "utf8")
            expect(originalContent).toBe(transferredFile)

            await vm1.transferFileToLocal(
                '/root/vm_folder/test1.txt',
                `${__dirname}/.~localfoler/test1.txt`,
            )
            const fileExistLocal = await fs.exists(`${__dirname}/.~localfoler/test1.txt`)
            expect(fileExist).toBe(fileExistLocal)
            const transferredFileToLocal = await fs.readFile(`${__dirname}/.~localfoler/test1.txt`, "utf8")
            expect(originalContent).toBe(transferredFileToLocal)

            await vm1.deleteFileFromRemote(
                '/root/vm_folder/test1.txt',
            )

            await fs.remove(originalFilePath)
            await fs.remove(`${__dirname}/.~localfoler/test1.txt`)
        });
    })



});
