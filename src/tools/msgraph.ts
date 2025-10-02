import { TaskInput } from './parsers';

interface GraphConfig {
  token: string;
  planId: string;
  bucketId?: string;
}

interface PlannerTask {
  id: string;
  title: string;
  planId: string;
  bucketId: string;
  dueDateTime?: string;
  assignedTo?: string;
  webUrl: string;
}

interface GraphResponse<T> {
  value?: T;
  '@odata.context'?: string;
}

export class PlannerTool {
  private config: GraphConfig;
  private baseUrl = 'https://graph.microsoft.com/v1.0';

  constructor(config: GraphConfig) {
    this.config = config;
  }

  /**
   * Create a new task in Microsoft Planner
   */
  async createPlannerTask(input: TaskInput): Promise<string> {
    try {
      // First, get the plan details to ensure we have the correct bucket
      const plan = await this.getPlan(this.config.planId);
      const bucketId = this.config.bucketId || plan.defaultBucketId;

      if (!bucketId) {
        throw new Error('No bucket ID specified and plan has no default bucket');
      }

      // Prepare task data
      const taskData: any = {
        planId: this.config.planId,
        bucketId: bucketId,
        title: input.title,
      };

      if (input.dueDate) {
        // Convert date to ISO string with timezone
        const dueDate = new Date(input.dueDate);
        taskData.dueDateTime = dueDate.toISOString();
      }

      if (input.assignee) {
        taskData.assignedTo = input.assignee;
      }

      // Create the task
      const response = await fetch(`${this.baseUrl}/planner/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Microsoft Graph API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const task = await response.json() as PlannerTask;

      // Add description and links as task details if provided
      if (input.description || (input.links && input.links.length > 0)) {
        await this.updateTaskDetails(task.id, input);
      }

      return task.webUrl;
    } catch (error) {
      console.error('Error creating Planner task:', error);
      throw new Error(`Failed to create Planner task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update task details with description and links
   */
  private async updateTaskDetails(taskId: string, input: TaskInput): Promise<void> {
    try {
      let description = input.description || '';
      
      if (input.links && input.links.length > 0) {
        const linksText = input.links.map(link => `- ${link}`).join('\n');
        description += (description ? '\n\n' : '') + 'Links:\n' + linksText;
      }

      if (description) {
        const detailsData = {
          description: description,
        };

        const response = await fetch(`${this.baseUrl}/planner/tasks/${taskId}/details`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Content-Type': 'application/json',
            'If-Match': '*', // Required for PATCH operations
          },
          body: JSON.stringify(detailsData),
        });

        if (!response.ok) {
          console.warn(`Failed to update task details: ${response.status}`);
        }
      }
    } catch (error) {
      console.warn('Error updating task details:', error);
    }
  }

  /**
   * Get plan information
   */
  async getPlan(planId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/planner/plans/${planId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get plan: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting Planner plan:', error);
      throw error;
    }
  }

  /**
   * Get buckets for a plan
   */
  async getPlanBuckets(planId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/planner/plans/${planId}/buckets`, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get plan buckets: ${response.status}`);
      }

      const result = await response.json() as GraphResponse<any[]>;
      return result.value || [];
    } catch (error) {
      console.error('Error getting Planner buckets:', error);
      throw error;
    }
  }

  /**
   * Get tasks for a plan
   */
  async getPlanTasks(planId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/planner/plans/${planId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get plan tasks: ${response.status}`);
      }

      const result = await response.json() as GraphResponse<any[]>;
      return result.value || [];
    } catch (error) {
      console.error('Error getting Planner tasks:', error);
      throw error;
    }
  }
}

/**
 * Create an instance of PlannerTool with environment configuration
 */
export function createPlannerTool(): PlannerTool {
  const config: GraphConfig = {
    token: process.env.GRAPH_TOKEN || '',
    planId: process.env.PLANNER_PLAN || '',
    bucketId: process.env.PLANNER_BUCKET,
  };

  if (!config.token || !config.planId) {
    throw new Error('Missing required Planner configuration: GRAPH_TOKEN and PLANNER_PLAN must be set');
  }

  return new PlannerTool(config);
}
