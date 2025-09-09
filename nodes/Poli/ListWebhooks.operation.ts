import { IExecuteFunctions, INodeProperties, JsonObject, NodeApiError, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { apiRequest } from './transport';
import { getParameterSafe } from './utils/parameterUtils';
import { processApiResponseForN8n } from './utils/responseFilter'; // Ajuste o caminho do import se necessário

/**
 * Propriedades da UI para a operação 'List Webhooks'
 */
export const listWebhooksFields: INodeProperties[] = [
	{
		displayName: 'Application UUID',
		name: 'applicationId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the application to list webhooks from',
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
				description: 'Texto para busca de webhooks',
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
				default: 50,
			},
			{
				displayName: 'Include',
				name: 'include',
				type: 'multiOptions',
				options: [
					{ name: 'Status', value: 'status' },
					{ name: 'URL', value: 'url' },
					{ name: 'Subscriptions', value: 'subscriptions' },
					{ name: 'Application', value: 'application' },
					{ name: 'Metadata', value: 'metadata' },
                    // ...outras opções relevantes...
				],
				default: [],
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Raw query string (e.g. id=18&name=gabriel)',
			},
		],
	},
];

/**
 * Lógica de execução para a operação 'List Webhooks'
 */
export async function executeListWebhooks(this: IExecuteFunctions): Promise<any> {
	const items = this.getInputData();
	const returnData = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const applicationId = getParameterSafe(this, 'applicationId', i, '') as string;
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
			if (options.page) params.append('page', String(options.page));
			if (options.perPage) params.append('perPage', String(options.perPage));
			if (options.include?.length) params.append('include', options.include.join(','));

			if (options.query) {
				for (const part of options.query.split('&')) {
					const [key, value] = part.split('=');
					if (key && value) {
						params.append(key.trim(), value.trim());
					}
				}
			}

			const endpoint = `/applications/${applicationId}/webhooks?${params.toString()}`;
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

export class ListWebhooks implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'List Webhooks',
		name: 'listWebhooks',
		group: ['transform'],
		version: 1,
		description: 'List webhooks from Poli API',
		defaults: {
			name: 'List Webhooks',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: listWebhooksFields,
	};

	async execute(this: IExecuteFunctions) {
		return executeListWebhooks.call(this);
	}
}