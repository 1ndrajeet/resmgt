"use client";
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@clerk/nextjs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Student {
  id: number;
  name: string;
  seatNumber: string;
  enrollmentNumber: string;
  classId: number;
  class: { department: string; semester: string; masterCode: string };
}

interface Class {
  id: number;
  department: string;
  semester: string;
  masterCode: string;
}

export default function StudentsPage() {
  const [name, setName] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  const { getToken } = useAuth();

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    const token = await getToken();
    if (!token) {
      setError('No authentication token found. Please log in.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/students', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Failed to fetch students: ${errorData.error || res.statusText}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Expected an array from API, but got something else');
      }

      setStudents(data);
      setError(null);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const fetchClasses = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

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
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    }
  }, [getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const token = await getToken();
    if (!token) {
      setError('No authentication token found. Please log in.');
      setIsLoading(false);
      return;
    }

    try {
      const url = currentStudent ? `/api/students/${currentStudent.id}` : '/api/students';
      const method = currentStudent ? 'PUT' : 'POST';
      const body = currentStudent
        ? { id: currentStudent.id, name, seatNumber, enrollmentNumber, classId }
        : { name, seatNumber, enrollmentNumber, classId };

      const res = await fetch(url, {
        method,
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save student');
      }

      setName('');
      setSeatNumber('');
      setEnrollmentNumber('');
      setClassId('');
      setCurrentStudent(null);
      setIsDialogOpen(false);
      fetchStudents();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (student: Student) => {
    setName(student.name);
    setSeatNumber(student.seatNumber);
    setEnrollmentNumber(student.enrollmentNumber);
    setClassId(student.classId.toString());
    setCurrentStudent(student);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    const token = await getToken();
    if (!token) {
      setError('No authentication token found. Please log in.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/students', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete student');
      }

      fetchStudents();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, [fetchClasses, fetchStudents]);

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button onClick={() => setIsDialogOpen(true)}>Add New Student</Button>
          {isLoading ? (
            <div className="flex justify-center items-center mt-4">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Seat Number</TableHead>
                  <TableHead>Enrollment Number</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.seatNumber}</TableCell>
                    <TableCell>{student.enrollmentNumber}</TableCell>
                    <TableCell>
                      {student.class.department}-{student.class.semester}-{student.class.masterCode}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" onClick={() => handleEdit(student)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setStudentToDelete(student.id);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John Doe"
              />
            </div>
            <div>
              <label htmlFor="seatNumber" className="block text-sm font-medium">
                Seat Number
              </label>
              <Input
                id="seatNumber"
                value={seatNumber}
                onChange={(e) => setSeatNumber(e.target.value)}
                placeholder="e.g., 12345"
              />
            </div>
            <div>
              <label htmlFor="enrollmentNumber" className="block text-sm font-medium">
                Enrollment Number
              </label>
              <Input
                id="enrollmentNumber"
                value={enrollmentNumber}
                onChange={(e) => setEnrollmentNumber(e.target.value)}
                placeholder="e.g., 2023001"
              />
            </div>
            <div>
              <label htmlFor="classId" className="block text-sm font-medium">
                Class
              </label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : currentStudent ? 'Update' : 'Add'} Student
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (studentToDelete) {
                  handleDelete(studentToDelete);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}