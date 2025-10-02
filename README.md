# Work Assistant

A personal AI assistant that integrates with Asana and Microsoft Planner to automatically create tasks from natural language input.

## Features

- 🤖 **AI-Powered Task Creation**: Convert natural language descriptions into structured tasks
- 🔗 **Dual Platform Support**: Create tasks in both Asana and Microsoft Planner
- 📅 **Smart Date Parsing**: Automatically extract due dates from phrases like "next Friday" or "tomorrow"
- 📧 **Email Integration Ready**: Clean email signatures and quoted text
- 🔧 **RESTful API**: Simple webhook endpoint for easy integration
- 📝 **TypeScript**: Full type safety and modern development experience

## Quick Start

### 1. Installation

```bash
# Clone or download the project
cd work-assistant

# Install dependencies
npm install
```

### 2. Configuration

Copy the environment template and fill in your API keys:

```bash
cp env.example .env
```

Edit `.env` with your actual values:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Asana Configuration
ASANA_TOKEN=your_asana_personal_access_token
ASANA_PROJECT=your_asana_project_id
ASANA_SECTION=your_asana_section_id

# Microsoft Graph Configuration
GRAPH_TOKEN=your_microsoft_graph_token
PLANNER_PLAN=your_planner_plan_id
PLANNER_BUCKET=your_planner_bucket_id

# Server Configuration
PORT=3000
```

### 3. Development

```bash
# Start development server with hot reload
npm run dev
```

### 4. Production

```bash
# Build the project
npm run build

# Start production server
npm start
```

## API Usage

### Health Check

```bash
curl http://localhost:3000/health
```

### Create Task

```bash
curl -X POST http://localhost:3000/intake \
  -H "Content-Type: application/json" \
  -d '{"text":"Follow up with shipping by next Friday"}'
```

### Create Task with Platform Selection

```bash
curl -X POST http://localhost:3000/intake \
  -H "Content-Type: application/json" \
  -d '{"text":"Schedule team meeting for tomorrow", "platform":"planner"}'
```

### Test Agent

```bash
curl -X POST http://localhost:3000/test
```

## API Reference

### POST /intake

Creates a task from natural language input.

**Request Body:**
```json
{
  "text": "string (required) - Natural language task description",
  "platform": "string (optional) - 'asana' or 'planner', defaults to 'asana'"
}
```

**Response:**
```json
{
  "success": true,
  "taskUrl": "https://app.asana.com/0/123456789/123456789",
  "message": "Task created successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /health

Returns the health status of the agent and server.

**Response:**
```json
{
  "status": "healthy",
  "agent": {
    "status": "ready",
    "platforms": ["asana", "planner"],
    "defaultPlatform": "asana"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST /test

Runs a test to verify the agent is working correctly.

**Response:**
```json
{
  "success": true,
  "testResult": "https://app.asana.com/0/123456789/123456789",
  "message": "Agent test completed successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Configuration Guide

### OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env` file as `OPENAI_API_KEY`

### Asana Setup

1. Go to [Asana Developer Console](https://app.asana.com/0/my-apps)
2. Create a new personal access token
3. Find your project ID in the URL: `https://app.asana.com/0/PROJECT_ID/`
4. Optionally, find your section ID in the project settings
5. Add these to your `.env` file:
   - `ASANA_TOKEN`: Your personal access token
   - `ASANA_PROJECT`: Your project ID
   - `ASANA_SECTION`: Your section ID (optional)

### Microsoft Planner Setup

1. Go to [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
2. Sign in and get an access token
3. Find your plan ID by calling `GET /planner/plans`
4. Find your bucket ID by calling `GET /planner/plans/{plan-id}/buckets`
5. Add these to your `.env` file:
   - `GRAPH_TOKEN`: Your Microsoft Graph access token
   - `PLANNER_PLAN`: Your plan ID
   - `PLANNER_BUCKET`: Your bucket ID (optional)

## Natural Language Examples

The assistant can understand various natural language patterns:

- **Due Dates**: "next Friday", "tomorrow", "in 3 days", "2024-01-20"
- **Task Types**: "follow up with", "remind me to", "schedule", "create task for"
- **Platform Selection**: Specify "asana" or "planner" in the request

### Example Inputs

```
"Follow up with shipping department by next Friday"
"Remind me to call John tomorrow"
"Schedule team meeting for next Monday"
"Create task for reviewing quarterly reports by end of month"
"Send invoice to client by Friday"
```

## Project Structure

```
work-assistant/
├── src/
│   ├── agent.ts              # Main AI agent logic
│   ├── intake/
│   │   └── webhook.ts        # Express server and API endpoints
│   └── tools/
│       ├── asana.ts          # Asana API integration
│       ├── msgraph.ts        # Microsoft Graph integration
│       └── parsers.ts        # Text parsing utilities
├── package.json              # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── env.example              # Environment variables template
└── README.md                # This file
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm install` - Install dependencies

### Adding New Features

1. **New Tools**: Add new tool classes in `src/tools/`
2. **New Parsers**: Extend parsing functions in `src/tools/parsers.ts`
3. **New Endpoints**: Add routes in `src/intake/webhook.ts`
4. **Agent Logic**: Modify `src/agent.ts` for new behaviors

## Troubleshooting

### Common Issues

1. **"Missing required configuration"**: Check that all required environment variables are set in `.env`
2. **"API error"**: Verify your API tokens are valid and have proper permissions
3. **"Failed to create task"**: Check that project/plan IDs exist and are accessible
4. **"Agent not responding"**: Ensure OpenAI API key is valid and has sufficient credits

### Debug Mode

Set `NODE_ENV=development` to enable detailed logging:

```bash
NODE_ENV=development npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the API documentation
3. Open an issue on GitHub
4. Check the logs for detailed error messages
