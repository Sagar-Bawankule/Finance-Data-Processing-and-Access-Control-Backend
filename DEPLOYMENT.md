# MERN Stack Backend for Vercel Deployment

## Complete Serverless Backend Setup

This is a production-ready MERN stack backend configured for Vercel serverless deployment.

## Environment Variables Setup

### Local Development:
1. Copy `.env.example` to `.env`
2. Fill in your MongoDB Atlas connection string

### Vercel Deployment:
Add these environment variables in your Vercel dashboard:

**MONGO_URI**: Your MongoDB Atlas connection string
```
mongodb+srv://username:password@cluster0.abc123.mongodb.net/database_name?retryWrites=true&w=majority
```

**JWT_SECRET**: A secure secret key
```
your-super-secure-jwt-secret-key-at-least-32-characters
```

**NODE_ENV**: Environment setting
```
production
```

## Deployment Steps

### 1. Prepare Your Code
- Ensure `api/index.js` exports Express app without `app.listen()`
- Verify `vercel.json` routes all requests to `/api/index.js`
- Test locally: `npm run dev`

### 2. Deploy to Vercel

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time - will setup project)
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? [your-project-name]
# - Directory? ./
```

#### Option B: GitHub Integration
1. Push code to GitHub repository
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Vercel auto-detects the configuration
5. Add environment variables in project settings
6. Deploy

### 3. Environment Variables in Vercel
1. Go to your project dashboard on Vercel
2. Navigate to Settings → Environment Variables
3. Add:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret
   - `NODE_ENV`: `production`

### 4. Test Your Deployment
After deployment, test these endpoints:
- `https://your-app.vercel.app/` - Should return "Backend is running"
- `https://your-app.vercel.app/health` - Health check
- `https://your-app.vercel.app/api/test` - API test endpoint

## Project Structure
```
your-project/
├── api/
│   └── index.js          # Serverless function entry point
├── package.json          # Dependencies and scripts
├── vercel.json          # Vercel configuration
├── .env.example         # Environment variables template
└── DEPLOYMENT.md        # This file
```

## Key Features
- ✅ Express.js serverless setup
- ✅ MongoDB Atlas integration
- ✅ Environment variables support
- ✅ CORS enabled
- ✅ JSON parsing middleware
- ✅ Health check endpoints
- ✅ Production-ready configuration

## Troubleshooting
- **Database connection issues**: Verify MONGO_URI in Vercel environment variables
- **Function timeout**: Optimize database queries and use connection pooling
- **CORS errors**: Ensure CORS is properly configured for your frontend domain

## Local Testing

To test locally:
```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to see "Backend is running"