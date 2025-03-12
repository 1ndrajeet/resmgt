import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { query } from '@/lib/db';

const prisma = new PrismaClient();

async function getMarksTableName(classId: number): Promise<string> {
  const [classData] = await query(
    'SELECT department, semester, masterCode FROM class WHERE id = ?',
    [classId]
  );
  if (!classData) throw new Error('Class not found');
  return `marks_${classData.department.toLowerCase()}_${classData.semester.toLowerCase()}_${classData.masterCode.toLowerCase()}`.replace(/-/g, '_');
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId');

  if (!classId) {
    return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
  }

  try {
    const classData = await prisma.class.findUnique({
      where: { id: parseInt(classId) },
      include: { students: true, subjects: true },
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const subjects = classData.subjects.map((subject) => ({
      code: subject.subjectCode,
      name: subject.name,
      abbr: subject.abbreviation,
      assessments: Array.isArray(subject.assessments) ? subject.assessments : JSON.parse(subject.assessments || '[]'),
    }));

    const marksTableName = await getMarksTableName(parseInt(classId));
    const marks = await query(`SELECT * FROM ${marksTableName}`);

    const report = {
      class: {
        id: classData.id,
        department: classData.department,
        semester: classData.semester,
        masterCode: classData.masterCode,
        totalStudents: classData.students.length,
      },
      subjects: subjects,
      students: classData.students.map((student) => {
        const studentMarks = marks.find((m: any) => m.enrollmentNumber === student.enrollmentNumber) || {};
        const formattedMarks = subjects.reduce((acc, subject) => {
          acc[subject.abbr] = subject.assessments.reduce((markAcc, assessment) => {
            const columnName = `${subject.abbr}_${assessment.replace(/-/g, '_')}`;
            markAcc[assessment] = studentMarks[columnName] || null;
            return markAcc;
          }, {} as { [key: string]: number | null });
          return acc;
        }, {} as { [key: string]: { [key: string]: number | null } });

        return {
          id: student.id,
          name: student.name,
          enrollment: student.enrollmentNumber,
          seat: student.seatNumber,
          marks: formattedMarks,
        };
      }),
    };

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}