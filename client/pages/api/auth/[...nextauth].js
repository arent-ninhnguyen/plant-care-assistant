import NextAuth from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import axios from 'axios';

// Add debug handler to ensure proper error formatting
const debug = (message) => {
  console.log(`[next-auth] ${message}`);
};

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      async authorize(credentials) {
        console.log('Authorize: Attempting login for:', credentials.email);
        
        // Ensure credentials object and properties exist
        if (!credentials || !credentials.email || !credentials.password) {
          console.error('Authorize: Missing credentials');
          throw new Error('Missing email or password');
        }

        const backendLoginUrl = process.env.BACKEND_API_URL ? `${process.env.BACKEND_API_URL}/api/users/login` : 'http://localhost:5000/api/users/login';
        console.log(`Authorize: Sending request to backend: ${backendLoginUrl}`);

        try {
          const response = await axios.post(backendLoginUrl, {
            email: credentials.email,
            password: credentials.password,
          });

          // Check if the response contains the expected data
          const backendData = response.data;
          if (backendData && backendData.token && backendData.user) {
            console.log('Authorize: Backend login successful for:', backendData.user.email);
            // IMPORTANT: Return an object that NextAuth can use.
            // Include the token and any user details needed for the session.
            return {
              id: backendData.user.id, // Ensure backend provides 'id'
              name: backendData.user.name,
              email: backendData.user.email,
              backendToken: backendData.token // Store the backend token
            };
          } else {
            // Handle cases where backend responds with 2xx status but missing data
            console.error('Authorize: Backend response missing token or user data', backendData);
            return null; // Indicate failure
          }
        } catch (error) {
          // Handle errors from the axios request (e.g., network error, 4xx/5xx responses)
          const errorMessage = error.response?.data?.message || error.message;
          console.error('Authorize: Backend login failed:', errorMessage);
          // Throwing an error here can provide more specific feedback on the client
          // Or return null to just indicate failed login without details
          // throw new Error(errorMessage); // Option 1: Throw error
          return null; // Option 2: Return null (standard practice for authorize failure)
        }
      } // End authorize function
    }) // End CredentialsProvider
  ], // End providers array
  callbacks: {
    async jwt({ token, user }) {
      // 'user' object is only passed on the initial sign-in
      if (user) {
        console.log('[next-auth] JWT callback - User object received:', user);
        // Persist the backend token and user id to the JWT
        token.id = user.id;
        token.backendToken = user.backendToken; 
      }
      // console.log('[next-auth] JWT callback - Returning token:', token);
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like id and token
      // Note: token object here contains what we added in the jwt callback
      if (token && session.user) {
         session.user.id = token.id;
         session.user.accessToken = token.backendToken; // Add token to session.user
      }
      // console.log('[next-auth] Session callback - Returning session:', session);
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/register',
    error: '/auth/error', // Point to client-side error page
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  // Explicitly log the secret right before it's used in the config
  _secretForDebug: console.log('[NextAuth Options] Secret value DURING config:', process.env.NEXTAUTH_SECRET),
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode
  logger: {
    error: (code, ...message) => {
      debug(`Error: ${code}: ${message}`);
    },
    warn: (code, ...message) => {
      debug(`Warning: ${code}: ${message}`);
    },
    debug: (code, ...message) => {
      debug(`Debug: ${code}: ${message}`);
    },
  },
};

export default NextAuth(authOptions);