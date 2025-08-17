# Schedule Editor with Supabase

A multi-user schedule management web application with AI-powered image processing, built with Node.js, Express, and Supabase.

## Features

- **Multi-User Support**: Each user has their own private schedule
- **AI Image Processing**: Upload schedule images and extract data using OpenAI GPT-4 Vision
- **Real-time Updates**: Live data synchronization
- **User Authentication**: Secure login/signup system
- **Responsive Design**: Works on desktop and mobile devices
- **Schedule Management**: Create and edit weekday and specific date schedules

## Architecture

- **Frontend**: HTML, CSS, JavaScript with Supabase client
- **Backend**: Node.js + Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Processing**: OpenAI GPT-4 Vision API
- **File Storage**: Supabase Storage (for future image uploads)

## Prerequisites

- Node.js 14+ 
- Supabase account (free tier available)
- OpenAI API key
- Git

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd Schedule
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your project URL and service role key from Settings > API
3. Go to SQL Editor and run the schema from `database-schema.sql`

### 3. Configure Environment Variables

1. Copy `env.example` to `.env`
2. Fill in your configuration:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# Server
PORT=3000
NODE_ENV=development
```

### 4. Update Frontend Configuration

Edit `public/js/supabase-client.js`:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your_anon_key';
```

### 5. Run the Application

```bash
# Development
npm run dev

# Production
npm start
```

Visit `http://localhost:3000` in your browser.

## Database Schema

The app uses a single `schedules` table with:

- `id`: Unique identifier
- `user_id`: Links to Supabase auth users
- `name`: Schedule name (default: "Default Schedule")
- `weekdays`: JSONB storing weekday schedules
- `specific_dates`: JSONB storing date-specific schedules
- `created_at` / `updated_at`: Timestamps

## API Endpoints

### Authentication Required for All Endpoints

- `GET /api/schedule` - Get user's schedule
- `POST /api/schedule` - Save/update user's schedule
- `POST /api/schedule/extract` - Extract schedule from image

## User Flow

1. **Sign Up/Login**: Users create accounts or sign in
2. **Create Schedule**: Build weekly schedules or specific date schedules
3. **Image Upload**: Upload schedule images for AI processing
4. **Edit & Save**: Modify schedules and save changes
5. **View Calendar**: See schedules in calendar format

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation of all inputs
- **CORS Protection**: Configured for production use

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Other Platforms

- **Heroku**: Add PostgreSQL addon
- **Railway**: Built-in PostgreSQL support
- **DigitalOcean**: Use App Platform with managed database

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin operations | Yes |
| `OPENAI_API_KEY` | OpenAI API key for image processing | Yes |
| `OPENAI_MODEL` | GPT model to use (default: gpt-4o-mini) | No |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check your `.env` file exists and has correct values
   - Restart the server after changing environment variables

2. **"Authentication failed"**
   - Verify Supabase URL and keys
   - Check if user exists in Supabase auth

3. **"Failed to save schedule"**
   - Ensure database schema is properly set up
   - Check RLS policies are enabled

4. **Image processing errors**
   - Verify OpenAI API key is valid
   - Check API quota and billing

### Debug Mode

Enable detailed logging by setting `NODE_ENV=development` in your `.env` file.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the troubleshooting section
- Review Supabase and OpenAI documentation
- Open an issue on GitHub
