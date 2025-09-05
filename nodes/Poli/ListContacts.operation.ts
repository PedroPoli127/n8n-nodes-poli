import { IExecuteFunctions, INodeType, INodeTypeDescription, JsonObject, NodeApiError, INodeProperties } from 'n8n-workflow';
import { apiRequest } from './transport';
import { getParameterSafe } from './utils/parameterUtils';

export const listContactsFields: INodeProperties[] = [
	{
		displayName: 'Account UUID',
		name: 'accountId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID da conta',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Texto para busca',
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Raw query string (ex: id=18&name=gabriel)',
			},
			{
				displayName: 'Order',
				name: 'order',
				type: 'string',
				default: '',
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
			{
				displayName: 'Include',
				name: 'include',
				type: 'multiOptions',
				options: [
					{ name: 'Type', value: 'type' },
					{ name: 'Chat Status', value: 'chat_status' },
					{ name: 'Read Status', value: 'read_status' },
					{ name: 'Attributes', value: 'attributes' },
					{ name: 'Account', value: 'account' },
					{ name: 'Attendant', value: 'attendant' },
					{ name: 'Contact Channels', value: 'contact_channels' },
					{ name: 'Current Attendance', value: 'current_attendance' },
					{ name: 'Last Message', value: 'last_message' },
					{ name: 'Tags', value: 'tags' },
					{ name: 'Addresses', value: 'addresses' },
					{ name: 'Metadata', value: 'metadata' },
				],
				default: [],
				description: 'Campos adicionais para incluir na resposta',
			},
		],
	},
];

export async function executeListContacts(this: IExecuteFunctions): Promise<any> {
	const items = this.getInputData();
	const returnData = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const accountId = getParameterSafe(this, 'accountId', i, '', true);
			const options = getParameterSafe(this, 'options', i, {}) as {
				search?: string;
				order?: string;
				page?: number;
				perPage?: number;
				include?: string[];
				query?: string;
			};

			const params = new URLSearchParams();

			if (options.search) params.append('search', options.search);
			if (options.order) params.append('order', options.order);
			if (options.page) params.append('page', options.page.toString());
			if (options.perPage) params.append('perPage', options.perPage.toString());
			if (options.include?.length) params.append('include', options.include.join(','));

			if (options.query) {
				for (const part of options.query.split('&')) {
					const [key, value] = part.split('=');
					if (key && value) {
						params.append(key.trim(), value.trim());
					}
				}
			}

			const endpoint = `/accounts/${accountId}/contacts?${params.toString()}`;
			const responseData = await apiRequest.call(this, 'GET', endpoint);
			returnData.push({ json: responseData });
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}

	return [returnData];
}

export class ListContacts implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'List Contacts',
		name: 'listContacts',
		group: ['transform'],
		version: 1,
		description: 'List contacts from Poli API',
		defaults: {
			name: 'List Contacts',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: listContactsFields,
	};

	async execute(this: IExecuteFunctions) {
		return executeListContacts.call(this);
	}
}
