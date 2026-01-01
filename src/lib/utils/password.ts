
import * as bcrypt from 'bcrypt';

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

// Precomputed dummy bcrypt hash for constant-time comparison
// This hash is for the string "dummy" and is used when hashedPassword is missing
// to prevent timing attacks
const DUMMY_HASH = '$2b$10$q7rl3eIBhd63SJLiTgiGnufchdJyGuqzR.yaNOkXMqsoEX4tC7oSS';

/**
 * Verify a password against a hash
 * 
 * This function uses constant-time comparison to prevent timing attacks.
 * Even when inputs are invalid, it performs a bcrypt.compare operation
 * to maintain consistent timing behavior.
 * 
 * @param password - The plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    // Normalize inputs - use empty string if missing to maintain constant-time behavior
    const normalizedPassword = (password && typeof password === 'string') 
      ? password.trim() 
      : '';
    
    // Use dummy hash if hashedPassword is missing or invalid format
    // This ensures bcrypt.compare is always called, preventing timing attacks
    const hashToCompare = (hashedPassword && 
                           typeof hashedPassword === 'string' && 
                           hashedPassword.match(/^\$2[ayb]\$\d{2}\$/))
      ? hashedPassword
      : DUMMY_HASH;

    // Always perform bcrypt.compare to maintain constant-time behavior
    // This prevents timing attacks even when inputs are invalid
    const result = await bcrypt.compare(normalizedPassword, hashToCompare);
    
    // Return false if we used dummy hash (invalid input) or if comparison failed
    if (hashToCompare === DUMMY_HASH) {
      return false;
    }
    
    return result;
  } catch (error) {
    // Log error for debugging but don't leak information about the error type
    // Return false on error to avoid throwing during verification and maintain consistent timing
    console.error('Password verification error:', error);
    return false;
  }
}
