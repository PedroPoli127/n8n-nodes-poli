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

export const getTeamFields: INodeProperties[] = [
	{
		displayName: 'Team UUID',
		name: 'teamUuid',
		type: 'string',
		required: true,
		default: '',
		description: 'UUID do time para obter informações',
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

export async function executeGetTeam(this: IExecuteFunctions): Promise<any> {
	const items = this.getInputData();
	const returnData = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const teamUuid = getParameterSafe(this, 'teamUuid', i, '') as string;
			const options = getParameterSafe(this, 'options', i, {}) as {
				include?: string[];
			};

			if (!teamUuid) {
				throw new NodeApiError(this.getNode(), {
					message: 'Team UUID é obrigatório',
				} as JsonObject);
			}

			const params = new URLSearchParams();

			if (options.include?.length) {
				params.append('include', options.include.join(','));
			}

			const queryString = params.toString();
			const endpoint = `/teams/${teamUuid}${queryString ? `?${queryString}` : ''}`;
			
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

export class GetTeam implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Get Team',
		name: 'getTeam',
		icon: 'file:poli.svg',
		group: ['output'],
		version: 1,
		description: 'Get specific team information from Poli API',
		defaults: {
			name: 'Get Team',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'poliApi',
				required: true,
			},
		],
		properties: getTeamFields,
	};

	async execute(this: IExecuteFunctions) {
		return executeGetTeam.call(this);
	}
}
