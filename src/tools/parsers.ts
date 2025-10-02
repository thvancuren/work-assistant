import { z } from 'zod';

// Schema for task input validation
export const TaskInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  dueDate: z.string().nullable(),
  assignee: z.string().nullable(),
  project: z.string().nullable(),
  section: z.string().nullable(),
  links: z.array(z.string()).nullable(),
  attachments: z.array(z.string()).nullable(),
});

export type TaskInput = z.infer<typeof TaskInputSchema>;

/**
 * Extract due date from natural language text
 * Converts phrases like "next Friday", "tomorrow", "in 3 days" to ISO date strings
 */
export function extractDueDate(text: string): string | null {
  const now = new Date();
  const lowerText = text.toLowerCase();
  
  // Handle "next [day]" patterns
  const dayMap: { [key: string]: number } = {
    'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
    'friday': 5, 'saturday': 6, 'sunday': 0
  };
  
  // Check for "next [day]" pattern
  for (const [day, dayNum] of Object.entries(dayMap)) {
    const regex = new RegExp(`next\\s+${day}`, 'i');
    if (regex.test(text)) {
      const daysUntilNext = (dayNum - now.getDay() + 7) % 7;
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + daysUntilNext);
      return targetDate.toISOString().split('T')[0];
    }
  }
  
  // Handle "tomorrow"
  if (lowerText.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  // Handle "in X days"
  const daysMatch = text.match(/in\s+(\d+)\s+days?/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + days);
    return targetDate.toISOString().split('T')[0];
  }
  
  // Handle specific dates (YYYY-MM-DD format)
  const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (dateMatch) {
    return dateMatch[1];
  }
  
  return null;
}

/**
 * Map assignee names to Asana/Planner user IDs
 * This would typically connect to your organization's user directory
 */
export function mapAssigneeToId(assigneeName: string, platform: 'asana' | 'planner'): string | null {
  // This is a placeholder implementation
  // In a real application, you'd query your organization's user directory
  const userMap: { [key: string]: { asana?: string; planner?: string } } = {
    'john doe': { asana: '123456789', planner: 'john.doe@company.com' },
    'jane smith': { asana: '987654321', planner: 'jane.smith@company.com' },
  };
  
  const normalizedName = assigneeName.toLowerCase().trim();
  const user = userMap[normalizedName];
  
  if (user && platform === 'asana') {
    return user.asana || null;
  } else if (user && platform === 'planner') {
    return user.planner || null;
  }
  
  return null;
}

/**
 * Clean email body text by removing signatures, quoted text, etc.
 */
export function cleanEmailBody(emailBody: string): string {
  // Remove common email signatures and quoted text
  let cleaned = emailBody
    .replace(/--\s*\n.*$/s, '') // Remove signature after --
    .replace(/^On.*wrote:$/m, '') // Remove "On [date] [person] wrote:"
    .replace(/^>.*$/gm, '') // Remove quoted lines starting with >
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
    .trim();
  
  return cleaned;
}

/**
 * Extract task title from natural language input
 */
export function extractTaskTitle(text: string): string {
  // Remove common prefixes
  const prefixes = [
    'follow up with',
    'remind me to',
    'schedule',
    'create task for',
    'add task:',
    'task:',
  ];
  
  let title = text.trim();
  
  for (const prefix of prefixes) {
    if (title.toLowerCase().startsWith(prefix)) {
      title = title.substring(prefix.length).trim();
      break;
    }
  }
  
  // Capitalize first letter
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/**
 * Parse natural language input into structured task data
 */
export function parseTaskInput(text: string): Partial<TaskInput> {
  const title = extractTaskTitle(text);
  const dueDate = extractDueDate(text);
  
  return {
    title,
    dueDate: dueDate || undefined,
    description: cleanEmailBody(text),
  };
}
