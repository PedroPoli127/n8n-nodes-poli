import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	NodeApiError,
	INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from './transport';
import { processApiResponseForN8n } from './utils/responseFilter';

export const getMeFields: INodeProperties[] = [
	// GetMe não requer parâmetros adicionais, pois retorna informações do usuário autenticado
];

export async function executeGetMe(this: IExecuteFunctions): Promise<any> {
	const items = this.getInputData();
	const returnData = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const endpoint = '/auth/get-me';
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

export class GetMe implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Get Me',
		name: 'getMe',
		group: ['output'],
		version: 1,
		description: 'Get authenticated user information from Poli API',
		defaults: {
			name: 'Get Me',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: getMeFields,
	};

	async execute(this: IExecuteFunctions) {
		return executeGetMe.call(this);
	}
}
