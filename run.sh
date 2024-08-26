#!/bin/bash

docker compose down
SSH_DIR="./.~ssh"

rm -rf $SSH_DIR || true

sleep 1

mkdir -p $SSH_DIR || true
KEY_NAME="id_rsa"
KEY_NAME2="id_rsa_with_passphrase"
PASSPHRASE="1234"


ssh-keygen -t rsa -b 4096 -f "$SSH_DIR/$KEY_NAME" -N ""
ssh-keygen -t rsa -b 4096 -f "$SSH_DIR/$KEY_NAME2" -N "$PASSPHRASE"

cat "$SSH_DIR/$KEY_NAME.pub" >> $SSH_DIR/authorized_keys
cat "$SSH_DIR/$KEY_NAME2.pub" >> $SSH_DIR/authorized_keys

chmod 600 $SSH_DIR/authorized_keys

docker compose up -d