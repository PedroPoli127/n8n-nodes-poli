import { IExecuteFunctions, INodeType, INodeTypeDescription, JsonObject, NodeApiError } from 'n8n-workflow';
import { apiRequest } from './transport';
import { getParameterSafe, getMultipleParametersSafe } from './utils/parameterUtils';

export class CreateContact implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Create Contact',
        name: 'createContact',
        icon: 'file:poli.svg',
        group: ['output'],
        version: 1,
        description: 'Create a new contact in Poli',
        defaults: { name: 'Create Contact' },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            { name: 'poliApi', required: true },
        ],
        properties: [
            { displayName: 'Account UUID', name: 'accountId', type: 'string', default: '', required: true },
            { displayName: 'Name', name: 'name', type: 'string', default: '', required: true },
            { displayName: 'Phone (com DDD)', name: 'phone', type: 'string', default: '', required: true },
            { displayName: 'E-mail', name: 'email', type: 'string', default: '' },
            { displayName: 'CPF/CNPJ', name: 'doc', type: 'string', default: '' },
            { displayName: 'Picture File UUID', name: 'pictureFileId', type: 'string', default: '', description: 'Opcional. file_id de um arquivo já enviado para usar como foto' },
            { displayName: 'Tag UUID', name: 'tagUuid', type: 'string', default: '', description: 'Opcional. Uma tag para associar ao contato' },
            { displayName: 'Contact Account UUID', name: 'companyUuid', type: 'string', default: '', description: 'Opcional. Empresa para relacionar com o contato. Enviada em companies[]. Troque para attributes.company_uuid se sua API exigir.' },

            // Addresses (já existente)
            {
                displayName: 'Addresses',
                name: 'addresses',
                type: 'fixedCollection',
                placeholder: 'Add Address',
                typeOptions: { multipleValues: true },
                default: {},
                options: [
                    {
                        name: 'address',
                        displayName: 'Address',
                        values: [
                            { displayName: 'Type', name: 'type', type: 'options', options: [
                                { name: 'Headquarter', value: 'Headquarter' },
                                { name: 'Billing', value: 'Billing' },
                                { name: 'Shipping', value: 'Shipping' },
                                { name: 'Other', value: 'Other' },
                            ], default: 'Headquarter' },
                            { displayName: 'Country Code', name: 'country_code', type: 'string', default: 'BRA' },
                            { displayName: 'Country', name: 'country', type: 'string', default: 'Brasil' },
                            { displayName: 'Postal Code (CEP)', name: 'postal_code', type: 'string', default: '' },
                            { displayName: 'State (UF)', name: 'state', type: 'string', default: '' },
                            { displayName: 'City', name: 'city', type: 'string', default: '' },
                            { displayName: 'Street', name: 'street', type: 'string', default: '' },
                            { displayName: 'Number', name: 'number', type: 'string', default: '' },
                            { displayName: 'Neighborhood', name: 'neighborhood', type: 'string', default: '' },
                            { displayName: 'Complement', name: 'complement', type: 'string', default: '' },
                        ],
                    },
                ],
            },

            // Novo campo Contact Channels
            {
                displayName: 'Contact Channels',
                name: 'contactChannels',
                type: 'fixedCollection',
                placeholder: 'Add Contact Channel',
                typeOptions: { multipleValues: true },
                default: {},
                description: 'Canais de contato para associar ao contato (WhatsApp, SMS, etc.)',
                options: [
                    {
                        name: 'channel',
                        displayName: 'Contact Channel',
                        values: [
                            {
                                displayName: 'Phone (com DDD)',
                                name: 'uid',
                                type: 'string',
                                default: '',
                                required: true,
                                description: 'Número de telefone que será usado como UID do canal',
                            },
                            {
                                displayName: 'Provider',
                                name: 'provider',
                                type: 'options',
                                options: [
                                    { name: 'WhatsApp', value: 'WHATSAPP' },
                                    { name: 'SMS', value: 'SMS' },
                                    { name: 'Voice', value: 'VOICE' },
                                ],
                                default: 'WHATSAPP',
                                description: 'Provedor do canal de comunicação',
                            },
                            {
                                displayName: 'Type',
                                name: 'type',
                                type: 'options',
                                options: [
                                    { name: 'Default', value: 'DEFAULT' },
                                    { name: 'Business', value: 'BUSINESS' },
                                ],
                                default: 'DEFAULT',
                                description: 'Tipo do canal',
                            },
                        ],
                    },
                ],
            },
        ],
    };

    async execute(this: IExecuteFunctions) {
        const items = this.getInputData();
        const returnData = [];

        for (let i = 0; i < items.length; i++) {
            try {
                // Obtenção segura de parâmetros obrigatórios
                const accountId = getParameterSafe(this, 'accountId', i, '', true);
                const name = getParameterSafe(this, 'name', i, '', true);
                const phone = getParameterSafe(this, 'phone', i, '', true);
                
                // Obtenção segura de parâmetros opcionais
                const email = getParameterSafe(this, 'email', i, '');
                const doc = getParameterSafe(this, 'doc', i, '');
                const pictureFileId = getParameterSafe(this, 'pictureFileId', i, '');
                const tagUuid = getParameterSafe(this, 'tagUuid', i, '');
                const companyUuid = getParameterSafe(this, 'companyUuid', i, '');

                // Obtenção segura de coleções complexas
                const addressesParam = getParameterSafe(this, 'addresses', i, {}) as { address?: Array<Record<string, string>> };
                const contactChannelsParam = getParameterSafe(this, 'contactChannels', i, {}) as { 
                    channel?: Array<{ uid: string; provider: string; type: string }> 
                };

                const body: any = {
                    type: 'PERSON',
                    attributes: {
                        name,
                        phone, // Preenche o primeiro campo de phone
                    },
                };

                // E-mail, doc e picture
                if (email) body.attributes.email = email;
                if (doc) body.attributes.doc = doc;
                if (pictureFileId) body.attributes.picture = { file_id: pictureFileId };
                if (tagUuid) body.tags = [{ uuid: tagUuid }];

                // Contact Channels
                if (contactChannelsParam.channel?.length) {
                    body.contact_channels = contactChannelsParam.channel.map(c => ({
                        uid: c.uid,
                        provider: c.provider || 'WHATSAPP',
                        type: c.type || 'DEFAULT',
                    }));

                    // Se há um canal definido, usa o primeiro uid como phone principal
                    if (contactChannelsParam.channel[0].uid) {
                        body.attributes.phone = contactChannelsParam.channel[0].uid;
                    }
                }

                // Empresa (relacionamento)
                if (companyUuid) {
                    body.companies = [{ uuid: companyUuid }];
                }

                // Endereços
                if (addressesParam?.address?.length) {
                    body.addresses = addressesParam.address.map(a => ({
                        type: a.type || 'Headquarter',
                        country_code: a.country_code || 'BRA',
                        country: a.country || 'Brasil',
                        postal_code: a.postal_code || '',
                        state: a.state || '',
                        city: a.city || '',
                        street: a.street || '',
                        number: a.number || '',
                        neighborhood: a.neighborhood || '',
                        complement: a.complement || '',
                    }));
                }

                const endpoint = `/accounts/${accountId}/contacts?include=*`;
                let responseData;

                try {
                    responseData = await apiRequest.call(this, 'POST', endpoint, body);
                } catch (error: any) {
                    const status = error?.statusCode || error?.response?.statusCode;
                    const message: string = error?.message || error?.response?.body?.message || error?.response?.body?.error || '';

                    if (status === 409 || status === 422 || /exists|duplicado|duplicate|already/i.test(message)) {
                        responseData = {
                            message: 'Contato já existe',
                            details: message || 'Registro duplicado',
                            phone,
                            email,
                            doc,
                        };
                    } else {
                        throw new NodeApiError(this.getNode(), error as JsonObject);
                    }
                }

                returnData.push({ json: responseData });
            } catch (error) {
                throw new NodeApiError(this.getNode(), error as JsonObject);
            }
        }

        return [returnData];
    }
}
