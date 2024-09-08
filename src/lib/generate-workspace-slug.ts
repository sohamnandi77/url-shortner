import { nanoid } from "nanoid";

export function generateWorkspaceSlug(userId?: string): string {
  if (!userId) {
    throw new Error("User ID is required to generate a workspace slug");
  }
  const randomString = nanoid(6);
  const timestamp = Date.now().toString(36); // Convert current timestamp to base36 to keep it short

  // Combining userId, timestamp, and randomString to form the slug
  const slug = `${userId.slice(-4)}-${randomString}-${timestamp}`;

  return slug;
}
