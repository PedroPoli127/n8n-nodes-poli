import { IExecuteFunctions, INodeType, INodeTypeDescription, JsonObject, NodeApiError, INodeProperties } from 'n8n-workflow';
import { apiRequest } from './transport';
import { getParameterSafe } from './utils/parameterUtils';
import { processApiResponseForN8n } from './utils/responseFilter';

export const listTemplatesFields: INodeProperties[] = [
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
				description: 'Número da página',
			},
			{
				displayName: 'Per Page',
				name: 'perPage',
				type: 'number',
				default: 50,
				description: 'Itens por página',
			},
			{
				displayName: 'Include',
				name: 'include',
				type: 'multiOptions',
				options: [
					{ name: 'Key', value: 'key' },
					{ name: 'Version', value: 'version' },
					{ name: 'Status', value: 'status' },
					{ name: 'Message', value: 'message' },
					{ name: 'Team', value: 'team' },
					{ name: 'Metadata', value: 'metadata' },
				],
				default: [],
				description: 'Campos adicionais para incluir na resposta',
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Raw query string (ex: id=18&name=gabriel)',
			},
		],
	},
];

export async function executeListTemplates(this: IExecuteFunctions): Promise<any> {
	const items = this.getInputData();
	const returnData = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const accountId = getParameterSafe(this, 'accountId', i, '', true) as string;
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

			const endpoint = `/accounts/${accountId}/templates?${params.toString()}`;
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

export class ListTemplates implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'List Templates',
		name: 'listTemplates',
		group: ['output'],
		version: 1,
		description: 'List all templates from Poli API',
		defaults: {
			name: 'List Templates',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: listTemplatesFields,
	};

	async execute(this: IExecuteFunctions) {
		return executeListTemplates.call(this);
	}
}
