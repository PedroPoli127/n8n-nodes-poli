import { IExecuteFunctions, INodeType, INodeTypeDescription, JsonObject, NodeApiError } from 'n8n-workflow';
import { apiRequest } from './transport';
import { getParameterSafe } from './utils/parameterUtils';

export class CreateTag implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Create Tag',
    name: 'createTag',
    icon: 'file:poli.svg',
    group: ['output'],
    version: 1,
    description: 'Create a new tag',
    defaults: {
      name: 'Create Tag',
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
        name: 'accountId',
        type: 'string',
        default: '',
        required: true,
      },
      {
        displayName: 'Tag Name',
        name: 'tagName',
        type: 'string',
        default: '',
        required: true,
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
        required: true,
      },
      {
        displayName: 'Color',
        name: 'color',
        type: 'string',
        default: '#f0f0f0',
        required: true,
        description: 'Color in hexadecimal format (e.g., #f0f0f0)',
      },
    ],
  };

  async execute(this: IExecuteFunctions) {
    const items = this.getInputData();
    const returnData = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const accountId = getParameterSafe(this, 'accountId', i, '', true);
        const tagName = getParameterSafe(this, 'tagName', i, '');
        const description = getParameterSafe(this, 'description', i, '');
        const color = getParameterSafe(this, 'color', i, '#f0f0f0');

        const body = {
          status: 'ACTIVE',
          attributes: {
            name: tagName,
            description: description,
            color: color,
          },
        };

        const endpoint = `/accounts/${accountId}/tags?include=attributes`;
        const responseData = await apiRequest.call(this, 'POST', endpoint, body);
        returnData.push({ json: responseData });
      } catch (error) {
        throw new NodeApiError(this.getNode(), error as JsonObject);
      }
    }

    return [returnData];
  }
}