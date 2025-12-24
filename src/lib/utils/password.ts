import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== 'string') {
    throw new Error('Password must be a string');
  }

  const normalizedPassword = password.trim();

  return bcrypt.hash(normalizedPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false;
  }

  const normalizedPassword = password.trim();

  return bcrypt.compare(normalizedPassword, hashedPassword);
}
