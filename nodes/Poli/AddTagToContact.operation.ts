import { IExecuteFunctions, INodeType, INodeTypeDescription, JsonObject, NodeApiError } from 'n8n-workflow';
import { apiRequest } from './transport';
import { getParameterSafe } from './utils/parameterUtils';

export class AddTagToContact implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Add Tag To Contact',
    name: 'addTagToContact',
    icon: 'file:poli.svg',
    group: ['output'],
    version: 1,
    description: 'Add a tag to a contact',
    defaults: {
      name: 'Add Tag To Contact',
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
        name: 'contactUuid',
        type: 'string',
        required: true,
        default: '',
        description: 'UUID of the contact to which the tag will be added',
      },
      {
        displayName: 'Tag UUID',
        name: 'tagUuid',
        type: 'string',
        required: true,
        default: '',
        description: 'UUID of the tag to be added to the contact',
      },
    ],
    codex: {
      categories: ['Poli'], // Agrupamento no menu (opcional)
    },
  };

  async execute(this: IExecuteFunctions) {
    const items = this.getInputData();
    const returnData = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const contactUuid = getParameterSafe(this, 'contactUuid', i, '', true);
        const tagUuid = getParameterSafe(this, 'tagUuid', i, '');

        const body = {
          tags: [
            {
              uuid: tagUuid,
            },
          ],
        };

        const endpoint = `/contacts/${contactUuid}?include=attributes,tags`;
        const responseData = await apiRequest.call(this, 'PUT', endpoint, body);
        returnData.push({ json: responseData });
      } catch (error) {
        throw new NodeApiError(this.getNode(), error as JsonObject);
      }
    }

    return [returnData];
  }
}
