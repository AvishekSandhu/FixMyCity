// backend/src/utils/roles.js
import { clerkClient } from './config/clerk.js';

export async function getUserRole(userId) {
  const user = await clerkClient.users.getUser(userId);
  return user.publicMetadata.role || 'citizen';
}

export const isAdminRole = (role) => role === 'admin';
export const isOfficerRole = (role) => role === 'officer';