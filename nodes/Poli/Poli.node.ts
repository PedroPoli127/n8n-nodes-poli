import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	INodeProperties,
} from 'n8n-workflow';

import { getParameterSafe } from './utils/parameterUtils';

// Importações dos nodes existentes
import { ListContacts } from './ListContacts.operation';
import { CreateContact } from './CreateContact.operation';
import { UpdateContact } from './UpdateContact.operation';
import { AddTagToContact } from './AddTagToContact.operation';
import { ForwardContact } from './ForwardContact.operation';

import { ListApps } from './ListApps.operation';
import { CreateApp } from './CreateApp.operation';
import { GetMe } from './GetMe.operation'; // será usado como Get App Data

import { ListAccounts } from './ListAccounts.operation';

import { ListChannels } from './ListChannels.operation';
import { GetChannel } from './GetChannel.operation';
import { ListChats } from './ListChats.operation';

import { SendMessageByContactId } from './SendMessageByContactId.operation';
import { SendMessageByPhoneNumber } from './SendMessageByPhoneNumber.operation';
import { ListMessagesFromContact } from './ListMessagesFromContact.operation';

import { ListTemplates } from './ListTemplates.operation';
import { SendTemplateByContactId } from './SendTemplateByContactId.node';
import { SendTemplateByPhoneNumber } from './SendTemplateByPhoneNumber.operation';

import { ListTags } from './ListTags.operation';
import { CreateTag } from './CreateTag.operation';

import { ListUsers } from './ListUsers.operation';
import { GetUser } from './GetUser.operation';

import { ListTeams } from './ListTeams.operation';
import { GetTeam } from './GetTeam.operation';

import { ListWebhooks } from './ListWebhooks.operation';
import { CreateWebhook } from './CreateWebhook.operation';

export class Poli implements INodeType {
	description: INodeTypeDescription;

	constructor() {
		const nodes = {
			app: {
				list: new ListApps(),
				create: new CreateApp(),
				getData: new GetMe(), // Get App Data
			},
			account: {
				list: new ListAccounts(),
			},
			channel: {
				list: new ListChannels(),
				get: new GetChannel(),
			},
			chat: {
				list: new ListChats(),
			},
			message: {
				sendByContactId: new SendMessageByContactId(),
				sendByPhone: new SendMessageByPhoneNumber(),
			},
			template: {
				list: new ListTemplates(),
				sendByContactId: new SendTemplateByContactId(),
				sendByPhone: new SendTemplateByPhoneNumber(),
			},
			contact: {
				list: new ListContacts(),
				create: new CreateContact(),
				update: new UpdateContact(),
				addTag: new AddTagToContact(),
				forward: new ForwardContact(),
				listMessages: new ListMessagesFromContact(),
			},
			tag: {
				list: new ListTags(),
				create: new CreateTag(),
			},
			user: {
				list: new ListUsers(),
				get: new GetUser(),
			},
			team: {
				list: new ListTeams(),
				get: new GetTeam(),
			},
			webhook: {
				list: new ListWebhooks(),
				create: new CreateWebhook(),
			},
		};

		const collectProperties = (): INodeProperties[] => {
			const baseProperties: INodeProperties[] = [
				{
					displayName: 'Resource',
					name: 'resource',
					type: 'options',
					noDataExpression: true,
					options: [
						{ name: 'App', value: 'app' },
						{ name: 'Account', value: 'account' },
						{ name: 'Channel', value: 'channel' },
						{ name: 'Message', value: 'message' },
						{ name: 'Template', value: 'template' },
						{ name: 'Contact', value: 'contact' },
						{ name: 'Chat', value: 'chat' },
						{ name: 'Tag', value: 'tag' },
						{ name: 'User', value: 'user' },
						{ name: 'Team', value: 'team' },
						{ name: 'Webhook', value: 'webhook' },
					],
					default: 'contact',
				},
				// APP ACTIONS
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: { show: { resource: ['app'] } },
					options: [
						{ name: 'List Apps', value: 'list', action: 'List Apps' },
						{ name: 'Create App', value: 'create', action: 'Create App' },
						{ name: 'Get App Data', value: 'getData', action: 'Get App Data' },
					],
					default: 'list',
				},
				// ACCOUNT ACTIONS
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: { show: { resource: ['account'] } },
					options: [{ name: 'List Accounts', value: 'list', action: 'List Accounts' }],
					default: 'list',
				},
				// CHANNEL ACTIONS
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: { show: { resource: ['channel'] } },
					options: [
						{ name: 'List Channels', value: 'list', action: 'List Channels' },
						{ name: 'Get Channel', value: 'get', action: 'Get Channel' },
					],
					default: 'list',
				},
				// MESSAGE ACTIONS
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: { show: { resource: ['message'] } },
					options: [
						{ name: 'Send Message By Contact ID', value: 'sendByContactId', action: 'Send Message By Contact ID' },
						{ name: 'Send Message By Phone', value: 'sendByPhone', action: 'Send Message By Phone' },
					],
					default: 'sendByContactId',
				},
				// TEMPLATE ACTIONS
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: { show: { resource: ['template'] } },
					options: [
						{ name: 'List Templates', value: 'list', action: 'List Templates' },
						{ name: 'Send Template Message By Contact ID', value: 'sendByContactId', action: 'Send Template Message By Contact ID' },
						{ name: 'Send Template Message By Phone Number', value: 'sendByPhone', action: 'Send Template Message By Phone Number' },
					],
					default: 'list',
				},
				// CONTACT ACTIONS
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: { show: { resource: ['contact'] } },
					options: [
						{ name: 'List and Search Contacts', value: 'list', action: 'List and Search Contacts' },
						{ name: 'Create Contact', value: 'create', action: 'Create Contact' },
						{ name: 'Update Contact', value: 'update', action: 'Update Contact' },
						{ name: 'Add Tag to Contact', value: 'addTag', action: 'Add Tag to Contact' },
						{ name: 'Forward Contact', value: 'forward', action: 'Forward Contact' },
						{ name: 'List Messages from Contact ID', value: 'listMessages', action: 'List Messages from Contact ID' },
					],
					default: 'list',
				},
				// CHAT ACTIONS
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: { show: { resource: ['chat'] } },
					options: [
						{ name: 'List Chats', value: 'list', action: 'List Chats' },
					],
					default: 'list',
				},
				// TAG ACTIONS
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: { show: { resource: ['tag'] } },
					options: [
						{ name: 'List Tags', value: 'list', action: 'List Tags' },
						{ name: 'Create Tags', value: 'create', action: 'Create Tags' },
					],
					default: 'list',
				},
				// USER ACTIONS
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: { show: { resource: ['user'] } },
					options: [
						{ name: 'List and Search Users', value: 'list', action: 'List and Search Users' },
						{ name: 'Get User', value: 'get', action: 'Get User' },
					],
					default: 'list',
				},
				// TEAM ACTIONS
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: { show: { resource: ['team'] } },
					options: [
						{ name: 'List Teams', value: 'list', action: 'List Teams' },
						{ name: 'Get Team', value: 'get', action: 'Get Team' },
					],
					default: 'list',
				},
				// WEBHOOK ACTIONS
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: { show: { resource: ['webhook'] } },
					options: [
						{ name: 'List Webhooks', value: 'list', action: 'List Webhooks' },
						{ name: 'Create Webhook', value: 'create', action: 'Create Webhook' },
					],
					default: 'list',
				},
			];

			const allProperties: INodeProperties[] = [...baseProperties];

			Object.entries(nodes).forEach(([resource, operations]) => {
				Object.entries(operations).forEach(([operation, nodeInstance]) => {
					const nodeProperties = nodeInstance.description?.properties || [];

					const specificProperties = nodeProperties.filter(
						(prop) => prop.name !== 'resource' && prop.name !== 'operation',
					);

					specificProperties.forEach((prop) => {
						const modifiedProp: INodeProperties = {
							...prop,
							displayOptions: {
								show: {
									resource: [resource],
									operation: [operation],
									...(prop.displayOptions?.show || {}),
								},
							},
						};
						allProperties.push(modifiedProp);
					});
				});
			});

			return allProperties;
		};

		this.description = {
			displayName: 'Poli',
			name: 'poli',
			icon: 'file:poli.svg',
			group: ['output'],
			version: 1,
			description: 'Node principal para interagir com a API da Poli',
			defaults: { name: 'Poli' },
			inputs: ['main'],
			outputs: ['main'],
			credentials: [{ name: 'poliApi', required: true }],
			properties: collectProperties(),
		};
	}

	async execute(this: IExecuteFunctions) {
		// Obtenção segura dos parâmetros principais com fallbacks
		let resource: string;
		let operation: string;

		try {
			resource = getParameterSafe(this, 'resource', 0, 'contact') as string;
		} catch (error) {
			console.warn('⚠️ Parâmetro "resource" não encontrado, usando fallback: "contact"');
			resource = 'contact';
		}

		try {
			operation = getParameterSafe(this, 'operation', 0, 'list') as string;
		} catch (error) {
			console.warn(`⚠️ Parâmetro "operation" não encontrado para resource "${resource}", usando fallback baseado no resource`);
			// Define operação padrão baseada no resource
			const defaultOperations: Record<string, string> = {
				app: 'list',
				account: 'list',
				channel: 'list',
				message: 'sendByContactId',
				template: 'list',
				contact: 'list',
				tag: 'list',
				user: 'list',
				team: 'list',
				webhook: 'list',
			};
			operation = defaultOperations[resource] || 'list';
		}

		// Validação dos parâmetros obtidos
		if (!resource || typeof resource !== 'string') {
			throw new Error('❌ Parâmetro "resource" é obrigatório e deve ser uma string válida');
		}

		if (!operation || typeof operation !== 'string') {
			throw new Error('❌ Parâmetro "operation" é obrigatório e deve ser uma string válida');
		}

		const nodeMap: Record<string, Record<string, any>> = {
			app: {
				list: new ListApps(),
				create: new CreateApp(),
				getData: new GetMe(), // Get App Data
			},
			account: {
				list: new ListAccounts(),
			},
			channel: {
				list: new ListChannels(),
				get: new GetChannel(),
			},
			message: {
				sendByContactId: new SendMessageByContactId(),
				sendByPhone: new SendMessageByPhoneNumber(),
			},
			template: {
				list: new ListTemplates(),
				sendByContactId: new SendTemplateByContactId(),
				sendByPhone: new SendTemplateByPhoneNumber(),
			},
			contact: {
				list: new ListContacts(),
				create: new CreateContact(),
				update: new UpdateContact(),
				addTag: new AddTagToContact(),
				forward: new ForwardContact(),
				listMessages: new ListMessagesFromContact(),
			},
			tag: {
				list: new ListTags(),
				create: new CreateTag(),
			},
			user: {
				list: new ListUsers(),
				get: new GetUser(),
			},
			team: {
				list: new ListTeams(),
				get: new GetTeam(),
			},
			webhook: {
				list: new ListWebhooks(),
				create: new CreateWebhook(),
			},
		};

		// Validação do resource
		const resourceNodes = nodeMap[resource];
		if (!resourceNodes) {
			const availableResources = Object.keys(nodeMap).join(', ');
			throw new Error(`❌ Resource '${resource}' não encontrado. Resources disponíveis: ${availableResources}`);
		}

		// Validação da operation
		const targetNode = resourceNodes[operation];
		if (!targetNode) {
			const availableOperations = Object.keys(resourceNodes).join(', ');
			throw new Error(`❌ Operação '${operation}' não encontrada para o resource '${resource}'. Operações disponíveis: ${availableOperations}`);
		}

		console.log(`✅ Executando: resource="${resource}", operation="${operation}"`);

		// Execução com tratamento de erro
		try {
			return await targetNode.execute.call(this);
		} catch (error: any) {
			console.error(`❌ Erro na execução de ${resource}.${operation}:`, error);
			throw new Error(`Erro na execução de ${resource}.${operation}: ${error.message || error}`);
		}
	}
}
