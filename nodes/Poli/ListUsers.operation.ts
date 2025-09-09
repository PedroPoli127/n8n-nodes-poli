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

export const listUsersFields: INodeProperties[] = [
	{
		displayName: 'Account UUID',
		name: 'accountUuid',
		type: 'string',
		required: true,
		default: '',
		description: 'UUID da conta para listar os usuários',
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
				description: 'Termo para pesquisar usuários',
			},
			{
				displayName: 'Order',
				name: 'order',
				type: 'string',
				default: '',
				description: 'Ordenação dos resultados',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				description: 'Número da página',
			},
			{
				displayName: 'Per Page',
				name: 'perPage',
				type: 'number',
				default: 100,
				description: 'Quantidade de resultados por página',
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Query string bruta (ex: id=18&name=gabriel)',
			},
			{
				displayName: 'Include',
				name: 'include',
				type: 'multiOptions',
				options: [
					{ name: 'Status', value: 'status' },
					{ name: 'Status of Service', value: 'status_of_service' },
					{ name: 'Email', value: 'email' },
					{ name: 'Attributes', value: 'attributes' },
					{ name: 'Roles', value: 'roles' },
					{ name: 'Permissions', value: 'permissions' },
					{ name: 'Active Account', value: 'active_account' },
					{ name: 'Account Channels', value: 'account_channels' },
					{ name: 'Accounts', value: 'accounts' },
					{ name: 'Teams', value: 'teams' },
					{ name: 'Addresses', value: 'addresses' },
					{ name: 'Metadata', value: 'metadata' },
				],
				default: [],
				description: 'Dados adicionais para incluir na resposta',
			},
		],
	},
];

export async function executeListUsers(this: IExecuteFunctions): Promise<any> {
	const items = this.getInputData();
	const returnData = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const accountUuid = getParameterSafe(this, 'accountUuid', i, '', true) as string;
			const options = getParameterSafe(this, 'options', i, {}) as {
				search?: string;
				order?: string;
				page?: number;
				perPage?: number;
				query?: string;
				include?: string[];
			};

			if (!accountUuid) {
				throw new NodeApiError(this.getNode(), {
					message: 'Account UUID é obrigatório',
				} as JsonObject);
			}

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

			const endpoint = `/accounts/${accountUuid}/users?${params.toString()}`;
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

export class ListUsers implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'List Users',
		name: 'listUsers',
		group: ['output'],
		version: 1,
		description: 'List all users from a specific account in Poli API',
		defaults: {
			name: 'List Users',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: listUsersFields,
	};

	async execute(this: IExecuteFunctions) {
		return executeListUsers.call(this);
	}
}
