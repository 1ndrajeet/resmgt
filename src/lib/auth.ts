// import jwt from 'jsonwebtoken';

// const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-jwt-secret';

// export function generateToken(userId: number): string {
//   return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
// }

// export function verifyToken(token: string): { userId: number } | null {
//   try {
//     const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
//     console.log('Token verified:', decoded); // Debug
//     return decoded;
//   } catch (error) {
//     console.error('Token verification failed:', error);
//     return null;
//   }
// }