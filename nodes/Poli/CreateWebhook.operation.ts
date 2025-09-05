import { IExecuteFunctions, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from './transport';
import { getParameterSafe, validateAndSanitizeUrl, validateRequiredArray } from './utils/parameterUtils';
import { JsonObject } from 'n8n-workflow';

export class CreateWebhook implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Create Webhook',
    name: 'createWebhook',
    icon: 'file:poli.svg',
    group: ['output'],
    version: 1,
    description: 'Create a new webhook',
    defaults: {
      name: 'Create Webhook',
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
        displayName: 'Application UUID',
        name: 'applicationId',
        type: 'string',
        default: '',
        required: true,
      },
      {
        displayName: 'Webhook URL',
        name: 'url',
        type: 'string',
        default: '',
        required: true,
      },
      {
        displayName: 'Subscriptions',
        name: 'subscriptions',
        type: 'multiOptions',
        options: [
          { name: 'Organizations', value: 'organizations' },
          { name: 'Chats', value: 'chats' },
          { name: 'Contacts', value: 'contacts' },
          { name: 'Users', value: 'users' },
          { name: 'Applications', value: 'applications' },
        ],
        default: [],
        required: true,
      },
    ],
  };

  async execute(this: IExecuteFunctions) {
    const items = this.getInputData();
    const returnData = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const applicationId = getParameterSafe(this, 'applicationId', i, '', true);
        const url = getParameterSafe(this, 'url', i, '', true) as string;
        const subscriptions = getParameterSafe(this, 'subscriptions', i, [], true) as string[];

        // Validate URL usando função utilitária
        const validatedUrl = validateAndSanitizeUrl(url, 'url');

        // Validate subscriptions usando função utilitária
        validateRequiredArray(subscriptions, 'subscriptions');

        const validSubscriptions = ['organizations', 'chats', 'contacts', 'users', 'applications'];
        const invalidSubscriptions = subscriptions.filter(s => !validSubscriptions.includes(s));
        if (invalidSubscriptions.length > 0) {
          throw new Error(`Invalid subscriptions: ${invalidSubscriptions.join(', ')}`);
        }

                const body = {
          url: validatedUrl,
          subscriptions: subscriptions.filter(sub => validSubscriptions.includes(sub)),
        };
        const endpoint = `/applications/${applicationId}/webhooks?include=url,subscriptions`;

        try {
          const responseData = await apiRequest.call(this, 'POST', endpoint, body);
          returnData.push({ json: responseData });
        } catch (error: any) {
          if (error.message?.includes('already exists')) {
            throw new Error('A webhook with this URL already exists for this application.');
          }
          throw error;
        }
      } catch (error) {
        throw new NodeApiError(this.getNode(), error as JsonObject);
      }
    }

    return [returnData];
  }
}