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

interface Subject {
  id: number;
  subjectCode: string;
  name: string;
  abbreviation: string;
  classId: number;
  class: { department: string; semester: string; masterCode: string };
  assessments: string[];
}

interface Class {
  id: number;
  department: string;
  semester: string;
  masterCode: string;
}

export default function SubjectsPage() {
  const [subjectCode, setSubjectCode] = useState('');
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [classId, setClassId] = useState('');
  const [assessments, setAssessments] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<number | null>(null);
  const { getToken } = useAuth();

  const fetchSubjects = async () => {
    setIsLoading(true);
    const token = await getToken();
    if (!token) {
      setError('No authentication token found. Please log in.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/subjects', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Failed to fetch subjects: ${errorData.error || res.statusText}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Expected an array from API, but got something else');
      }

      setSubjects(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
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
    } catch (err: any) {
      setError(err.message);
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
        // Determine the URL and method based on whether we're editing or creating a subject
        const url = currentSubject ? `/api/subjects/${currentSubject.id}` : '/api/subjects';
        const method = currentSubject ? 'PUT' : 'POST';

        // Prepare the request body
        const body = currentSubject
            ? { id: currentSubject.id, subjectCode, name, abbreviation, classId, assessments: JSON.stringify(assessments) }
            : { subjectCode, name, abbreviation, classId, assessments: JSON.stringify(assessments) };

        // Send the request to create or update the subject
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
            throw new Error(errorData.error || 'Failed to save subject');
        }

        // Reset the form fields and close the dialog
        setSubjectCode('');
        setName('');
        setAbbreviation('');
        setClassId('');
        setAssessments([]);
        setCurrentSubject(null);
        setIsDialogOpen(false);

        // Refresh the list of subjects
        fetchSubjects();
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
};

  const handleEdit = (subject: Subject) => {
    setSubjectCode(subject.subjectCode);
    setName(subject.name);
    setAbbreviation(subject.abbreviation);
    setClassId(subject.classId.toString());
    setAssessments(subject.assessments);
    setCurrentSubject(subject);
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
      const res = await fetch('/api/subjects', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete subject');
      }

      fetchSubjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  const handleAddAssessment = (value: string) => {
    if (value && !assessments.includes(value)) {
      setAssessments([...assessments, value]);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button onClick={() => setIsDialogOpen(true)}>Add New Subject</Button>
          {isLoading ? (
            <div className="flex justify-center items-center mt-4">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Abbreviation</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Assessments</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell>{subject.subjectCode}</TableCell>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell>{subject.abbreviation}</TableCell>
                    <TableCell>
                      {subject.class.department}-{subject.class.semester}-{subject.class.masterCode}
                    </TableCell>
                    <TableCell>{subject.assessments.join(', ')}</TableCell>
                    <TableCell>
                      <Button variant="ghost" onClick={() => handleEdit(subject)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSubjectToDelete(subject.id);
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
            <DialogTitle>{currentSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="subjectCode" className="block text-sm font-medium">
                Subject Code
              </label>
              <Input
                id="subjectCode"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="e.g., 22516"
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Data Structures using C"
              />
            </div>
            <div>
              <label htmlFor="abbreviation" className="block text-sm font-medium">
                Abbreviation
              </label>
              <Input
                id="abbreviation"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                placeholder="e.g., DSU"
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
            <div>
              <label htmlFor="assessments" className="block text-sm font-medium">
                Assessments (select multiple)
              </label>
              <Select
                onValueChange={handleAddAssessment}
                value="" // Reset after selection
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add Assessment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FA-TH">FA-TH</SelectItem>
                  <SelectItem value="SA-TH">SA-TH</SelectItem>
                  <SelectItem value="FA-PR">FA-PR</SelectItem>
                  <SelectItem value="SA-PR">SA-PR</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2">
                {assessments.map((assess, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm mr-2 mb-2"
                  >
                    {assess}
                    <button
                      type="button"
                      onClick={() => setAssessments(assessments.filter((a) => a !== assess))}
                      className="ml-2 text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : currentSubject ? 'Update' : 'Add'} Subject
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subject.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (subjectToDelete) {
                  handleDelete(subjectToDelete);
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