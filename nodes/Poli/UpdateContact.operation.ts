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

export const updateContactFields: INodeProperties[] = [
	{
		displayName: 'Contact UUID',
		name: 'contactUuid',
		type: 'string',
		required: true,
		default: '',
		description: 'UUID do contato para atualizar',
	},
	{
		displayName: 'Attributes',
		name: 'attributes',
		type: 'collection',
		placeholder: 'Add Attribute',
		default: {},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Nome do contato',
			},
			{
				displayName: 'Picture File UUID',
				name: 'pictureFileId',
				type: 'string',
				default: '',
				description: 'ID do arquivo da imagem de perfil',
			},
		],
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
					{ name: 'Attributes', value: 'attributes' },
					{ name: 'Status', value: 'status' },
					{ name: 'Tags', value: 'tags' },
					{ name: 'Channels', value: 'channels' },
					{ name: 'Metadata', value: 'metadata' },
				],
				default: ['attributes'],
				description: 'Dados adicionais para incluir na resposta',
			},
		],
	},
];

export async function executeUpdateContact(this: IExecuteFunctions): Promise<any> {
	const items = this.getInputData();
	const returnData = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const contactUuid = getParameterSafe(this, 'contactUuid', i, '', true) as string;
			const attributes = getParameterSafe(this, 'attributes', i, {}) as {
				name?: string;
				pictureFileId?: string;
			};
			const options = getParameterSafe(this, 'options', i, {}) as {
				include?: string[];
			};

			if (!contactUuid) {
				throw new NodeApiError(this.getNode(), {
					message: 'Contact UUID é obrigatório',
				} as JsonObject);
			}

			// Construir o body da requisição
			const body: any = {
				attributes: {}
			};

			// Adicionar nome se fornecido
			if (attributes.name) {
				body.attributes.name = attributes.name;
			}

			// Adicionar picture se fornecido
			if (attributes.pictureFileId) {
				body.attributes.picture = {
					file_id: attributes.pictureFileId
				};
			}

			// Construir query parameters
			const params = new URLSearchParams();
			
			// Include padrão é attributes se não especificado
			const includeValues = options.include && options.include.length > 0 
				? options.include 
				: ['attributes'];
			
			if (includeValues.length > 0) {
				params.append('include', includeValues.join(','));
			}

			const endpoint = `/contacts/${contactUuid}?${params.toString()}`;
			const responseData = await apiRequest.call(this, 'PUT', endpoint, body);
			returnData.push({ json: responseData });
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}

	return [returnData];
}

export class UpdateContact implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Update Contact',
		name: 'updateContact',
		group: ['output'],
		version: 1,
		description: 'Update a contact in Poli API',
		defaults: {
			name: 'Update Contact',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: updateContactFields,
	};

	async execute(this: IExecuteFunctions) {
		return executeUpdateContact.call(this);
	}
}
