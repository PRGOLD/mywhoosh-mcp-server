import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';
import { asMcpError, McpError } from './utils/toolHelpers.js';

export const method = 'login';
export const description = 'Authenticate with MyWhoosh and get access tokens. Required before using other endpoints.';
export const parameters = z.object({
  username: z.string().describe('MyWhoosh account email'),
  password: z.string().describe('MyWhoosh account password'),
  deviceId: z.string().optional().describe('Device identifier (optional, will be generated if not provided)'),
});

export async function handler(
  args: z.infer<typeof parameters>,
  extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    const deviceId = args.deviceId || crypto.randomUUID();
    const tokens = await extra.client.login(args.username, args.password, deviceId);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          whooshId: tokens.whooshId,
          message: 'Successfully authenticated with MyWhoosh',
        }, null, 2),
      }],
    };
  } catch (e) {
    if (e instanceof McpError) throw e;
    throw asMcpError(e);
  }
}
