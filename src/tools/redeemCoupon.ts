import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';
import { asMcpError, McpError } from './utils/toolHelpers.js';

export const method = 'redeemCoupon';
export const description = 'Redeem a coupon code for coins or gems.';
export const parameters = z.object({
  couponCode: z.string().describe('Coupon code to redeem'),
});

export async function handler(
  args: z.infer<typeof parameters>,
  extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    const whooshId = extra.client.getWhooshId();
    if (!whooshId) throw new McpError(-32600, 'Not authenticated');

    const result = await extra.client.post('/coupon/redeem', {
      body: JSON.stringify({
        CouponCode: args.couponCode,
        WhooshId: whooshId,
        ResponseString: '',
        TotalCoins: 0,
        TotalGems: 0,
        IsCouponRedeemSuccessfully: true,
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
