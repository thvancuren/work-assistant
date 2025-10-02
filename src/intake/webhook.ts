import express from 'express';
import dotenv from 'dotenv';
import { createWorkAssistantAgent } from '../agent';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize the agent
let agent: ReturnType<typeof createWorkAssistantAgent>;

try {
  agent = createWorkAssistantAgent();
  console.log('Work Assistant Agent initialized successfully');
} catch (error) {
  console.error('Failed to initialize agent:', error);
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    const status = agent.getStatus();
    res.json({
      status: 'healthy',
      agent: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Main intake endpoint
app.post('/intake', async (req, res) => {
  try {
    const { text, platform } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input: "text" field is required and must be a string',
        example: {
          text: 'Follow up with shipping by next Friday',
          platform: 'asana' // optional: 'asana' or 'planner'
        }
      });
    }

    console.log('Processing task request:', { text, platform });

    // Process the task request
    const taskUrl = await agent.processTaskRequest(text, platform);

    // Return success response
    res.json({
      success: true,
      taskUrl,
      message: 'Task created successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error processing intake request:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    });
  }
});

// Test endpoint
app.post('/test', async (req, res) => {
  try {
    console.log('Running agent test...');
    const testResult = await agent.testAgent();
    
    res.json({
      success: true,
      testResult,
      message: 'Agent test completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Agent test failed:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health - Health check',
      'POST /intake - Create task from natural language',
      'POST /test - Test agent functionality'
    ],
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Work Assistant server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📥 Intake endpoint: http://localhost:${PORT}/intake`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log('');
  console.log('Example usage:');
  console.log(`curl -X POST http://localhost:${PORT}/intake \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"text":"Follow up with shipping by next Friday"}\'');
});

export default app;
