#!/bin/bash

# Script para instalar nodes customizados no n8n

echo "1. Construindo o projeto..."
npm run build

echo "2. Criando diretório .n8n se não existir..."
mkdir -p ~/.n8n

echo "3. Instalando o pacote via npm..."
cd ~/.n8n
npm init -y 2>/dev/null || true
npm install /workspaces/n8n-nodes-poli

echo "4. Verificando instalação..."
ls -la ~/.n8n/node_modules/@poli-digital/

echo "5. Iniciando n8n..."
export N8N_HOST=0.0.0.0
export N8N_PORT=5678
n8n start