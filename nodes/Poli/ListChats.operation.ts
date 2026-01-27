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

export const listChatsFields: INodeProperties[] = [
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
                displayName: 'Query',
                name: 'query',
                type: 'string',
                default: '',
                description: 'Raw query string (ex: id=18&name=gabriel)',
            },
            {
                displayName: 'Page',
                name: 'page',
                type: 'number',
                default: 1,
                typeOptions: { minValue: 1 },
                description: 'Número da página',
            },
            {
                displayName: 'Per Page',
                name: 'perPage',
                type: 'number',
                default: 20,
                typeOptions: { minValue: 1, maxValue: 100 },
                description: 'Itens por página',
            },
            {
                displayName: 'Include',
                name: 'include',
                type: 'multiOptions',
                options: [
                    { name: 'Read Status', value: 'read_status' },
                    { name: 'Chat Status', value: 'chat_status' },
                    { name: 'Attendant', value: 'attendant' },
                    { name: 'Attributes', value: 'attributes' },
                ],
                default: ['read_status', 'chat_status', 'attendant'],
                description: 'Campos adicionais para incluir na resposta',
            },
            {
                displayName: 'Filters',
                name: 'filters',
                type: 'collection',
                placeholder: 'Add Filter',
                default: {},
                options: [
                    {
                        displayName: 'Tags',
                        name: 'tags',
                        type: 'string',
                        default: '',
                        description: 'Filtrar por tags (separadas por vírgula)',
                    },
                    {
                        displayName: 'Users',
                        name: 'users',
                        type: 'string',
                        default: '',
                        description: 'Filtrar por usuários (IDs separados por vírgula)',
                    },
                    {
                        displayName: 'Teams',
                        name: 'teams',
                        type: 'string',
                        default: '',
                        description: 'Filtrar por times (IDs separados por vírgula)',
                    },
                    {
                        displayName: 'Started At (From)',
                        name: 'startedAtFrom',
                        type: 'dateTime',
                        default: '',
                        description: 'Data de início (de) - formato: YYYY-MM-DD HH:mm',
                    },
                    {
                        displayName: 'Started At (To)',
                        name: 'startedAtTo',
                        type: 'dateTime',
                        default: '',
                        description: 'Data de início (até) - formato: YYYY-MM-DD HH:mm',
                    },
                ],
            },
        ],
    },
];

export async function executeListChats(this: IExecuteFunctions): Promise<any> {
    const items = this.getInputData();
    const returnData: any[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            const accountId = getParameterSafe(this, 'accountId', i, '', true);
            const options = getParameterSafe(this, 'options', i, {}) as {
                search?: string;
                page?: number;
                perPage?: number;
                include?: string[];
                query?: string;
                filters?: {
                    tags?: string;
                    users?: string;
                    teams?: string;
                    startedAtFrom?: string;
                    startedAtTo?: string;
                };
            };

            const params = new URLSearchParams();

            if (options.search) params.append('search', options.search);
            if (options.page) params.append('page', options.page.toString());
            if (options.perPage) params.append('perPage', options.perPage.toString());
            if (options.include?.length) params.append('include', options.include.join(','));

            // Implementar filtros conforme a especificação da API
            if (options.filters) {
                const filterParts: string[] = [];
                
                if (options.filters.tags) {
                    const tags = options.filters.tags.split(',').map(tag => tag.trim());
                    filterParts.push(`tags=([${tags.join(',')}])`);
                }
                
                if (options.filters.users) {
                    const users = options.filters.users.split(',').map(user => user.trim());
                    filterParts.push(`users=(${users.join(',')})`);
                }
                
                if (options.filters.teams) {
                    const teams = options.filters.teams.split(',').map(team => team.trim());
                    filterParts.push(`teams=(${teams.join(',')})`);
                }
                
                if (options.filters.startedAtFrom || options.filters.startedAtTo) {
                    const dateFilters: string[] = [];
                    if (options.filters.startedAtFrom) {
                        dateFilters.push(`gt=${options.filters.startedAtFrom}`);
                    }
                    if (options.filters.startedAtTo) {
                        dateFilters.push(`lt=${options.filters.startedAtTo}`);
                    }
                    if (dateFilters.length > 0) {
                        filterParts.push(`started_at=([${dateFilters.join(',')}])`);
                    }
                }
                
                if (filterParts.length > 0) {
                    params.append('filters', `(${filterParts.join(',')})`);
                }
            }

            if (options.query) {
                for (const part of options.query.split('&')) {
                    const [key, value] = part.split('=');
                    if (key && value) {
                        params.append(key.trim(), value.trim());
                    }
                }
            }

            const endpoint = `/accounts/${accountId}/chats?${params.toString()}`;
            const responseData = await apiRequest.call(this, 'GET', endpoint);

            const filteredData = processApiResponseForN8n(responseData, true);
            returnData.push({ json: filteredData });
        } catch (error) {
            throw new NodeApiError(this.getNode(), error as JsonObject);
        }
    }

    return [returnData];
}

export class ListChats implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'List Chats',
        name: 'listChats',
        group: ['transform'],
        version: 1,
        description: 'List chats from Poli API',
        defaults: { name: 'List Chats' },
        inputs: ['main'],
        outputs: ['main'],
        properties: listChatsFields,
    };

    async execute(this: IExecuteFunctions) {
        return executeListChats.call(this);
    }
}
