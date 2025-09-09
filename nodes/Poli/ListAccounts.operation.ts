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

export const listAccountsFields: INodeProperties[] = [
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
				description: 'Texto para busca de contas',
			},
			{
				displayName: 'Order',
				name: 'order',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
			},
			{
				displayName: 'Per Page',
				name: 'perPage',
				type: 'number',
				default: 100,
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Raw query string (ex: id=18&name=gabriel)',
			},
			{
				displayName: 'Include',
				name: 'include',
				type: 'multiOptions',
				options: [
					{ name: 'Status', value: 'status' },
					{ name: 'Attributes', value: 'attributes' },
					{ name: 'Organization', value: 'organization' },
					{ name: 'Account Channels', value: 'account_channels' },
					{ name: 'Addresses', value: 'addresses' },
					{ name: 'Applications', value: 'applications' },
					{ name: 'Metadata', value: 'metadata' },
				],
				default: [],
			},
		],
	},
];

export async function executeListAccounts(this: IExecuteFunctions): Promise<any> {
	const items = this.getInputData();
	const returnData = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const options = getParameterSafe(this, 'options', i, {}) as {
				search?: string;
				order?: string;
				page?: number;
				perPage?: number;
				query?: string;
				include?: string[];
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

			const endpoint = `/accounts?${params.toString()}`;
			const responseData = await apiRequest.call(this, 'GET', endpoint);
			
			// Filtra a resposta para remover campos desnecessários
			const filteredData = processApiResponseForN8n(responseData, true);
			returnData.push({ json: filteredData });
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}

	return [returnData];
}

export class ListAccounts implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'List Accounts',
		name: 'listAccounts',
		group: ['output'],
		version: 1,
		description: 'List all accounts from Poli API',
		defaults: {
			name: 'List Accounts',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: listAccountsFields,
	};

	async execute(this: IExecuteFunctions) {
		return executeListAccounts.call(this);
	}
}
