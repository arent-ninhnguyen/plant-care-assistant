// This endpoint returns the available authentication providers
export default function handler(req, res) {
  // Define the available providers
  const providers = {
    credentials: {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      signinUrl: "/api/auth/signin/credentials",
      callbackUrl: "/api/auth/callback/credentials"
    }
  };
  
  res.status(200).json(providers);
} 