# Intelligent CI/CD Health Monitor

A full-stack application for monitoring CI/CD pipelines with AI-powered insights.

## Features

- **User Authentication**: Register and login with JWT tokens.
- **Project Management**: Create projects with unique webhook URLs for GitHub integration.
- **Build Monitoring**: Track builds from webhooks, view status, logs, and metrics.
- **AI Insights**: Get AI-generated explanations for build failures and suggestions.
- **Dashboard**: Real-time dashboard with charts, trends, and health metrics.
- **Pipelines**: View pipeline runs per project.
- **Notifications**: Email alerts for build successes and failures (configurable).

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Google Generative AI
- **Frontend**: React, Vite, Axios, React Router, Recharts

## Setup

### Prerequisites

- Node.js
- MongoDB (local or cloud)
- GitHub account for webhooks

### Backend Setup

1. Navigate to `backend/` directory.
2. Install dependencies: `npm install`
3. Create `.env` file with:
   ```
   MONGO_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   GEMINI_API_KEY=your-google-gemini-api-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   PORT=5000
   ```
4. Start the server: `npm run dev`

### Frontend Setup

1. Navigate to `frontend/` directory.
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

### Usage

1. Register/Login.
2. Create a project, copy the webhook URL.
3. Set up webhook in GitHub repo (push events).
4. Push code, see builds appear.
5. View dashboard, builds, insights.

## API Endpoints

- Auth: `/api/auth/register`, `/api/auth/login`
- Projects: `/api/projects` (CRUD)
- Builds: `/api/builds` (GET all, GET by id)
- Logs: `/api/logs/:buildId`
- Metrics: `/api/metrics`
- Pipelines: `/api/pipelines` (GET, POST)
- Webhook: `/api/webhook/:token`
- AI: `/api/ai-insights/:buildId`



Anomaly Detection & Predictive Analytics

What: Use AI to flag unusual patterns (e.g., sudden duration spikes) and predict failures.
Why: Goes beyond reactive monitoring to predictive health.
How:
Extend AI route to analyze trends (e.g., compare last 10 builds).
Add a "Predictive Insights" section in AI page.
Use Gemini for queries like "Predict if this build will fail based on history."
Effort: 1-2 days; leverages existing AI integration.


## Contributing

Feel free to contribute!</content>
<parameter name="filePath">d:\CICD-Monitor\README.md