import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';
import { asMcpError, McpError } from './utils/toolHelpers.js';

export const method = 'createTask';
export const description = 'Create a calendar task (event, workout, etc.).';
export const parameters = z.object({
  taskType: z.enum(['E_Event', 'E_Workout', 'E_FreeRide']).describe('Type of task'),
  taskStartedTimeEpoc: z.number().describe('Start time as Unix timestamp'),
  taskTypeId: z.string().describe('ID of the event/workout'),
  curDayId: z.string().optional().describe('Day ID for multi-day events'),
  taskName: z.string().describe('Name of the task'),
  taskDescription: z.string().default('').describe('Description of the task'),
  totalKilometers: z.number().default(0).describe('Total distance in km'),
  totalElevation: z.number().default(0).describe('Total elevation in meters'),
  tss: z.number().default(0).describe('Training Stress Score'),
  sportMode: z.string().default('E_Cycling').describe('Sport mode'),
  mapId: z.number().default(0).describe('Map/World ID'),
  dayNo: z.number().default(0).describe('Day number for multi-day events'),
});

export async function handler(
  args: z.infer<typeof parameters>,
  extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    const result = await extra.client.post('/task/create', {
      baseUrl: 'SERVICE14',
      body: JSON.stringify({
        TaskId: '',
        TaskType: args.taskType,
        TaskStartedTimeEpoc: args.taskStartedTimeEpoc,
        TaskTypeId: args.taskTypeId,
        CurDayId: args.curDayId || '',
        TaskState: 'E_NotStarted',
        DayNo: args.dayNo,
        TaskEndEpochTime: args.taskStartedTimeEpoc,
        MapId: args.mapId,
        TaskName: args.taskName,
        TaskDescription: args.taskDescription,
        TotalKilometers: args.totalKilometers,
        TotalElevation: args.totalElevation,
        TSS: args.tss,
        SportMode: args.sportMode,
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
