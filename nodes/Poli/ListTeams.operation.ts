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

export const listTeamsFields: INodeProperties[] = [
	{
		displayName: 'Account UUID',
		name: 'accountUuid',
		type: 'string',
		required: true,
		default: '',
		description: 'UUID da conta para listar os times',
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
				description: 'Termo para pesquisar times',
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
					{ name: 'Key', value: 'key' },
					{ name: 'Status', value: 'status' },
					{ name: 'Visibility', value: 'visibility' },
					{ name: 'Staging', value: 'staging' },
					{ name: 'Attributes', value: 'attributes' },
					{ name: 'Users', value: 'users' },
					{ name: 'Metadata', value: 'metadata' },
				],
				default: [],
				description: 'Dados adicionais para incluir na resposta',
			},
		],
	},
];

export async function executeListTeams(this: IExecuteFunctions): Promise<any> {
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

			const endpoint = `/accounts/${accountUuid}/teams?${params.toString()}`;
			const responseData = await apiRequest.call(this, 'GET', endpoint);
			returnData.push({ json: responseData });
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}

	return [returnData];
}

export class ListTeams implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'List Teams',
		name: 'listTeams',
		group: ['output'],
		version: 1,
		description: 'List all teams from a specific account in Poli API',
		defaults: {
			name: 'List Teams',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: listTeamsFields,
	};

	async execute(this: IExecuteFunctions) {
		return executeListTeams.call(this);
	}
}
