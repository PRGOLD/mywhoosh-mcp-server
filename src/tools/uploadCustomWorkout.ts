import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';
import { asMcpError, McpError } from './utils/toolHelpers.js';

const workoutStepSchema = z.object({
  Id: z.number(),
  Pace: z.number().default(1),
  IntervalId: z.number().default(0),
  WorkoutMessage: z.array(z.object({
    Id: z.number(),
    Time: z.number(),
    Message: z.string(),
  })).default([]),
  Rpm: z.number().default(0),
  StepType: z.enum(['E_Normal', 'E_WarmUp', 'E_CoolDown', 'E_FreeRide']),
  Power: z.number(),
  StartPower: z.number().default(0),
  EndPower: z.number().default(0),
  Time: z.number(),
  IsManualGrade: z.boolean().default(false),
  ManualGradeValue: z.number().default(0),
  ShowAveragePower: z.boolean().default(false),
  FlatRoad: z.number().default(0),
});

const workoutSchema = z.object({
  Id: z.string().describe('Unique workout ID'),
  Name: z.string(),
  Description: z.string().default(''),
  Mode: z.string().default('E_Ride'),
  ERGMode: z.string().default('E_OFF'),
  IsRecovery: z.boolean().default(false),
  IsIntervals: z.boolean().default(false),
  FTPMode: z.string().default('E_NoFTP'),
  IsTT: z.boolean().default(false),
  IsTSS: z.boolean().default(false),
  IsIF: z.boolean().default(false),
  FTPMultiplier: z.number().default(0),
  StressPoint: z.number().default(0),
  Time: z.number().describe('Total workout time in seconds'),
  CustomTagDescription: z.string().default(''),
  CategoryId: z.number().default(1),
  SubcategoryId: z.number().default(0),
  Type: z.string().default('E_Custom'),
  DisplayType: z.string().default('E_byWatts'),
  StepCount: z.number(),
  IsFavorite: z.boolean().default(false),
  CompletedCount: z.number().default(0),
  WorkoutStepsArray: z.array(workoutStepSchema),
  AuthorName: z.string().default(''),
  TSS: z.number().default(0),
  IF: z.number().default(0),
  KJ: z.number().default(0),
  IsVODAvailable: z.boolean().default(false),
});

export const method = 'uploadCustomWorkout';
export const description = 'Upload custom workouts to MyWhoosh.';
export const parameters = z.object({
  workouts: z.array(workoutSchema).describe('Array of workout definitions'),
});

export async function handler(
  args: z.infer<typeof parameters>,
  extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    const whooshId = extra.client.getWhooshId();
    if (!whooshId) throw new McpError(-32600, 'Not authenticated');

    const result = await extra.client.post('/client/custom-workout-upload', {
      baseUrl: 'COACHING',
      body: JSON.stringify({
        UserId: whooshId,
        WorkoutsData: args.workouts,
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
