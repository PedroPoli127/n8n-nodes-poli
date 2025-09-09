/**
 * Utilitários para filtrar respostas da API, removendo informações desnecessárias
 * como URLs, metadados de paginação, etc.
 */

interface ApiResponse {
	data?: any;
	links?: any[];
	meta?: any;
	[key: string]: any;
}

/**
 * Remove campos desnecessários de uma resposta da API
 * @param response - Resposta da API
 * @param options - Opções de filtragem
 * @returns Resposta filtrada contendo apenas dados essenciais
 */
export function filterApiResponse(response: any, options: {
	removeUrls?: boolean;
	removePaginationMeta?: boolean;
	customFieldsToRemove?: string[];
	fieldsToKeep?: string[];
} = {}): any {
	if (!response) return response;

	const {
		removeUrls = true,
		removePaginationMeta = true,
		customFieldsToRemove = [],
		fieldsToKeep = []
	} = options;

	// Se é um array, processa cada item
	if (Array.isArray(response)) {
		return response.map(item => filterApiResponse(item, options));
	}

	// Se é um objeto, filtra os campos
	if (typeof response === 'object' && response !== null) {
		const filtered: any = {};

		// Lista de campos de paginação que devem ser removidos
		const paginationFields = [
			'links',
			'meta',
			'first_page_url',
			'last_page_url',
			'next_page_url',
			'prev_page_url',
			'path',
			'current_page',
			'from',
			'to',
			'per_page',
			'last_page'
		];

		// Lista de campos que contêm URLs
		const urlFields = [
			'url',
			'avatar_url',
			'webhook_url',
			'callback_url'
		];

		// Combina todos os campos a serem removidos
		const fieldsToRemove = [
			...(removePaginationMeta ? paginationFields : []),
			...(removeUrls ? urlFields : []),
			...customFieldsToRemove
		];

		for (const [key, value] of Object.entries(response)) {
			// Se há uma lista de campos para manter, só mantém esses
			if (fieldsToKeep.length > 0 && !fieldsToKeep.includes(key)) {
				continue;
			}

			// Remove campos específicos
			if (fieldsToRemove.includes(key)) {
				continue;
			}

			// Remove campos que terminam com _url (se removeUrls estiver ativo)
			if (removeUrls && key.endsWith('_url')) {
				continue;
			}

			// Processa recursivamente objetos aninhados
			if (typeof value === 'object' && value !== null) {
				filtered[key] = filterApiResponse(value, options);
			} else {
				filtered[key] = value;
			}
		}

		return filtered;
	}

	return response;
}

/**
 * Extrai apenas os dados principais de uma resposta paginada
 * @param response - Resposta da API com paginação
 * @param options - Opções de filtragem
 * @returns Array com apenas os dados, sem metadados de paginação
 */
export function extractDataOnly(response: ApiResponse, options?: {
	removeUrls?: boolean;
	removePaginationMeta?: boolean;
	customFieldsToRemove?: string[];
	fieldsToKeep?: string[];
}): any {
	// Se tem campo 'data', retorna apenas ele (filtrado)
	if (response && typeof response === 'object' && 'data' in response) {
		return filterApiResponse(response.data, options);
	}

	// Caso contrário, filtra a resposta completa
	return filterApiResponse(response, options);
}

/**
 * Processa a resposta para uso no n8n, aplicando os filtros necessários
 * @param response - Resposta da API
 * @param onlyData - Se deve extrair apenas o campo 'data'
 * @param filterOptions - Opções avançadas de filtragem
 * @returns Resposta processada para o n8n
 */
export function processApiResponseForN8n(
	response: any, 
	onlyData: boolean = true,
	filterOptions?: {
		removeUrls?: boolean;
		removePaginationMeta?: boolean;
		customFieldsToRemove?: string[];
		fieldsToKeep?: string[];
	}
): any {
	if (onlyData) {
		return extractDataOnly(response, filterOptions);
	}
	
	return filterApiResponse(response, filterOptions);
}
