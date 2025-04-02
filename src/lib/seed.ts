import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: { username: 'admin', password: hashedPassword },
  });
  console.log('Admin user created');
}

seed().then(() => prisma.$disconnect());