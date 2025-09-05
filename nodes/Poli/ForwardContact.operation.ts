import { IExecuteFunctions, INodeType, INodeTypeDescription, JsonObject, NodeApiError } from 'n8n-workflow';
import { apiRequest } from './transport';
import { getParameterSafe } from './utils/parameterUtils';

export class ForwardContact implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Forward Contact',
    name: 'forwardContact',
    icon: 'file:poli.svg',
    group: ['output'],
    version: 1,
    description: 'Forward a contact to a user or team',
    defaults: {
      name: 'Forward Contact',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'poliApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Contact UUID',
        name: 'contactUuid',
        type: 'string',
        default: '',
        description: 'UUID do contato que será encaminhado',
        required: true,
      },
      {
        displayName: 'Forward to',
        name: 'forwardType',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'User',
            value: 'user',
            description: 'Encaminhar para um usuário específico',
          },
          {
            name: 'Team',
            value: 'team',
            description: 'Encaminhar para uma equipe',
          },
        ],
        default: 'user',
        description: 'Escolha se deseja encaminhar o contato para um usuário ou uma equipe',
        required: true,
      },
      {
        displayName: 'User UUID',
        name: 'userUuid',
        type: 'string',
        default: '',
        description: 'UUID do usuário que receberá o contato encaminhado',
        displayOptions: {
          show: {
            forwardType: ['user'], // Mostra apenas se "user" for selecionado
          },
        },
        required: true,
      },
      {
        displayName: 'Team UUID',
        name: 'teamUuid',
        type: 'string',
        default: '',
        description: 'UUID da equipe que receberá o contato encaminhado',
        displayOptions: {
          show: {
            forwardType: ['team'], // Mostra apenas se "team" for selecionado
          },
        },
        required: true,
      },
    ],
  };

  async execute(this: IExecuteFunctions) {
    const items = this.getInputData();
    const returnData = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const contactUuid = getParameterSafe(this, 'contactUuid', i, '', true) as string;
        const forwardType = getParameterSafe(this, 'forwardType', i, '') as 'user' | 'team';

        // Validar se o UUID do contato não está vazio
        if (!contactUuid || contactUuid.trim() === '') {
          throw new NodeApiError(this.getNode(), {
            message: 'Contact UUID é obrigatório e não pode estar vazio',
          } as JsonObject);
        }

        const body: { user_uuid?: string; team_uuid?: string } = {};

        // Lógica de escolha exclusiva
        if (forwardType === 'user') {
          const userUuid = getParameterSafe(this, 'userUuid', i, '') as string;
          
          if (!userUuid || userUuid.trim() === '') {
            throw new NodeApiError(this.getNode(), {
              message: 'UUID do Usuário é obrigatório quando "Usuário" é selecionado',
            } as JsonObject);
          }
          
          body.user_uuid = userUuid;
        } else if (forwardType === 'team') {
          const teamUuid = getParameterSafe(this, 'teamUuid', i, '') as string;
          
          if (!teamUuid || teamUuid.trim() === '') {
            throw new NodeApiError(this.getNode(), {
              message: 'UUID da Equipe é obrigatório quando "Equipe" é selecionada',
            } as JsonObject);
          }
          
          body.team_uuid = teamUuid;
        } else {
          throw new NodeApiError(this.getNode(), {
            message: 'Tipo de encaminhamento inválido. Deve ser "user" ou "team"',
          } as JsonObject);
        }

        // Validação adicional para garantir que apenas um tipo foi definido
        if (body.user_uuid && body.team_uuid) {
          throw new NodeApiError(this.getNode(), {
            message: 'Erro interno: Não é possível encaminhar para usuário e equipe simultaneamente',
          } as JsonObject);
        }

        if (!body.user_uuid && !body.team_uuid) {
          throw new NodeApiError(this.getNode(), {
            message: 'Erro interno: Nenhum destinatário foi definido para o encaminhamento',
          } as JsonObject);
        }

        const endpoint = `/contacts/${contactUuid}/forward`;
        const responseData = await apiRequest.call(this, 'POST', endpoint, body);
        returnData.push({ json: responseData });
      } catch (error) {
        // Se já é um NodeApiError, apenas repassa
        if (error instanceof NodeApiError) {
          throw error;
        }
        
        // Para outros tipos de erro, cria um NodeApiError
        throw new NodeApiError(this.getNode(), error as JsonObject);
      }
    }

    return [returnData];
  }
}
