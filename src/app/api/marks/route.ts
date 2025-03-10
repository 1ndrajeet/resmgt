import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { query, execute } from '@/lib/db';

async function getMarksTableName(classId: number): Promise<string> {
  const [classData] = await query(
    'SELECT department, semester, masterCode FROM class WHERE id = ?',
    [classId]
  );
  if (!classData) throw new Error('Class not found');
  return `marks_${classData.department.toLowerCase()}_${classData.semester.toLowerCase()}_${classData.masterCode.toLowerCase()}`.replace(/-/g, '_');
}

// GET: Fetch marks for a class or a specific student
export async function GET(req: Request) {

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const classId = searchParams.get('classId');

  if (!classId) return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });

  try {
    const subjects = await query(`SELECT * FROM subject WHERE classId = ?`, [classId]);
    const parsedSubjects = subjects.map((subject: any) => ({
      ...subject,
      assessments: JSON.parse(subject.assessments),
    }));

    const marksTableName = await getMarksTableName(parseInt(classId));
    if (studentId) {
      // Fetch marks for a single student (optional compatibility)
      const [student] = await query(
        `SELECT s.*, c.department, c.semester, c.masterCode
         FROM student s
         JOIN class c ON s.classId = c.id
         WHERE s.id = ?`,
        [studentId]
      );
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

      const [marks] = await query(
        `SELECT * FROM ${marksTableName} WHERE enrollmentNumber = ?`,
        [student.enrollmentNumber]
      );
      const marksData = marks || {};
      const formattedMarks = Object.keys(marksData).reduce((acc, key) => {
        if (!['id', 'enrollmentNumber', 'seatNumber', 'name'].includes(key)) {
          acc[key.replace(/_/g, '-')] = marksData[key];
        }
        return acc;
      }, {} as { [key: string]: number });

      return NextResponse.json({ subjects: parsedSubjects, marks: formattedMarks });
    } else {
      // Fetch marks for all students in the class
      const students = await query(
        `SELECT id, enrollmentNumber FROM student WHERE classId = ?`,
        [classId]
      );
      const marks = await query(`SELECT * FROM ${marksTableName}`);
      const marksByStudent = marks.reduce((acc: { [key: string]: { [key: string]: number } }, row: any) => {
        const student = students.find((s: any) => s.enrollmentNumber === row.enrollmentNumber);
        if (student) {
          acc[student.id] = Object.keys(row).reduce((markAcc, key) => {
            if (!['id', 'enrollmentNumber', 'seatNumber', 'name'].includes(key)) {
              markAcc[key.replace(/_/g, '-')] = row[key];
            }
            return markAcc;
          }, {} as { [key: string]: number });
        }
        return acc;
      }, {});

      return NextResponse.json({ subjects: parsedSubjects, marks: marksByStudent });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Save marks for a student
export async function POST(req: Request) {

  const { studentId, classId, marks } = await req.json();
  try {
    const [student] = await query(
      `SELECT s.*, c.department, c.semester, c.masterCode
       FROM student s
       JOIN class c ON s.classId = c.id
       WHERE s.id = ?`,
      [studentId]
    );
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const marksTableName = await getMarksTableName(classId);
    const markColumns = Object.keys(marks).filter(key => !['enrollmentNumber', 'seatNumber', 'name'].includes(key));
    const markValues = markColumns.map(key => marks[key]);

    const insertColumns = ['enrollmentNumber', 'seatNumber', 'name', ...markColumns];
    const insertPlaceholders = insertColumns.map(() => '?').join(', ');
    const updateClause = markColumns.map(col => `${col} = VALUES(${col})`).join(', ');

    await execute(
      `INSERT INTO ${marksTableName} (${insertColumns.join(', ')})
       VALUES (${insertPlaceholders})
       ON DUPLICATE KEY UPDATE ${updateClause}`,
      [student.enrollmentNumber, student.seatNumber, student.name, ...markValues]
    );

    return NextResponse.json({ message: 'Marks saved successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}