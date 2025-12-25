import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { BASE_URLS, USER_AGENT } from '../constants.js';
import { asMcpError, McpError } from './utils/toolHelpers.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';

export const method = 'getEnvironmentByAppVersion';
export const description = 'Get environment type (PROD/DEV) based on app version.';
export const parameters = z.object({
  appVersion: z.string().default('5.5.0').describe('App version (e.g., "5.5.0")'),
  platform: z.string().default('Android').describe('Platform (e.g., "Android")'),
  buildVersion: z.string().default('150').describe('Build version (e.g., "150")'),
});

export async function handler(
  args: z.infer<typeof parameters>,
  _extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    const query = new URLSearchParams({
      appVersion: args.appVersion,
      platform: args.platform,
      buildVersion: args.buildVersion,
    });

    const response = await fetch(`${BASE_URLS.PUBLIC}/http-service/v1/game/environment-by-app-version?${query}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const result = await response.json();
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (e) {
    if (e instanceof McpError) throw e;
    throw asMcpError(e);
  }
}
