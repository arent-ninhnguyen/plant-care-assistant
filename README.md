# Plant Care Assistant

A full-stack web application to help users track and manage their plants' care needs. The application allows users to store information about their plants, set watering and care reminders, and track plant growth over time.

## Features

- **User Authentication**: Secure login and registration using NextAuth.js
- **Plant Management**: Add, edit, and remove plants from your collection
- **Care Reminders**: Set and manage reminders for watering, fertilizing, and other care tasks
- **Dashboard**: View your plant collection and upcoming care tasks at a glance
- **AI Plant Status Check**: Upload an image of your plant or flower on its detail page to get an AI-powered health analysis (using Google Gemini). The analysis includes an overall assessment, potential issues, and care suggestions, available in multiple languages (English, Vietnamese, Spanish, Japanese).
- **User Profile Management**: Update name, password, and upload a custom avatar.
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- Next.js
- React
- Tailwind CSS
- Axios for API requests
- NextAuth.js for authentication

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JWT for API authentication
- bcrypt for password hashing

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB installed or MongoDB Atlas account
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/plant-care-assistant.git
cd plant-care-assistant
```

2. Install dependencies for both client and server
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Set up environment variables
   - Create a `.env` file in the server directory:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```
   
   - Create a `.env.local` file in the client directory:
   ```
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

4. Start the development servers
```bash
# Start the backend server (from the server directory)
npm run dev

# Start the frontend server (from the client directory)
npm run dev
```

5. Access the application
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## License

MIT 