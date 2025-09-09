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

export const getUserFields: INodeProperties[] = [
	{
		displayName: 'User UUID',
		name: 'userUuid',
		type: 'string',
		required: true,
		default: '',
		description: 'UUID do usuário para obter informações',
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

export async function executeGetUser(this: IExecuteFunctions): Promise<any> {
	const items = this.getInputData();
	const returnData = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const userUuid = getParameterSafe(this, 'userUuid', i, '') as string;
			const options = getParameterSafe(this, 'options', i, {}) as {
				include?: string[];
			};

			if (!userUuid) {
				throw new NodeApiError(this.getNode(), {
					message: 'User UUID é obrigatório',
				} as JsonObject);
			}

			const params = new URLSearchParams();

			if (options.include?.length) {
				params.append('include', options.include.join(','));
			}

			const queryString = params.toString();
			const endpoint = `/users/${userUuid}${queryString ? `?${queryString}` : ''}`;
			
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

export class GetUser implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Get User',
		name: 'getUser',
		group: ['output'],
		version: 1,
		description: 'Get specific user information from Poli API',
		defaults: {
			name: 'Get User',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: getUserFields,
	};

	async execute(this: IExecuteFunctions) {
		return executeGetUser.call(this);
	}
}
