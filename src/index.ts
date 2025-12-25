#!/usr/bin/env node

import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpError, ErrorCode, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { z } from 'zod';
import { MyWhooshClient } from './clients/mywhoosh.js';
import { SERVER_NAME, APP_VERSION } from './constants.js';

dotenv.config();

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const suffix = context ? ` ${JSON.stringify(context)}` : '';
  console.error(`[${timestamp}] [${level.toUpperCase()}] ${message}${suffix}`);
}

interface ToolModule {
  method: string;
  description: string;
  parameters: z.ZodObject<any>;
  handler: (args: any, extra: { client: MyWhooshClient }) => Promise<CallToolResult>;
}

async function loadAllTools(): Promise<ToolModule[]> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const toolsDir = join(__dirname, 'tools');

  try {
    const files = await readdir(toolsDir);
    const toolFiles = files.filter((f) => f.endsWith('.js') && !f.includes('utils'));
    const tools: ToolModule[] = [];

    for (const file of toolFiles) {
      try {
        const toolPath = join(toolsDir, file);
        const isWindows = process.platform === 'win32';
        const toolModule = await import(isWindows ? `file://${toolPath}` : toolPath);

        if (toolModule.method && toolModule.description && toolModule.parameters && toolModule.handler) {
          tools.push(toolModule as ToolModule);
          log('info', `Loaded tool: ${toolModule.method}`);
        }
      } catch (error: any) {
        log('error', `Failed to load tool: ${file}`, { error: error.message });
      }
    }

    return tools;
  } catch (error: any) {
    log('error', 'Failed to read tools directory', { error: error.message });
    return [];
  }
}

async function run() {
  const tools = await loadAllTools();
  log('info', `Starting ${SERVER_NAME}@${APP_VERSION} with ${tools.length} tools`);

  const server = new McpServer({ name: SERVER_NAME, version: APP_VERSION });
  const client = new MyWhooshClient();

  // Check for pre-configured credentials
  const username = process.env.MYWHOOSH_USERNAME;
  const password = process.env.MYWHOOSH_PASSWORD;
  
  if (username && password) {
    try {
      await client.login(username, password, 'mcp-server');
      log('info', 'Auto-authenticated with environment credentials');
    } catch (e: any) {
      log('warn', 'Auto-login failed', { error: e.message });
    }
  }

  for (const tool of tools) {
    server.tool(tool.method, tool.description, tool.parameters.shape, async (args: Record<string, unknown>) => {
      log('info', `Tool invocation: ${tool.method}`);
      try {
        return await tool.handler(args, { client });
      } catch (error: any) {
        log('error', `Tool failed: ${tool.method}`, { error: error.message });
        if (error instanceof McpError) throw error;
        throw new McpError(ErrorCode.InternalError, error.message);
      }
    });
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('info', 'Server connected and ready');
}

run().catch((error) => {
  log('error', 'Server failed to start', { error: error.message });
  process.exit(1);
});
