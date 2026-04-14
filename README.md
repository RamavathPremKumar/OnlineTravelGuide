# Travel Booking and Feedback System

A comprehensive web application for managing travel accommodations, bookings, and verified user feedback.

## Technology Stack

### Frontend
- React.js
- React Router
- Context API
- CSS3

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose

### Services and Libraries
- Authentication: JSON Web Token (JWT)
- Email Service: Nodemailer
- Task Scheduling: Node-cron
- File Management: Multer

## Core Features
- User authentication and authorization with role-based access control.
- Accommodation booking system with availability management.
- Automated booking status updates (Confirmed, Pending, Cancelled, Completed).
- Feedback and review system supporting photo uploads.
- Automated feedback request emails dispatched after checkout.
- Verified stay badges for reviews linked to actual bookings.
- Interactive helpful and not helpful voting system for reviews.

## API Documentation

### Authentication
- POST /api/auth/register: Registers a new user account.
- POST /api/auth/login: Authenticates user and returns a JWT.

### Bookings
- POST /api/bookings: Creates a new accommodation booking.
- GET /api/bookings/my-bookings: Retrieves the booking history for the authenticated user.
- GET /api/bookings/my-bookings/with-actual-status: Retrieves bookings with real-time calculated status based on checkout dates.

### Feedback
- POST /api/feedback: Submits user feedback including optional photo uploads.
- GET /api/feedback: Retrieves all public reviews and feedback.
- POST /api/feedback/:id/vote: Submits a helpful or not helpful vote on a specific review.

## Database Schemas

### User Model
- Fields for username, email, password, and roles.
- Roles: user, admin.

### Booking Model
- Tracks accommodation details, user reference, and stay dates.
- Status management: Confirmed, Pending, Cancelled, Completed.

### Feedback Model
- Includes ratings, text content, and photo references.
- Tracks vote counts for community engagement.
- Links to booking ID to verify stay status.

## System Workflows

### Booking Workflow
1. User selects accommodation and submits booking.
2. System sends a confirmation email.
3. Booking status automatically transitions based on checkout dates.

### Feedback Workflow
1. A cron job executes daily to identify completed stays.
2. Feedback request emails are automatically sent to users.
3. User submits a review with optional photographic evidence.

### Authentication Workflow
1. JWT token-based authentication protects private routes.
2. Tokens are included in request headers for authorized API access.

## Environment Configuration

### Backend Environment Variables
Create a .env file in the backend directory with the following variables:
```text
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=system@example.com
```

### Frontend Environment Variables
Create a .env file in the frontend directory with the following variables:
```text
VITE_API_BASE_URL=http://localhost:5000/api
```

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables in a .env file.
4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables in a .env file.
4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Backend Deployment
1. Ensure MONGODB_URI is set to a production database instance.
2. Set NODE_ENV to production.
3. Deploy the backend service to a platform such as Heroku, AWS, or DigitalOcean.

### Frontend Deployment
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy the resulting dist folder to a static hosting provider like Netlify or Vercel.

## Troubleshooting
- Connection Issues: Verify that the MONGODB_URI is correct and the database IP whitelist allows access.
- Email Failures: Ensure that SMTP credentials are correct and that "Less Secure Apps" or "App Passwords" are configured for the mail server.
- File Upload Errors: Confirm that the uploads directory exists in the backend and has appropriate write permissions.
- Authentication Errors: Verify that the JWT_SECRET is consistent across sessions and that the token is correctly passed in the Authorization header.