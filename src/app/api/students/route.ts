import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { PrismaError } from '@/lib/types';

const prisma = new PrismaClient();

// GET: Fetch all students
export async function GET(req: Request) {
 

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId');

  try {
    const students = await prisma.student.findMany({
      where: classId ? { classId: parseInt(classId) } : undefined, // Filter by classId if provided
      include: { class: true }, // Include class details
    });
    return NextResponse.json(students);
  } catch (error: unknown) {
    const prismaError = error as PrismaError;
    return NextResponse.json(
      { error: prismaError.message || 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect(); // Ensure Prisma disconnects to avoid connection leaks
  }
}

// POST: Create a new student
export async function POST(req: Request) {
    

    const { name, seatNumber, enrollmentNumber, classId } = await req.json();
    try {
        // Check if a student with the same seatNumber or enrollmentNumber already exists
        const existingStudent = await prisma.student.findFirst({
            where: {
                OR: [
                    { seatNumber },
                    { enrollmentNumber },
                ],
            },
        });

        if (existingStudent) {
            return NextResponse.json(
                { error: 'Student with the same seat number or enrollment number already exists' },
                { status: 400 }
            );
        }

        // Create the student
        const newStudent = await prisma.student.create({
            data: {
                name,
                seatNumber,
                enrollmentNumber,
                classId: parseInt(classId),
            },
        });

        return NextResponse.json(newStudent);
    } catch (error: unknown) {
        const prismaError = error as PrismaError;
        return NextResponse.json(
            { error: prismaError.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT: Update an existing student
export async function PUT(req: Request) {
    

    const { id, name, seatNumber, enrollmentNumber, classId } = await req.json();
    try {
        // Check if the student exists
        const existingStudent = await prisma.student.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingStudent) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Update the student
        const updatedStudent = await prisma.student.update({
            where: { id: parseInt(id) },
            data: {
                name,
                seatNumber,
                enrollmentNumber,
                classId: parseInt(classId),
            },
        });

        return NextResponse.json(updatedStudent);
    } catch (error: unknown) {
        const prismaError = error as PrismaError;
        return NextResponse.json(
            { error: prismaError.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Delete a student
export async function DELETE(req: Request) {
    

    const { id } = await req.json();
    try {
        // Check if the student exists
        const existingStudent = await prisma.student.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingStudent) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Delete the student
        await prisma.student.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: 'Student deleted successfully' });
    } catch (error: unknown) {
        const prismaError = error as PrismaError;
        return NextResponse.json(
            { error: prismaError.message || 'Internal server error' },
            { status: 500 }
        );
    }
}