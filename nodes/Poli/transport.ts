import type { IExecuteFunctions, IDataObject, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export async function apiRequest(
  this: IExecuteFunctions,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
): Promise<any> {
  const credentials = await this.getCredentials('poliApi');

  const options = {
    method,
    url: `https://foundation-api.poli.digital/v3${endpoint}`,
    headers: {
      Authorization: `Bearer ${credentials.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body,
    qs,
    json: true,
  };

  try {
    return await this.helpers.request!(options);
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject);
  }
}