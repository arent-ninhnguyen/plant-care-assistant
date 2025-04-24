import NextAuth from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import axios from 'axios';

// Base URL for backend API calls within callbacks
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:5000';

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
              avatarUrl: backendData.user.avatarUrl,
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
    async jwt({ token, user, trigger, session }) {
      // User object is passed on initial sign-in
      if (user) {
        console.log('[next-auth] JWT callback - Initial sign-in. Populating token.');
        token.id = user.id;
        token.name = user.name; // Persist name
        token.email = user.email; // Persist email
        token.avatarUrl = user.avatarUrl;
        token.backendToken = user.backendToken;
        return token;
      }

      // Handle session updates triggered by updateSession()
      if (trigger === "update" && session?.user) {
        console.log('[next-auth] JWT callback - Trigger is update. Merging session data into token.', session.user);
        // Merge the fields from the session update into the token
        token.name = session.user.name ?? token.name;
        token.email = session.user.email ?? token.email;
        token.avatarUrl = session.user.avatarUrl ?? token.avatarUrl;
        // Potentially update other fields if needed

        // Important: After merging, we still want to return the token
        // without immediately refetching, to reflect the optimistic update.
        // The *next* time the JWT is read, the refetch logic below will run.
        console.log('[next-auth] JWT callback - Token after update merge:', token);
        return token;
      }

      // On subsequent requests (not initial sign-in or update trigger),
      // refetch user data to ensure token is fresh.
      // This ensures changes like avatar updates are reflected.
      if (token.id && token.backendToken) {
          console.log(`[next-auth] JWT callback - Refreshing user data for token validation/read. User ID: ${token.id}`);
          try {
              const profileUrl = `${BACKEND_API_URL}/api/users/me`; // <-- Changed to use existing /me route
              const response = await axios.get(profileUrl, {
                  headers: { Authorization: `Bearer ${token.backendToken}` },
              });
              const freshUser = response.data;
              if (freshUser) {
                  // Update token with latest data from DB
                  token.name = freshUser.name;
                  token.email = freshUser.email;
                  token.avatarUrl = freshUser.avatarUrl;
                  console.log('[next-auth] JWT callback - Successfully refreshed user data in token.');
              } else {
                 console.warn('[next-auth] JWT callback - Profile endpoint returned no user data during refresh.');
                 // Decide how to handle: return old token? invalidate token? 
                 // Returning old token for now.
              }
          } catch (error) {
              console.error('[next-auth] JWT callback - Error refreshing user data:', error.response?.data || error.message);
              // Decide how to handle: return old token? invalidate token by returning null/error?
              // Returning old token to prevent immediate logout, but session might be stale.
          }
      }
      
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like id and token
      if (token && session.user) {
         session.user.id = token.id;
         session.user.accessToken = token.backendToken; 
         // Ensure all necessary fields from the (potentially refreshed) token are copied
         session.user.name = token.name;
         session.user.email = token.email; 
         session.user.avatarUrl = token.avatarUrl;
      }
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