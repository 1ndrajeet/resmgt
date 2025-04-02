"use client";
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Class {
  id: number;
  department: string;
  semester: string;
  masterCode: string;
}

interface Student {
  id: number;
  name: string;
  seatNumber: string;
  enrollmentNumber: string;
  classId: number;
  class: Class;
}

interface Subject {
  id: number;
  subjectCode: string;
  name: string;
  abbreviation: string;
  assessments: string[];
}

interface SubjectData {
  id: number;
  subjectCode: string;
  name: string;
  abbreviation: string;
  assessments: string[];
}

interface MarksResponse {
  subjects: SubjectData[];
  marks: { [studentId: string]: { [key: string]: number } };
}

// Assessment max marks mapping
const ASSESSMENT_MAX_MARKS: Record<string, number> = {
  'FA-TH': 30,
  'SA-TH': 70,
  'FA-PR': 50,
  'SA-PR': 50,
  'SLA': 50
};

export default function MarksPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allMarks, setAllMarks] = useState<{ [studentId: string]: { [key: string]: number } }>({}); // Store marks for all students
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    const token = await getToken();
    if (!token) {
      setError('No authentication token found. Please log in.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/classes', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch classes');
      const data = await res.json();
      setClasses(data);
      setError(null);
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(error);
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const fetchClassData = useCallback(async () => {
    setIsLoading(true);
    const token = await getToken();
    if (!token) {
      setError('No authentication token found. Please log in.');
      setIsLoading(false);
      return;
    }

    try {
      // Fetch students
      const studentsRes = await fetch(`/api/students?classId=${selectedClassId}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!studentsRes.ok) throw new Error('Failed to fetch students');
      const studentsData = await studentsRes.json();
      setStudents(studentsData);
      setCurrentStudentIndex(0);

      // Fetch subjects and marks for the class
      const marksRes = await fetch(`/api/marks?classId=${selectedClassId}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!marksRes.ok) throw new Error('Failed to fetch marks data');
      const { subjects, marks } = await marksRes.json() as MarksResponse;

      const parsedSubjects = subjects.map((subject: SubjectData) => ({
        ...subject,
        assessments: Array.isArray(subject.assessments) ? subject.assessments : [],
      }));
      setSubjects(parsedSubjects);

      // Store all marks indexed by studentId
      setAllMarks(marks || {});

      setError(null);
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(error);
      setStudents([]);
      setSubjects([]);
      setAllMarks({});
    } finally {
      setIsLoading(false);
    }
  }, [getToken, selectedClassId]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassData();
    }
  }, [selectedClassId, fetchClassData]);

  // Save marks for the current student
  const handleSaveMarks = async () => {
    setIsLoading(true);
    const token = await getToken();
    if (!token) {
      setError('No authentication token found. Please log in.');
      setIsLoading(false);
      return;
    }

    const currentStudent = students[currentStudentIndex];
    try {
      const currentMarks = allMarks[currentStudent.id.toString()] || {};
      const transformedMarks = Object.keys(currentMarks).reduce((acc, key) => {
        const newKey = key.replace(/-/g, '_');
        acc[newKey] = currentMarks[key];
        return acc;
      }, {} as { [key: string]: number });

      const res = await fetch('/api/marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: currentStudent.id,
          classId: currentStudent.classId,
          marks: transformedMarks,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to save marks for ${currentStudent.name}`);
      }

      setError(null);
      alert(`Marks saved successfully for ${currentStudent.name}`);
      handleNext();
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStudentIndex < students.length - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1);
    }
  };

  const currentStudent = students[currentStudentIndex];
  const currentMarks = currentStudent ? allMarks[currentStudent.id.toString()] || {} : {};

  // Function to validate mark input based on assessment type
  const validateMarkInput = (value: string, assessment: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    const maxMark = ASSESSMENT_MAX_MARKS[assessment] || 100;
    
    if (numValue < 0) return 0;
    if (numValue > maxMark) return maxMark;
    return numValue;
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Enter Marks</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isLoading ? (
            <div className="flex justify-center items-center mt-4">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {!selectedClassId ? (
                <div className="mb-6">
                  <label htmlFor="classSelect" className="block text-sm font-medium mb-2">
                    Select Class
                  </label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.department}-{cls.semester}-{cls.masterCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : students.length === 0 ? (
                <p>No students found for this class.</p>
              ) : (
                <>
                  <div className="mb-6 border-b pb-4">
                    <h3 className="text-xl font-semibold">Student Details</h3>
                    <div className="mt-2 space-y-1">
                      <p><strong>Name:</strong> {currentStudent?.name}</p>
                      <p><strong>Enrollment Number:</strong> {currentStudent?.enrollmentNumber}</p>
                      <p><strong>Seat Number:</strong> {currentStudent?.seatNumber}</p>
                      <p><strong>Class:</strong> {currentStudent?.class.department}-{currentStudent?.class.semester}-{currentStudent?.class.masterCode}</p>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/4">Subject</TableHead>
                        {subjects.length > 0 && subjects[0].assessments.map((assessment) => (
                          <TableHead key={assessment} className="text-center">
                            {assessment} (Max: {ASSESSMENT_MAX_MARKS[assessment] || 100})
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell>{subject.name} ({subject.abbreviation})</TableCell>
                          {subject.assessments.map((assessment) => (
                            <TableCell key={assessment} className="text-center">
                              <Input
                                type="number"
                                value={currentMarks[`${subject.abbreviation}_${assessment}`] || ''}
                                onChange={(e) => {
                                  const validatedValue = validateMarkInput(e.target.value, assessment);
                                  setAllMarks({
                                    ...allMarks,
                                    [currentStudent.id.toString()]: {
                                      ...currentMarks,
                                      [`${subject.abbreviation}_${assessment}`]: validatedValue,
                                    },
                                  });
                                }}
                                min={0}
                                max={ASSESSMENT_MAX_MARKS[assessment] || 70}
                                className="w-20 mx-auto"
                                placeholder="0"
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-between mt-6">
                    <Button
                      onClick={handlePrevious}
                      disabled={currentStudentIndex === 0}
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <div className="space-x-2">
                      <Button onClick={handleSaveMarks} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                      </Button>
                      {currentStudentIndex < students.length - 1 ? (
                        <Button onClick={handleNext}>Next</Button>
                      ) : (
                        <Button
                          onClick={() => setSelectedClassId('')}
                          variant="secondary"
                        >
                          Finish
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}