import {
    ServerProvisioner
} from './src/index';
import fs from 'fs-extra';

import { NodeSSH } from 'node-ssh'
import { Client } from 'ssh2'




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

});
