import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';
import { asMcpError, McpError } from './utils/toolHelpers.js';

export const method = 'getDateRangeTaskList';
export const description = 'Get calendar tasks within a date range.';
export const parameters = z.object({
  startDate: z.number().describe('Start date as Unix timestamp'),
  endDate: z.number().describe('End date as Unix timestamp'),
});

export async function handler(
  args: z.infer<typeof parameters>,
  extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    const query = new URLSearchParams({
      startDate: args.startDate.toString(),
      endDate: args.endDate.toString(),
    });

    const result = await extra.client.get(`/task/date-range-task-list?${query}`, { baseUrl: 'SERVICE14' });
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (e) {
    if (e instanceof McpError) throw e;
    throw asMcpError(e);
  }
}
