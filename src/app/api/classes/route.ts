import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
 
  const { department, semester, masterCode } = await req.json();
  try {
    const newClass = await prisma.class.create({
      data: { department, semester, masterCode },
    });
    return NextResponse.json(newClass);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
 
  try {
    const classes = await prisma.class.findMany();
    return NextResponse.json(classes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
 
  const { department, semester, masterCode } = await req.json();
  try {
    const updatedClass = await prisma.class.update({
      where: { id: parseInt(params.id) },
      data: { department, semester, masterCode },
    });
    return NextResponse.json(updatedClass);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
