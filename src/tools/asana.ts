import fetch from 'node-fetch';
import { TaskInput } from './parsers';

interface AsanaConfig {
  token: string;
  project: string;
  section?: string;
}

interface AsanaTask {
  gid: string;
  name: string;
  notes?: string;
  due_on?: string;
  assignee?: string;
  projects: string[];
  permalink_url: string;
}

interface AsanaResponse<T> {
  data: T;
}

export class AsanaTool {
  private config: AsanaConfig;
  private baseUrl = 'https://app.asana.com/api/1.0';

  constructor(config: AsanaConfig) {
    this.config = config;
  }

  /**
   * Create a new task in Asana
   */
  async createAsanaTask(input: TaskInput): Promise<string> {
    try {
      // Prepare task data
      const taskData: any = {
        name: input.title,
        projects: [this.config.project],
      };

      if (input.description) {
        taskData.notes = input.description;
      }

      if (input.dueDate) {
        taskData.due_on = input.dueDate;
      }

      if (input.assignee) {
        taskData.assignee = input.assignee;
      }

      // Add links to notes if provided
      if (input.links && input.links.length > 0) {
        const linksText = input.links.map(link => `- ${link}`).join('\n');
        taskData.notes = (taskData.notes || '') + '\n\nLinks:\n' + linksText;
      }

      // Create the task
      const response = await fetch(`${this.baseUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: taskData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Asana API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const result: AsanaResponse<AsanaTask> = await response.json();
      const task = result.data;

      // Move task to section if specified
      if (this.config.section && task.gid) {
        await this.moveTaskToSection(task.gid, this.config.section);
      }

      return task.permalink_url;
    } catch (error) {
      console.error('Error creating Asana task:', error);
      throw new Error(`Failed to create Asana task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Move a task to a specific section
   */
  private async moveTaskToSection(taskGid: string, sectionGid: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/sections/${sectionGid}/addTask`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { task: taskGid } }),
      });

      if (!response.ok) {
        console.warn(`Failed to move task to section: ${response.status}`);
        // Don't throw error here as the task was already created
      }
    } catch (error) {
      console.warn('Error moving task to section:', error);
      // Don't throw error here as the task was already created
    }
  }

  /**
   * Get project information
   */
  async getProject(projectGid: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${projectGid}`, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get project: ${response.status}`);
      }

      const result: AsanaResponse<any> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error getting Asana project:', error);
      throw error;
    }
  }

  /**
   * Get sections for a project
   */
  async getProjectSections(projectGid: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${projectGid}/sections`, {
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get project sections: ${response.status}`);
      }

      const result: AsanaResponse<any[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error getting Asana project sections:', error);
      throw error;
    }
  }
}

/**
 * Create an instance of AsanaTool with environment configuration
 */
export function createAsanaTool(): AsanaTool {
  const config: AsanaConfig = {
    token: process.env.ASANA_TOKEN || '',
    project: process.env.ASANA_PROJECT || '',
    section: process.env.ASANA_SECTION,
  };

  if (!config.token || !config.project) {
    throw new Error('Missing required Asana configuration: ASANA_TOKEN and ASANA_PROJECT must be set');
  }

  return new AsanaTool(config);
}
