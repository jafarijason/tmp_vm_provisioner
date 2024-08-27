#!/bin/bash

docker compose down
SSH_DIR="./.~ssh"

VM_FOLDER="./.~vmfolder"
LOCAL_FOLDER="./.~localfoler"
TMP_FOLDER="./.~tmp"

rm -rf $SSH_DIR || true
rm -rf $VM_FOLDER || true
rm -rf $LOCAL_FOLDER || true

sleep 1

mkdir -p $SSH_DIR || true
mkdir -p $VM_FOLDER || true
mkdir -p $LOCAL_FOLDER || true
mkdir -p $TMP_FOLDER || true
KEY_NAME="id_rsa"
KEY_NAME2="id_rsa_with_passphrase"
PASSPHRASE="1234"


ssh-keygen -t rsa -b 4096 -f "$SSH_DIR/$KEY_NAME" -N ""
ssh-keygen -t rsa -b 4096 -f "$SSH_DIR/$KEY_NAME2" -N "$PASSPHRASE"

cat "$SSH_DIR/$KEY_NAME.pub" >> $SSH_DIR/authorized_keys
cat "$SSH_DIR/$KEY_NAME2.pub" >> $SSH_DIR/authorized_keys

chmod 600 $SSH_DIR/authorized_keys

docker compose up -d