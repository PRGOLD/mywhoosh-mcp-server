import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';
import { asMcpError, McpError } from './utils/toolHelpers.js';

export const method = 'updatePlayerData';
export const description = 'Update player profile data (equipment, settings, etc.).';
export const parameters = z.object({
  playerData: z.string().describe('Stringified JSON of player data structure'),
});

export async function handler(
  args: z.infer<typeof parameters>,
  extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    const whooshId = extra.client.getWhooshId();
    if (!whooshId) throw new McpError(-32600, 'Not authenticated');

    const result = await extra.client.put('/player/player-data', {
      body: JSON.stringify({
        PlayerData: args.playerData,
        WhooshId: whooshId,
        Action: 1051,
        CorrelationId: crypto.randomUUID(),
        DeviceId: 'mcp-server',
        Authorization: '',
      }),
    });

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (e) {
    if (e instanceof McpError) throw e;
    throw asMcpError(e);
  }
}
