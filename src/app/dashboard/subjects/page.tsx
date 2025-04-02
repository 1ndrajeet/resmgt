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
import { Checkbox } from '@/components/ui/checkbox';
import { ApiError, FetchError } from '@/lib/types';

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

  const fetchSubjects = useCallback(async () => {
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
    } catch (err: unknown) {
      const error = err as Error | ApiError | FetchError;
      setError(error.message);
      setSubjects([]);
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
      const error = err as Error | ApiError | FetchError;
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
    } catch (err: unknown) {
        const error = err as Error | ApiError | FetchError;
        setError(error.message);
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
    } catch (err: unknown) {
      const error = err as Error | ApiError | FetchError;
      setError(error.message);
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, [fetchClasses, fetchSubjects]);

  const handleAssessmentToggle = (assessment: string) => {
    if (assessments.includes(assessment)) {
      setAssessments(assessments.filter(a => a !== assessment));
    } else {
      setAssessments(prev => {
        // Create a new array with the assessment added
        const newAssessments = [...prev, assessment];
        
        // Define the order of assessments
        const assessmentOrder = ['FA-TH', 'SA-TH', 'FA-PR', 'SA-PR', 'SLA'];
        
        // Sort the assessments according to the defined order
        return newAssessments.sort((a, b) => {
          return assessmentOrder.indexOf(a) - assessmentOrder.indexOf(b);
        });
      });
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
              <label className="block text-sm font-medium mb-2">
                Assessments
              </label>
              <div className="space-y-2 flex items-center justify-center gap-6">
                <div className="flex items-center space-x-0.5">
                  <Checkbox 
                    id="FA-TH" 
                    checked={assessments.includes('FA-TH')} 
                    onCheckedChange={() => handleAssessmentToggle('FA-TH')}
                  />
                  <label htmlFor="FA-TH" className="text-sm">FA-TH</label>
                </div>
                <div className="flex items-center space-x-0.5">
                  <Checkbox 
                    id="SA-TH" 
                    checked={assessments.includes('SA-TH')} 
                    onCheckedChange={() => handleAssessmentToggle('SA-TH')}
                  />
                  <label htmlFor="SA-TH" className="text-sm">SA-TH</label>
                </div>
                <div className="flex items-center space-x-0.5">
                  <Checkbox 
                    id="FA-PR" 
                    checked={assessments.includes('FA-PR')} 
                    onCheckedChange={() => handleAssessmentToggle('FA-PR')}
                  />
                  <label htmlFor="FA-PR" className="text-sm">FA-PR</label>
                </div>
                <div className="flex items-center space-x-0.5">
                  <Checkbox 
                    id="SA-PR" 
                    checked={assessments.includes('SA-PR')} 
                    onCheckedChange={() => handleAssessmentToggle('SA-PR')}
                  />
                  <label htmlFor="SA-PR" className="text-sm">SA-PR</label>
                </div>
                <div className="flex items-center space-x-0.5">
                  <Checkbox 
                    id="SLA" 
                    checked={assessments.includes('SLA')} 
                    onCheckedChange={() => handleAssessmentToggle('SLA')}
                  />
                  <label htmlFor="SLA" className="text-sm">SLA</label>
                </div>
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