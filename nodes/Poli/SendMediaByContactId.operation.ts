import { IExecuteFunctions, INodeType, INodeTypeDescription, JsonObject, IDataObject, IHttpRequestMethods } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { getParameterSafe } from './utils/parameterUtils';

export class SendMediaByContactId implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Send Media By Contact UUID',
    name: 'sendMediaByContactId',
    icon: 'file:poli.svg',
    group: ['output'],
    version: 1,
    description: 'Send media to a contact by UUID using form-data',
    defaults: {
      name: 'Send Media By Contact UUID',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'poliApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Contact UUID',
        name: 'contactId',
        type: 'string',
        default: '',
        required: true,
        description: 'The UUID of the contact to send media to',
      },
      {
        displayName: 'Account Channel UUID',
        name: 'accountChannelUuid',
        type: 'string',
        default: '9b8bae9e-350d-4084-89e0-c4fe983420ef',
        required: true,
        description: 'The account channel UUID',
      },
      {
        displayName: 'Media Type',
        name: 'mediaType',
        type: 'options',
        options: [
          {
            name: 'Image',
            value: 'IMAGE',
          },
          {
            name: 'Document',
            value: 'DOCUMENT',
          },
          {
            name: 'Video',
            value: 'VIDEO',
          },
          {
            name: 'Audio',
            value: 'AUDIO',
          },
        ],
        default: 'IMAGE',
        required: true,
        description: 'Type of media to send',
      },
      {
        displayName: 'Caption',
        name: 'caption',
        type: 'string',
        default: '',
        description: 'Caption for the media (optional)',
      },
      {
        displayName: 'File Input Method',
        name: 'fileInputMethod',
        type: 'options',
        options: [
          {
            name: 'Binary Data',
            value: 'binaryData',
            description: 'Use binary data from previous node (recommended)',
          },
          {
            name: 'File Path',
            value: 'filePath',
            description: 'Specify file path on the server',
          },
          {
            name: 'Base64 Data',
            value: 'base64',
            description: 'Provide base64 encoded file data',
          },
        ],
        default: 'binaryData',
        description: 'Choose how to provide the file',
      },
      {
        displayName: 'Binary Property Name',
        name: 'binaryPropertyName',
        type: 'string',
        default: 'data',
        required: true,
        displayOptions: {
          show: {
            fileInputMethod: ['binaryData'],
          },
        },
        description: 'Binary data property name that contains the file to send (usually "data")',
      },
      {
        displayName: 'File Path',
        name: 'filePath',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            fileInputMethod: ['filePath'],
          },
        },
        description: 'Path to the file on the server (e.g., /tmp/image.jpg)',
      },
      {
        displayName: 'File Name',
        name: 'fileName',
        type: 'string',
        default: 'file',
        displayOptions: {
          show: {
            fileInputMethod: ['filePath', 'base64'],
          },
        },
        description: 'Name for the file (with extension)',
      },
      {
        displayName: 'Base64 Data',
        name: 'base64Data',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            fileInputMethod: ['base64'],
          },
        },
        description: 'Base64 encoded file data (without the data:image/jpeg;base64, prefix)',
      },
      {
        displayName: 'MIME Type',
        name: 'mimeType',
        type: 'string',
        default: 'image/jpeg',
        displayOptions: {
          show: {
            fileInputMethod: ['filePath', 'base64'],
          },
        },
        description: 'MIME type of the file (e.g., image/jpeg, image/png, application/pdf)',
      },
    ],
  };

  async execute(this: IExecuteFunctions) {
    const items = this.getInputData();
    const returnData = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const contactId = getParameterSafe(this, 'contactId', i, '', true);
        const accountChannelUuid = getParameterSafe(this, 'accountChannelUuid', i, '9b8bae9e-350d-4084-89e0-c4fe983420ef', true);
        const mediaType = getParameterSafe(this, 'mediaType', i, 'IMAGE');
        const caption = getParameterSafe(this, 'caption', i, '');
        const fileInputMethod = getParameterSafe(this, 'fileInputMethod', i, 'binaryData');

        // Prepare the form-data payload
        const formDataPayload = {
          provider: 'WHATSAPP',
          account_channel_uuid: accountChannelUuid,
          type: 'MEDIA',
          version: 'v3',
          direction: 'OUT',
          components: {
            attachments: [
              {
                type: mediaType,
                media: {
                  uploaded: true,
                  caption: caption,
                },
              },
            ],
          },
        };

        let fileBuffer: Buffer;
        let fileName: string;
        let mimeType: string;

        // Handle different file input methods
        if (fileInputMethod === 'binaryData') {
          // Get from binary data (existing logic)
          const binaryPropertyName = getParameterSafe(this, 'binaryPropertyName', i, 'data', true);
          const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
          fileBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
          fileName = binaryData.fileName || 'file';
          mimeType = binaryData.mimeType || 'application/octet-stream';
        } else if (fileInputMethod === 'filePath') {
          // Read from file path
          const fs = require('fs');
          const path = require('path');
          const filePath = getParameterSafe(this, 'filePath', i, '', true);
          const userFileName = getParameterSafe(this, 'fileName', i, '');
          const userMimeType = getParameterSafe(this, 'mimeType', i, '');
          
          if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
          }
          
          fileBuffer = fs.readFileSync(filePath);
          fileName = userFileName || path.basename(filePath);
          mimeType = userMimeType || 'application/octet-stream';
        } else if (fileInputMethod === 'base64') {
          // Handle base64 data
          const base64Data = getParameterSafe(this, 'base64Data', i, '', true);
          const userFileName = getParameterSafe(this, 'fileName', i, 'file');
          const userMimeType = getParameterSafe(this, 'mimeType', i, 'image/jpeg');
          
          fileBuffer = Buffer.from(base64Data, 'base64');
          fileName = userFileName;
          mimeType = userMimeType;
        } else {
          throw new Error('Invalid file input method');
        }

        // Prepare form data usando httpRequest do n8n
        const FormData = require('form-data');
        const formData = new FormData();
        
        // Add the JSON data as a form field (seguindo a especificação da API - key: form-data)
        formData.append('form-data', JSON.stringify(formDataPayload));
        
        // Add the file (key: file)
        formData.append('file', fileBuffer, {
          filename: fileName,
          contentType: mimeType,
        });

        const credentials = await this.getCredentials('poliApi');
        const baseUrl = 'https://foundation-api.poli.digital/v3';
        const endpoint = `/contacts/${contactId}/messages`;
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        
        const options = {
          method: 'POST' as IHttpRequestMethods,
          url: `${baseUrl}${normalizedEndpoint}`,
          headers: {
            'Authorization': `Bearer ${credentials.apiKey}`,
            ...formData.getHeaders(),
          },
          body: formData,
          timeout: 60000, // 60 segundos para uploads
        };

        try {
          const responseData = await this.helpers.httpRequest(options);
          returnData.push({ json: responseData });
        } catch (error: any) {
          throw new NodeApiError(this.getNode(), error as JsonObject);
        }
      } catch (error) {
        throw new NodeApiError(this.getNode(), error as JsonObject);
      }
    }

    return [returnData];
  }
}