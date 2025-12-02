// backend/src/config/clerk.js
import { ClerkExpressWithAuth, clerkClient } from '@clerk/clerk-sdk-node';

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('Missing CLERK_SECRET_KEY in .env');
}

export { ClerkExpressWithAuth, clerkClient };