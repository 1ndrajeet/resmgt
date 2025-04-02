import jwt from 'jsonwebtoken';

// Get JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '24h', // Token expires in 24 hours
  });
}

export function verifyToken(token: string): { userId: number } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded;
  } catch (error: unknown) {
    const authError = error as Error;
    throw new Error(`Invalid token: ${authError.message}`);
  }
}