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

export const getAccountChannelFields: INodeProperties[] = [
	{
		displayName: 'Account Channel UUID',
		name: 'accountChannelUuid',
		type: 'string',
		default: '',
		required: true,
		description: 'UUID do canal da conta',
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
					{ name: 'Config', value: 'config' },
				],
				default: [],
				description: 'Campos adicionais para incluir na resposta',
			},
		],
	},
];

export async function executeGetAccountChannel(this: IExecuteFunctions): Promise<any> {
	const items = this.getInputData();
	const returnData = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const accountChannelUuid = getParameterSafe(this, 'accountChannelUuid', i, '') as string;
			const options = getParameterSafe(this, 'options', i, {}) as {
				include?: string[];
			};

			const params = new URLSearchParams();

			if (options.include?.length) {
				params.append('include', options.include.join(','));
			}

			const queryString = params.toString();
			const endpoint = `/account-channels/${accountChannelUuid}${queryString ? `?${queryString}` : ''}`;

			const responseData = await apiRequest.call(this, 'GET', endpoint);
			returnData.push({ json: responseData });
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}

	return [returnData];
}

export class GetAccountChannel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Get Account Channel',
		name: 'getAccountChannel',
		group: ['output'],
		version: 1,
		description: 'Get account channel from Poli API',
		defaults: {
			name: 'Get Account Channel',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: getAccountChannelFields,
	};

	async execute(this: IExecuteFunctions): Promise<any> {
		return executeGetAccountChannel.call(this);
	}
}
