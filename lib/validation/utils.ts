// lib/validation/utils/generate-id.ts

/**
 * Generates a short, unique ID for issues (nanoid-style)
 * Format: 8 characters using URL-safe characters
 */
export function generateShortId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}