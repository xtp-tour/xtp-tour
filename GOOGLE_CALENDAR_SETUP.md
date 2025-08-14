# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar integration for your tennis scheduling application.

## Prerequisites

- Google Cloud Platform account
- Access to Google APIs
- Basic understanding of OAuth 2.0

## Step 1: Google Cloud Platform Setup

### 1.1 Create a New Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Tennis Scheduler")
4. Click "Create"

### 1.2 Enable Google Calendar API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and click "Enable"

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Add authorized redirect URIs:
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
5. Click "Create"
6. **Save the Client ID and Client Secret** - you'll need these later

### 1.4 Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "Tennis Scheduler"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar`
5. Add test users (your email address)
6. Click "Save and Continue" through all steps

## Step 2: Backend Configuration

### 2.1 Environment Variables
1. Copy `api/.env.example` to `api/.env`
2. Update the values:
```bash
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_client_secret
```

### 2.2 Database Migration
1. Run the database migration to create the required table:
```bash
cd api
make migrate-up
```

### 2.3 Install Dependencies
1. Install the new Go dependencies:
```bash
cd api
go mod tidy
```

## Step 3: Frontend Configuration

### 3.1 Environment Variables
1. Copy `frontend/.env.example` to `frontend/.env`
2. Update the values:
```bash
VITE_GOOGLE_CLIENT_ID=your_actual_client_id
VITE_GOOGLE_API_KEY=your_actual_client_secret
```

### 3.2 Install Dependencies
1. Install the new npm packages:
```bash
cd frontend
pnpm install
```

## Step 4: Testing the Integration

### 4.1 Start the Backend
```bash
cd api
make run
```

### 4.2 Start the Frontend
```bash
cd frontend
pnpm dev
```

### 4.3 Test the Flow
1. Open your application
2. Go to "Create Event"
3. Look for "Google Calendar Integration" section
4. Click "Connect Google Calendar"
5. Authorize the application in the popup
6. Copy the authorization code
7. Paste it in the input field
8. Click "Submit"
9. You should see "Connected to Google Calendar"
10. Create an event and verify blocked time slots appear in red

## Step 5: Production Deployment

### 5.1 Update OAuth Credentials
1. In Google Cloud Console, update your OAuth 2.0 credentials
2. Add your production domain to authorized redirect URIs
3. Update environment variables in production

### 5.2 Security Considerations
- Store OAuth tokens securely (encrypted in database)
- Use HTTPS in production
- Implement proper token refresh logic
- Consider implementing token revocation

## Troubleshooting

### Common Issues

#### 1. "Invalid redirect URI" Error
- Ensure your redirect URI matches exactly in Google Cloud Console
- Check for trailing slashes or protocol mismatches

#### 2. "Access denied" Error
- Verify your email is added as a test user
- Check if the OAuth consent screen is properly configured

#### 3. "API not enabled" Error
- Ensure Google Calendar API is enabled in your project
- Check if billing is enabled (required for some APIs)

#### 4. Frontend Connection Issues
- Verify environment variables are set correctly
- Check browser console for JavaScript errors
- Ensure the backend is running and accessible

### Debug Mode
To enable debug logging, add this to your backend environment:
```bash
LOG_LEVEL=debug
```

## API Endpoints

The integration adds these new endpoints:

- `POST /api/google-calendar/connect` - Connect Google Calendar
- `POST /api/google-calendar/disconnect` - Disconnect Google Calendar
- `GET /api/google-calendar/status` - Check connection status
- `GET /api/google-calendar/blocked-events` - Get blocked events
- `GET /api/google-calendar/auth-url` - Get OAuth URL

## Database Schema

The integration creates a new table:
```sql
CREATE TABLE google_calendar_connections (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Google Cloud Console logs
3. Check application logs
4. Verify all environment variables are set correctly

## Security Notes

- OAuth tokens are stored encrypted in the database
- Access tokens expire automatically and are refreshed
- Users can revoke access at any time from their Google Account
- The application only requests calendar read/write access
- No other Google account data is accessed