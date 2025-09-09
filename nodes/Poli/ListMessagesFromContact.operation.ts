import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	NodeApiError,
	INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from './transport';
import { getParameterSafe } from './utils/parameterUtils';
import { processApiResponseForN8n } from './utils/responseFilter';

export const listMessagesFromContactFields: INodeProperties[] = [
	{
		displayName: 'Contact UUID',
		name: 'contactUuid',
		type: 'string',
		default: '',
		required: true,
		description: 'UUID do contato',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Include',
				name: 'include',
				type: 'multiOptions',
				options: [
					{ name: 'Components', value: 'components' },
				],
				default: [],
				description: 'Campos adicionais para incluir na resposta',
			},
			{
				displayName: 'Order',
				name: 'order',
				type: 'string',
				default: 'created_at',
				description: 'Campo e direção de ordenação, ex: created_at desc',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Número da página',
			},
			{
				displayName: 'Per Page',
				name: 'perPage',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Itens por página',
			},
		],
	},
];

export async function executeListMessagesFromContact(this: IExecuteFunctions): Promise<any> {
	const items = this.getInputData();
	const returnData = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const contactUuid = getParameterSafe(this, 'contactUuid', i, '', true) as string;
			const options = getParameterSafe(this, 'options', i, {}) as {
				include?: string[];
				order?: string;
				page?: number;
				perPage?: number;
			};

			const params = new URLSearchParams();

			if (options.include?.length) {
				params.append('include', options.include.join(','));
			}

			if (options.order) {
				params.append('order', options.order);
			}

			if (options.page) {
				params.append('page', options.page.toString());
			}

			if (options.perPage) {
				params.append('per_page', options.perPage.toString());
			}

			const queryString = params.toString();
			const endpoint = `/contacts/${contactUuid}/messages${queryString ? `?${queryString}` : ''}`;

			const responseData = await apiRequest.call(this, 'GET', endpoint);
			returnData.push({ json: responseData });
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}

	return [returnData];
}

export class ListMessagesFromContact implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'List Messages from Contact',
		name: 'listMessagesFromContact',
		group: ['output'],
		version: 1,
		description: 'List messages from contact ID from Poli API',
		defaults: {
			name: 'List Messages from Contact',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: listMessagesFromContactFields,
	};

	async execute(this: IExecuteFunctions): Promise<any> {
		return executeListMessagesFromContact.call(this);
	}
}
