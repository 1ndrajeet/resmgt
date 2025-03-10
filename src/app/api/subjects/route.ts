import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

import { pool } from '@/lib/db';

import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

async function getClassTableName(classId: number): Promise<string> {
    const classData = await prisma.class.findUnique({
        where: { id: classId },
    });
    if (!classData) throw new Error('Class not found');
    return `marks_${classData.department.toLowerCase()}_${classData.semester.toLowerCase()}_${classData.masterCode.toLowerCase()}`.replace(/-/g, '_');
}
async function createOrUpdateMarksTable(classId: number, subjectCode: string, assessments: string[]) {
    try {
        const tableName = await getClassTableName(classId);
        console.log('Generated Table Name:', tableName); // Debugging

        const [tableExists] = await pool.query(`SHOW TABLES LIKE ?`, [tableName]);
        console.log('Table Exists:', tableExists); // Debugging

        if ((tableExists as any[]).length === 0) {
            await pool.query(`
                CREATE TABLE ${tableName} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    enrollmentNumber VARCHAR(255) NOT NULL UNIQUE,
                    seatNumber VARCHAR(255) NOT NULL UNIQUE,
                    name VARCHAR(255) NOT NULL
                )
            `);
            console.log('Table Created Successfully');
        }

        const [columns] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
        const existingColumns = (columns as any[]).map(col => col.Field);
        console.log('Existing Columns:', existingColumns);

        for (const assessment of assessments) {
            const columnName = `${subjectCode}_${assessment.replace(/-/g, '_')}`;
            if (!existingColumns.includes(columnName)) {
                await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} INT DEFAULT NULL`);
                console.log('Column Added:', columnName);
            }
        }
    } catch (error) {
        console.error('Error in createOrUpdateMarksTable:', error);
        throw error;
    }
}

async function removeSubjectColumns(classId: number, subjectCode: string, assessments: string[]) {
    try {
        const tableName = await getClassTableName(classId);
        console.log('Generated Table Name:', tableName);

        const [columns] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
        const existingColumns = (columns as any[]).map(col => col.Field);
        console.log('Existing Columns:', existingColumns);

        for (const assessment of assessments) {
            const columnName = `${subjectCode}_${assessment.replace(/-/g, '_')}`;
            if (existingColumns.includes(columnName)) {
                await pool.query(`ALTER TABLE ${tableName} DROP COLUMN ${columnName}`);
                console.log('Column Dropped:', columnName);
            }
        }
    } catch (error) {
        console.error('Error in removeSubjectColumns:', error);
        throw error;
    }
}


export async function POST(req: Request) {
    

    const { subjectCode, name, abbreviation, classId, assessments } = await req.json();
    try {
        // Check if a subject with the same subjectCode already exists
        const existingSubject = await prisma.subject.findUnique({
            where: { subjectCode },
        });

        if (existingSubject) {
            return NextResponse.json(
                { error: `Subject with code '${subjectCode}' already exists` },
                { status: 400 }
            );
        }

        // Create the subject
        const newSubject = await prisma.subject.create({
            data: {
                subjectCode,
                name,
                abbreviation,
                classId: parseInt(classId),
                assessments: JSON.parse(assessments), // Expecting a JSON string from the client
            },
        });

        // Create or update the marks table
        await createOrUpdateMarksTable(parseInt(classId), abbreviation, JSON.parse(assessments));

        return NextResponse.json(newSubject);
    } catch (error: any) {
        console.error('Error in POST /api/subjects:', error); // Debugging
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function GET(req: Request) {
    

    try {
        const subjects = await prisma.subject.findMany({
            include: { class: true },
        });
        return NextResponse.json(subjects);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    

    const { id, subjectCode, name, abbreviation, classId, assessments } = await req.json();
    try {
        // Fetch the existing subject to compare assessments
        const existingSubject = await prisma.subject.findUnique({
            where: { id: parseInt(id) },
        });
        if (!existingSubject) throw new Error('Subject not found');

        // Update the subject
        const updatedSubject = await prisma.subject.update({
            where: { id: parseInt(id) },
            data: {
                subjectCode,
                name,
                abbreviation,
                classId: parseInt(classId),
                assessments: JSON.parse(assessments),
            },
        });

        // Update the marks table
        const oldAssessments = existingSubject.assessments as string[];
        const newAssessments = JSON.parse(assessments) as string[];

        // Remove old columns if assessments changed
        if (existingSubject.subjectCode !== subjectCode || existingSubject.classId !== parseInt(classId)) {
            await removeSubjectColumns(existingSubject.classId, existingSubject.subjectCode, oldAssessments);
        }
        await createOrUpdateMarksTable(parseInt(classId), abbreviation, newAssessments);

        return NextResponse.json(updatedSubject);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    

    try {
        const { id } = await req.json();
        if (!id) {
            return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
        }

        const existingSubject = await prisma.subject.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingSubject) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }

        // Remove subject columns from the marks table
        await removeSubjectColumns(existingSubject.classId, existingSubject.subjectCode, existingSubject.assessments as string[]);

        // Delete the subject
        await prisma.subject.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: 'Subject deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}