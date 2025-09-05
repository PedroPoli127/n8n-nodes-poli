import { IExecuteFunctions, INodeType, INodeTypeDescription, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from './transport';
import { getParameterSafe } from './utils/parameterUtils';

export class SendMessageByPhoneNumber implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Send Message By Phone Number',
    name: 'sendMessageByPhoneNumber',
    icon: 'file:poli.svg',
    group: ['output'],
    version: 1,
    description: 'Send a message to a phone number',
    defaults: {
      name: 'Send Message By Phone Number',
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
        displayName: 'Account UUID',
        name: 'accountIdMessage',
        type: 'string',
        default: '',
        required: true,
      },
      {
        displayName: 'Phone Number',
        name: 'phoneNumber',
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
        const accountId = getParameterSafe(this, 'accountIdMessage', i, '', true);
        const phoneNumber = getParameterSafe(this, 'phoneNumber', i, '', true);
        const accountChannelUuid = getParameterSafe(this, 'accountChannelUuid', i, '', true);
        const text = getParameterSafe(this, 'text', i, 'Teste de mensagem');

        const body = {
          provider: 'WHATSAPP',
          account_channel_uuid: accountChannelUuid,
          type: 'TEXT',
          version: 'v3',
          components: { body: { text } },
        };

        const endpoint = `/accounts/${accountId}/contacts/${encodeURIComponent(phoneNumber?.toString() || '')}/messages?include=contact`;
        const responseData = await apiRequest.call(this, 'POST', endpoint, body);
        returnData.push({ json: responseData });
      } catch (error) {
        throw new NodeApiError(this.getNode(), error as JsonObject);
      }
    }

    return [returnData];
  }
}