# Mobile Deployment Guide

## Quick Start - Deploy to Vercel

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy Your App
```bash
vercel --prod
```

### 4. Set Environment Variables
In your Vercel dashboard:
1. Go to your project settings
2. Add these environment variables:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `ASANA_TOKEN` - Your Asana personal access token
   - `ASANA_PROJECT` - Your Asana project ID
   - `ASANA_SECTION` - Your Asana section ID (optional)
   - `GRAPH_TOKEN` - Your Microsoft Graph token
   - `PLANNER_PLAN` - Your Planner plan ID
   - `PLANNER_BUCKET` - Your Planner bucket ID (optional)

### 5. Access Your Mobile App
Once deployed, you'll get a URL like `https://your-app.vercel.app`
- Open this URL on your phone's browser
- Bookmark it for easy access
- Add to home screen for app-like experience

## Alternative: Railway Deployment

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login and Deploy
```bash
railway login
railway init
railway up
```

### 3. Set Environment Variables
```bash
railway variables set OPENAI_API_KEY=your_key_here
railway variables set ASANA_TOKEN=your_token_here
# ... etc for all variables
```

## Mobile Shortcuts Integration

### iOS Shortcuts
1. Open Shortcuts app
2. Create new shortcut
3. Add "Get Contents of URL" action
4. Set URL to: `https://your-app.vercel.app/intake`
5. Set method to POST
6. Add JSON body: `{"text": "Your task description"}`
7. Add "Show Result" action

### Android Tasker
1. Create new task
2. Add "HTTP Request" action
3. Set URL to your webhook endpoint
4. Set method to POST
5. Add JSON body with task description

## Testing Your Deployment

1. **Health Check**: Visit `https://your-app.vercel.app/health`
2. **Web Interface**: Visit `https://your-app.vercel.app`
3. **API Test**: 
   ```bash
   curl -X POST https://your-app.vercel.app/intake \
     -H "Content-Type: application/json" \
     -d '{"text":"Test task from mobile"}'
   ```

## Mobile Optimization Features

Your mobile interface includes:
- ✅ Responsive design for all screen sizes
- ✅ Touch-friendly buttons and inputs
- ✅ Auto-resizing textarea
- ✅ Loading states and error handling
- ✅ Direct links to created tasks
- ✅ Example prompts for guidance
- ✅ Works offline (cached interface)

## Troubleshooting

### Common Issues:
1. **Environment variables not set** - Check Vercel dashboard
2. **API keys expired** - Regenerate and update
3. **CORS errors** - Already handled in the code
4. **Mobile browser issues** - Try Chrome/Safari

### Debug Mode:
Add `NODE_ENV=development` to see detailed logs in Vercel function logs.
