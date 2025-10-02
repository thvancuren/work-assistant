import { Agent, tool, run } from "@openai/agents";
import { z } from "zod";
import dotenv from "dotenv";
import { createAsanaTool } from "./tools/asana";
import { createPlannerTool } from "./tools/msgraph";
import { TaskInput, TaskInputSchema } from "./tools/parsers";

// Load environment variables
dotenv.config();

// Lazy-loaded tool instances
let asanaTool: ReturnType<typeof createAsanaTool> | null = null;
let plannerTool: ReturnType<typeof createPlannerTool> | null = null;

function getAsanaTool() {
  if (!asanaTool) {
    asanaTool = createAsanaTool();
  }
  return asanaTool;
}

function getPlannerTool() {
  if (!plannerTool) {
    plannerTool = createPlannerTool();
  }
  return plannerTool;
}

export const asanaCreateTask = tool({
  name: "asana.createTask",
  description: "Create a task in Asana with optional due date, assignee, section, and attachments.",
  parameters: TaskInputSchema,
  strict: true,
  async execute(input: TaskInput) {
    try {
      const tool = getAsanaTool();
      const taskUrl = await tool.createAsanaTask(input);
      return JSON.stringify({ 
        success: true, 
        backend: "asana", 
        taskUrl,
        message: `Task "${input.title}" created successfully in Asana`
      });
    } catch (error) {
      return JSON.stringify({ 
        success: false, 
        backend: "asana", 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to create task "${input.title}" in Asana`
      });
    }
  },
});

export const plannerCreateTask = tool({
  name: "planner.createTask",
  description: "Create a task in Microsoft Planner with optional due date, assignee, bucket (section), and attachments.",
  parameters: TaskInputSchema,
  strict: true,
  async execute(input: TaskInput) {
    try {
      const tool = getPlannerTool();
      const taskUrl = await tool.createPlannerTask(input);
      return JSON.stringify({ 
        success: true, 
        backend: "planner", 
        taskUrl,
        message: `Task "${input.title}" created successfully in Planner`
      });
    } catch (error) {
      return JSON.stringify({ 
        success: false, 
        backend: "planner", 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to create task "${input.title}" in Planner`
      });
    }
  },
});

// Simple backend selector (env-driven)
function pickBackend(): "asana" | "planner" {
  const hasAsana = !!process.env.ASANA_TOKEN && !!process.env.ASANA_PROJECT;
  const hasPlanner = !!process.env.GRAPH_TOKEN && !!process.env.PLANNER_PLAN;
  
  if (hasAsana) return "asana";
  if (hasPlanner) return "planner";
  return "asana"; // default fallback
}

export const assistant = new Agent({
  name: "Work Intake Assistant",
  instructions: `
You are a personal AI assistant that helps create tasks in project management tools.

Your job is to:
1. Parse natural language task descriptions from emails or dictation
2. Extract structured information (title, description, due date, assignee, etc.)
3. Create tasks in either Asana or Microsoft Planner based on context or user preference
4. Always create tasks with clear titles and due dates when possible
5. Attach SharePoint links in notes if provided
6. Return the created task URL

Guidelines:
- Always validate input data using the provided schema
- If no platform is specified, use ${pickBackend()} as default
- Extract due dates from natural language (e.g., "next Friday", "tomorrow", "in 3 days")
- Clean up email signatures and quoted text from descriptions
- Map assignee names to appropriate user IDs
- Provide helpful error messages if task creation fails

When creating tasks:
- Use clear, actionable titles
- Set due dates whenever possible
- Include relevant context in descriptions
- Add links and attachments to task notes
- Return the task URL for user reference
  `,
  tools: [asanaCreateTask, plannerCreateTask],
});

// Convenience helper for webhook handlers
export async function handleTextToTask(text: string, platform?: "asana" | "planner") {
  try {
    const backend = platform || pickBackend();
    
    // Create a simple prompt for the agent
    const prompt = `Create a task from this description: "${text}"`;
    
    // Run the agent with the prompt using the run function
    const result = await run(assistant, prompt);

    // Extract task URL from the result
    let taskUrl: string | null = null;
    let success = false;
    let message = "Task processing completed";

    // Look for tool call results in the agent's output
    if (result.newItems) {
      for (const item of result.newItems) {
        if (item.type === "tool_call_output_item") {
          try {
            const toolResult = JSON.parse(item.output as string);
            if (toolResult?.taskUrl) {
              taskUrl = toolResult.taskUrl;
              success = toolResult.success || true;
              message = toolResult.message || message;
              break;
            }
          } catch (parseError) {
            console.warn('Failed to parse tool result:', parseError);
          }
        }
      }
    }

    return { 
      success, 
      backend, 
      taskUrl, 
      message,
      raw: result 
    };
  } catch (error) {
    console.error('Error in handleTextToTask:', error);
    return { 
      success: false, 
      backend: pickBackend(), 
      taskUrl: null, 
      message: `Error processing task: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
