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
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Log the credentials being used
          debug(`Attempting login for email: ${credentials.email}`);
          
          // Make a request to our backend API for authentication
          const res = await axios.post('http://localhost:5000/api/users/login', {
            email: credentials.email,
            password: credentials.password,
          });
          
          const user = res.data;
          debug(`Login successful for: ${credentials.email}`);
          
          if (user) {
            // Return user object and token from the API
            return {
              id: user.user.id || user.user._id,
              name: user.user.name,
              email: user.user.email,
              accessToken: user.token,
            };
          }
          
          debug(`Login failed: No user data returned from API`);
          return null;
        } catch (error) {
          debug(`Auth error: ${error.message}`);
          if (error.response) {
            debug(`API response: ${JSON.stringify(error.response.data)}`);
          }
          
          // Return null for authentication failure
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      debug(`JWT callback - Token: ${JSON.stringify(token)}, User: ${user ? 'exists' : 'null'}`);
      // Add access_token to the token right after signin
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      debug(`Session callback - Session: ${JSON.stringify(session)}, Token: ${JSON.stringify(token)}`);
      
      // Ensure session has a user object
      if (!session.user) {
        session.user = {};
      }
      
      // Copy token data to session.user
      if (token) {
        session.user = {
          id: token.id || token.sub,
          name: token.name || 'User',
          email: token.email || 'unknown@example.com',
          accessToken: token.accessToken || ''
        };
        
        // Fix for ensuring user data is available to client
        Object.defineProperty(session, 'user', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: session.user
        });
      }
      
      debug(`Updated session: ${JSON.stringify(session)}`);
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