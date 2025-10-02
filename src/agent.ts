import { Agent } from '@openai/agents';
import { createAsanaTool } from './tools/asana';
import { createPlannerTool } from './tools/msgraph';
import { parseTaskInput, TaskInput, TaskInputSchema } from './tools/parsers';

interface AgentConfig {
  openaiApiKey: string;
  defaultPlatform?: 'asana' | 'planner';
}

export class WorkAssistantAgent {
  private agent: Agent;
  private asanaTool: ReturnType<typeof createAsanaTool>;
  private plannerTool: ReturnType<typeof createPlannerTool>;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    
    // Initialize tools
    this.asanaTool = createAsanaTool();
    this.plannerTool = createPlannerTool();

    // Initialize OpenAI agent
    this.agent = new Agent({
      apiKey: config.openaiApiKey,
      model: 'gpt-4',
      tools: [
        {
          name: 'asana.createTask',
          description: 'Create a new task in Asana',
          parameters: TaskInputSchema,
          handler: this.createAsanaTask.bind(this),
        },
        {
          name: 'planner.createTask',
          description: 'Create a new task in Microsoft Planner',
          parameters: TaskInputSchema,
          handler: this.createPlannerTask.bind(this),
        },
      ],
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
- If no platform is specified, use ${config.defaultPlatform || 'asana'} as default
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
    });
  }

  /**
   * Process natural language input and create appropriate tasks
   */
  async processTaskRequest(input: string, platform?: 'asana' | 'planner'): Promise<string> {
    try {
      // Parse the input text into structured data
      const parsedInput = parseTaskInput(input);
      
      // Validate the parsed input
      const validatedInput = TaskInputSchema.parse(parsedInput);

      // Determine which platform to use
      const targetPlatform = platform || this.config.defaultPlatform || 'asana';

      // Create the task using the appropriate tool
      let taskUrl: string;
      if (targetPlatform === 'asana') {
        taskUrl = await this.createAsanaTask(validatedInput);
      } else {
        taskUrl = await this.createPlannerTask(validatedInput);
      }

      return taskUrl;
    } catch (error) {
      console.error('Error processing task request:', error);
      throw new Error(`Failed to process task request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a task in Asana
   */
  private async createAsanaTask(input: TaskInput): Promise<string> {
    try {
      console.log('Creating Asana task:', input.title);
      const taskUrl = await this.asanaTool.createAsanaTask(input);
      console.log('Asana task created:', taskUrl);
      return taskUrl;
    } catch (error) {
      console.error('Error creating Asana task:', error);
      throw new Error(`Failed to create Asana task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a task in Microsoft Planner
   */
  private async createPlannerTask(input: TaskInput): Promise<string> {
    try {
      console.log('Creating Planner task:', input.title);
      const taskUrl = await this.plannerTool.createPlannerTask(input);
      console.log('Planner task created:', taskUrl);
      return taskUrl;
    } catch (error) {
      console.error('Error creating Planner task:', error);
      throw new Error(`Failed to create Planner task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get agent status and configuration
   */
  getStatus(): { status: string; platforms: string[]; defaultPlatform: string } {
    return {
      status: 'ready',
      platforms: ['asana', 'planner'],
      defaultPlatform: this.config.defaultPlatform || 'asana',
    };
  }

  /**
   * Test the agent with a sample request
   */
  async testAgent(): Promise<string> {
    const testInput = 'Follow up with shipping department by next Friday';
    return await this.processTaskRequest(testInput);
  }
}

/**
 * Create an instance of WorkAssistantAgent with environment configuration
 */
export function createWorkAssistantAgent(): WorkAssistantAgent {
  const config: AgentConfig = {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    defaultPlatform: (process.env.DEFAULT_PLATFORM as 'asana' | 'planner') || 'asana',
  };

  if (!config.openaiApiKey) {
    throw new Error('Missing required configuration: OPENAI_API_KEY must be set');
  }

  return new WorkAssistantAgent(config);
}
