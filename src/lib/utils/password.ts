
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param password - The plain text password to hash
 * @returns A hashed password string
 * @throws Error if password is not a string
 */
export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== 'string') {
    throw new Error('Password must be a string');
  }

  if (!password || password.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }

  const normalizedPassword = password.trim();

  return bcrypt.hash(normalizedPassword, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * 
 * 
 * @param password - The plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  // Input validation
  if (!password || !hashedPassword) {
    return false;
  }

  if (typeof password !== 'string' || typeof hashedPassword !== 'string') {
    return false;
  }

  // Normalize input
  const normalizedPassword = password.trim();

  // Validate bcrypt hash format (should start with $2a$, $2b$, or $2y$)
  if (!hashedPassword.match(/^\$2[ayb]\$\d{2}\$/)) {
    return false;
  }

  // bcrypt.compare is timing-safe - it always takes the same time
  // regardless of where the password differs
  return bcrypt.compare(normalizedPassword, hashedPassword);
}
