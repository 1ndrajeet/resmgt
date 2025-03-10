"use client";
import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react'; // Loading spinner
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // Delete confirmation dialog

interface Class {
  id: number;
  department: string;
  semester: string;
  masterCode: string;
}

export default function ClassesPage() {
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [masterCode, setMasterCode] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<number | null>(null);
  const { getToken } = useAuth();

  const departments = [
    { value: 'CO', label: 'Computer Engineering' },
    { value: 'EE', label: 'Electrical Engineering' },
    { value: 'CE', label: 'Civil Engineering' },
    { value: 'ME', label: 'Mechanical Engineering' },
    { value: 'AA', label: 'Architecture Assessment' },
  ];

  const semesters = [
    { value: '1', label: 'First' },
    { value: '2', label: 'Second' },
    { value: '3', label: 'Third' },
    { value: '4', label: 'Fourth' },
    { value: '5', label: 'Fifth' },
    { value: '6', label: 'Sixth' },
  ];

  const masterCodes = ['K', 'I'];

  const fetchClasses = async () => {
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Failed to fetch classes: ${errorData.error || res.statusText}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Expected an array from API, but got something else');
      }

      setClasses(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

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
      const url = currentClass ? `/api/classes/${currentClass.id}` : '/api/classes';
      const method = currentClass ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: JSON.stringify({ department, semester, masterCode }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to save class');
      }

      setDepartment('');
      setSemester('');
      setMasterCode('');
      setCurrentClass(null);
      setIsDialogOpen(false);
      fetchClasses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (cls: Class) => {
    setDepartment(cls.department);
    setSemester(cls.semester);
    setMasterCode(cls.masterCode);
    setCurrentClass(cls);
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
      const res = await fetch(`/api/classes`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }), // Send the ID in the request body
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete class');
      }

      // Refresh the list of classes after successful deletion
      fetchClasses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button onClick={() => setIsDialogOpen(true)}>Add New Class</Button>
          {isLoading ? (
            <div className="flex justify-center items-center mt-4">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Master Code</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell>{cls.department}</TableCell>
                    <TableCell>{cls.semester}</TableCell>
                    <TableCell>{cls.masterCode}</TableCell>
                    <TableCell>
                      <Button variant="ghost" onClick={() => handleEdit(cls)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setClassToDelete(cls.id);
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
            <DialogTitle>{currentClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="department" className="block text-sm font-medium">
                Department
              </label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="semester" className="block text-sm font-medium">
                Semester
              </label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((sem) => (
                    <SelectItem key={sem.value} value={sem.value}>
                      {sem.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="masterCode" className="block text-sm font-medium">
                Master Code
              </label>
              <Select value={masterCode} onValueChange={setMasterCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Master Code" />
                </SelectTrigger>
                <SelectContent>
                  {masterCodes.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : currentClass ? 'Update' : 'Add'} Class
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the class.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (classToDelete) {
                  handleDelete(classToDelete);
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