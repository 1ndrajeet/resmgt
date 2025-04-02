import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface Subject extends RowDataPacket {
  id: number;
  subjectCode: string;
  name: string;
  abbreviation: string;
  assessments: string;
  classId: number;
}   



async function getMarksTableName(classId: number): Promise<string> {
  const result = await query(
    'SELECT department, semester, masterCode FROM class WHERE id = ?',
    [classId]
  ) as RowDataPacket[];
  const classData = result[0] as RowDataPacket;
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
    const subjectsResult = await query(`SELECT * FROM subject WHERE classId = ?`, [classId]) as RowDataPacket[];
    const subjects = subjectsResult as Subject[];
    const parsedSubjects = subjects.map((subject) => ({
      ...subject,
      assessments: JSON.parse(subject.assessments),
    }));

    const marksTableName = await getMarksTableName(parseInt(classId));
    if (studentId) {
      // Fetch marks for a single student
      const studentResult = await query(
        `SELECT s.*, c.department, c.semester, c.masterCode
         FROM student s
         JOIN class c ON s.classId = c.id
         WHERE s.id = ?`,
        [studentId]
      ) as RowDataPacket[];
      const student = studentResult[0] as RowDataPacket;
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

      const marksResult = await query(
        `SELECT * FROM ${marksTableName} WHERE enrollmentNumber = ?`,
        [student.enrollmentNumber]
      ) as RowDataPacket[];
      const marks = marksResult[0] as RowDataPacket;
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
      const studentsResult = await query(
        `SELECT id, enrollmentNumber FROM student WHERE classId = ?`,
        [classId]
      ) as RowDataPacket[];
      const students = studentsResult as RowDataPacket[];
      
      const marksResult = await query(`SELECT * FROM ${marksTableName}`) as RowDataPacket[];
      const marks = marksResult as RowDataPacket[];
      
      const marksByStudent = marks.reduce((acc: { [key: string]: { [key: string]: number } }, row) => {
        const student = students.find(s => s.enrollmentNumber === row.enrollmentNumber);
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
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Save marks for a student
export async function POST(req: Request) {

  const { studentId, classId, marks } = await req.json();
  try {
    const studentResult = await query(
      `SELECT s.*, c.department, c.semester, c.masterCode
       FROM student s
       JOIN class c ON s.classId = c.id
       WHERE s.id = ?`,
      [studentId]
    ) as RowDataPacket[];
    const student = studentResult[0] as RowDataPacket;
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
  } catch (error: unknown) {
    const dbError = error as Error;
    return NextResponse.json(
      { error: dbError.message || 'Internal server error' },
      { status: 500 }
    );
  }
}