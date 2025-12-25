import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';
import { asMcpError, McpError } from './utils/toolHelpers.js';

export const method = 'createTask';
export const description = `Create a calendar task to schedule events, workouts, or free rides.

TASK TYPES:
- E_Event: Schedule a group event (use event UUID as taskTypeId)
- E_Simple_Workout: Schedule any workout (custom or standard, use workout ID as taskTypeId)
- E_FreeRide: Schedule a free ride session

SCHEDULING WORKOUTS:
- Use TaskType: "E_Simple_Workout" (for both custom and standard workouts)
- Set TaskTypeId to the workout ID (from uploadCustomWorkout or standard workout ID)
- TaskStartedTimeEpoc: Unix timestamp when workout should start
- TaskEndEpochTime: Unix timestamp when workout should end (start + duration)
- Include workout details like Name, Description, TSS

EXAMPLE - Schedule Workout:
{
  "taskType": "E_Simple_Workout",
  "taskStartedTimeEpoc": 1735200000,
  "taskTypeId": "176540733485",
  "taskName": "Interval Power Builder",
  "taskDescription": "Intensive interval training",
  "tss": 65
}`;

export const parameters = z.object({
  taskType: z.enum(['E_Event', 'E_Simple_Workout', 'E_FreeRide']).describe('Type of task: E_Event (group event), E_Simple_Workout (any workout - custom or standard), E_FreeRide (free ride)'),
  taskStartedTimeEpoc: z.number().describe('Start time as Unix timestamp (seconds since 1970-01-01)'),
  taskTypeId: z.string().describe('ID of the event/workout. For workouts: use the workout Id. For events: use event UUID.'),
  taskEndEpochTime: z.number().optional().describe('End time as Unix timestamp. If not provided, defaults to start time. For workouts: start time + workout duration.'),
  curDayId: z.string().optional().describe('Day ID for multi-day events (leave empty for single tasks)'),
  taskName: z.string().describe('Name of the task/workout'),
  taskDescription: z.string().default('').describe('Description of the task'),
  totalKilometers: z.number().default(0).describe('Total distance in km (0 for workouts)'),
  totalElevation: z.number().default(0).describe('Total elevation in meters (0 for workouts)'),
  tss: z.number().default(0).describe('Training Stress Score'),
  sportMode: z.string().default('E_Cycling').describe('Sport mode (E_Cycling for cycling)'),
  mapId: z.number().default(0).describe('Map/World ID (0 for workouts)'),
  dayNo: z.number().default(0).describe('Day number for multi-day events (0 for single tasks)'),
});

export async function handler(
  args: z.infer<typeof parameters>,
  extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    const endTime = args.taskEndEpochTime || args.taskStartedTimeEpoc;
    
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
        TaskEndEpochTime: endTime,
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
