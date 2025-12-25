import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { BASE_URLS, USER_AGENT } from '../constants.js';
import { asMcpError, McpError } from './utils/toolHelpers.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';

export const method = 'registerUser';
export const description = 'Register a new MyWhoosh user account.';
export const parameters = z.object({
  firstName: z.string().describe('First name'),
  lastName: z.string().describe('Last name'),
  email: z.string().email().describe('Email address'),
  password: z.string().describe('Password'),
  dobDay: z.number().min(1).max(31).describe('Day of birth (1-31)'),
  dobMonth: z.number().min(1).max(12).describe('Month of birth (1-12)'),
  dobYear: z.number().describe('Year of birth'),
  country: z.number().default(0).describe('Country code'),
  height: z.number().describe('Height in cm'),
  weight: z.number().describe('Weight in kg'),
  gender: z.number().min(0).max(1).describe('Gender (0 = Male, 1 = Female)'),
  ftp: z.number().default(160).describe('Functional Threshold Power in watts'),
  allowMarketingEmails: z.boolean().default(false).describe('Allow marketing emails'),
});

export async function handler(
  args: z.infer<typeof parameters>,
  _extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    const response = await fetch(`${BASE_URLS.PUBLIC}/http-service/v1/player/register-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
      body: JSON.stringify({
        UserFirstName: args.firstName,
        UserLastName: args.lastName,
        Email: args.email,
        Username: args.email,
        Password: args.password,
        DobDayId: args.dobDay,
        DobMonthId: args.dobMonth,
        DobYearId: args.dobYear,
        Country: args.country,
        Height: args.height,
        Weight: args.weight,
        Gender: args.gender,
        FtpPlayer: args.ftp,
        IsAllowedToSendMarketingEmails: args.allowMarketingEmails,
        Action: 1050,
        CorrelationId: crypto.randomUUID(),
        DeviceId: crypto.randomUUID(),
        Authorization: '',
      }),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.status}`);
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
