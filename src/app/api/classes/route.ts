import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { DatabaseError } from '@/lib/types';
import { handleApiError } from '@/lib/error-handler';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { department, semester, masterCode } = await request.json();
  try {
    const newClass = await prisma.class.create({
      data: { department, semester, masterCode },
    });
    return NextResponse.json(newClass);
  } catch (error: unknown) {
    const dbError = error as DatabaseError;
    return NextResponse.json(
      { error: dbError.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const classes = await prisma.class.findMany();
    return NextResponse.json(classes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  const { id, department, semester, masterCode } = await req.json();
  try {
    const updatedClass = await prisma.class.update({
      where: { id: parseInt(id) },
      data: { department, semester, masterCode },
    });
    return NextResponse.json(updatedClass);
  } catch (error: unknown) {
    const dbError = error as DatabaseError;
    return NextResponse.json(
      { error: dbError.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
 
  try {
    // Parse the request body
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Check if the class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Delete the class
    await prisma.class.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Class deleted successfully' });
  } catch (error: unknown) {
    const dbError = error as DatabaseError;
    return NextResponse.json(
      { error: dbError.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
