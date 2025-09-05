import { IExecuteFunctions, INodeType, INodeTypeDescription, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from './transport';
import { getParameterSafe } from './utils/parameterUtils';

export class SendMessageByContactId implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Send Message By Contact UUID',
    name: 'sendMessageByContactId',
    icon: 'file:poli.svg',
    group: ['output'],
    version: 1,
    description: 'Send a message to a contact by ID',
    defaults: {
      name: 'Send Message By Contact ID',
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
      },
      {
        displayName: 'Account Channel UUID',
        name: 'accountChannelUuid',
        type: 'string',
        default: '',
        required: true,
      },
      {
        displayName: 'Text',
        name: 'text',
        type: 'string',
        default: 'Teste de mensagem',
      },
    ],
  };

  async execute(this: IExecuteFunctions) {
    const items = this.getInputData();
    const returnData = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const contactId = getParameterSafe(this, 'contactId', i, '', true);
        const accountChannelUuid = getParameterSafe(this, 'accountChannelUuid', i, '', true);
        const text = getParameterSafe(this, 'text', i, 'Teste de mensagem');

        const body = {
          provider: 'WHATSAPP',
          account_channel_uuid: accountChannelUuid,
          type: 'TEXT',
          version: 'v3',
          direction: 'OUT',
          components: { body: { text } },
        };

        const endpoint = `/contacts/${contactId}/messages`;
        const responseData = await apiRequest.call(this, 'POST', endpoint, body);
        returnData.push({ json: responseData });
      } catch (error) {
        throw new NodeApiError(this.getNode(), error as JsonObject);
      }
    }

    return [returnData];
  }
}