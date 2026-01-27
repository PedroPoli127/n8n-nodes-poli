# Como Trabalhar com Upload de Arquivos no n8n

## Problema Original
O campo "file" no node SendMediaByContactId estava configurado apenas para aceitar dados binários de nodes anteriores, mas não oferecia opções diretas para upload de arquivos.

## Soluções Implementadas

### 1. **Binary Data (Recomendado)**
- **Como usar**: Conecte um node que produz dados binários (como HTTP Request, Read Binary File, etc.)
- **Vantagens**: Mais flexível, permite processar arquivos de várias fontes
- **Exemplo de workflow**:
  1. **HTTP Request** node → baixa uma imagem da internet
  2. **Send Media By Contact ID** node → envia a imagem baixada

### 2. **File Path**
- **Como usar**: Especifique o caminho completo do arquivo no servidor onde o n8n está rodando
- **Vantagens**: Útil para arquivos já armazenados no servidor
- **Exemplo**: `/tmp/minha-imagem.jpg`
- **Limitações**: Arquivo deve estar acessível no servidor do n8n

### 3. **Base64 Data**
- **Como usar**: Cole os dados do arquivo codificados em Base64
- **Vantagens**: Permite colar dados diretamente
- **Como obter**: Use sites como base64encode.org ou comandos no terminal
- **Exemplo no terminal**: `base64 -i minha-imagem.jpg`

## Workflows Recomendados para Upload de Imagens

### Workflow 1: Download e Envio de Imagem da Internet
```
[HTTP Request] → [Send Media By Contact ID]
```
1. **HTTP Request node**:
   - URL: https://example.com/imagem.jpg
   - Response Format: Binary
2. **Send Media By Contact ID**:
   - File Input Method: Binary Data
   - Binary Property Name: data

### Workflow 2: Upload de Arquivo Local via API
```
[Webhook] → [Send Media By Contact ID]
```
1. Configure um webhook que aceita uploads
2. Use form-data no webhook para receber o arquivo
3. O arquivo chegará como binary data no webhook

### Workflow 3: Leitura de Arquivo do Servidor
```
[Read Binary File] → [Send Media By Contact ID]
```
1. **Read Binary File node**:
   - File Path: /caminho/para/arquivo.jpg
2. **Send Media By Contact ID**:
   - File Input Method: Binary Data

### Workflow 4: Arquivo via Base64 (para testes pequenos)
```
[Set node] → [Send Media By Contact ID]
```
1. **Set node**: crie uma variável com dados base64
2. **Send Media By Contact ID**:
   - File Input Method: Base64 Data
   - Base64 Data: cole os dados base64

## Limitações do n8n

**O n8n não possui um campo nativo de "file upload" na interface dos nodes customizados.** Isso é uma limitação da arquitetura do n8n, que foi projetado para automação de fluxos de dados, não para interfaces de upload direto.

### Alternativas para "Simular" Upload:

1. **Webhook com Upload**: Crie um webhook que aceite multipart/form-data
2. **Dropbox/Google Drive Trigger**: Monitore pastas e processe automaticamente
3. **FTP/SFTP nodes**: Monitore diretórios remotos
4. **Base64 em campos de texto**: Para arquivos pequenos (limitado)

## Exemplos de Uso

### Enviar Imagem de URL
```json
{
  "contactId": "uuid-do-contato",
  "fileInputMethod": "binaryData",
  "binaryPropertyName": "data",
  "mediaType": "IMAGE",
  "caption": "Olha essa imagem!"
}
```

### Enviar PDF do Servidor
```json
{
  "contactId": "uuid-do-contato", 
  "fileInputMethod": "filePath",
  "filePath": "/tmp/documento.pdf",
  "fileName": "documento.pdf",
  "mimeType": "application/pdf",
  "mediaType": "DOCUMENT"
}
```

### Enviar Imagem via Base64
```json
{
  "contactId": "uuid-do-contato",
  "fileInputMethod": "base64", 
  "base64Data": "iVBORw0KGgoAAAANSUhEUgAA...",
  "fileName": "imagem.png",
  "mimeType": "image/png",
  "mediaType": "IMAGE"
}
```

## Conclusão

O node foi melhorado para oferecer 3 métodos flexíveis de input de arquivos. Embora o n8n não tenha upload direto nativo, essas opções cobrem a maioria dos casos de uso para automação de envio de mídia.