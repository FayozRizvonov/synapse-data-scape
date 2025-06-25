# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/2806919e-4e61-4378-b8fb-934eb320fb1e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2806919e-4e61-4378-b8fb-934eb320fb1e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2806919e-4e61-4378-b8fb-934eb320fb1e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# Synapse Data Scape - GSIS AI Platform

A modern business intelligence platform for pharmaceutical analytics with AI-powered insights.

## Features

- **AI Assistant**: Powered by OpenAI GPT-4 with comprehensive knowledge of pharmaceutical metrics
- **Real-time Analytics**: Interactive dashboards with animated metrics
- **Responsive Design**: Modern UI with dark/light theme support
- **Pharma S&M Analytics**: Detailed pharmaceutical sales and marketing metrics

## AI Assistant Setup

The AI assistant is powered by a Supabase Edge Function that integrates with OpenAI GPT-4. To set it up:

1. **Deploy the Edge Function**:
   ```bash
   supabase functions deploy ai-assistant
   ```

2. **Set Environment Variables**:
   ```bash
   supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Test the Function**:
   ```bash
   supabase functions invoke ai-assistant --body '{"message": "Hello"}'
   ```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## AI Assistant Capabilities

The AI assistant can:
- Answer questions about pharmaceutical metrics in Russian and English
- Show specific metric cards and charts
- Navigate to different sections
- Provide detailed insights and recommendations
- Analyze trends and relationships between metrics

## Available Metrics

### Key Metrics
- QoQ Revenue Growth
- Patient Share / Prescriptions  
- Sample-to-Script Ratio
- Rebate Spend vs ROI
- Market Access Score

### Situation Metrics
- Base Sales
- Seasonality
- Trend
- Digital Pharma Display
- Digital Pharma Video
- Page Visit ViV Exchange
- Medscape HiV Brand Alert
- OLA Attendees
- OOH Pharma
- Phone Calls ABC
- Veeva Emails
- Web Virtual Calls ABC

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase Edge Functions
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel/Netlify ready
