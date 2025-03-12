'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Class {
  id: number;
  department: string;
  semester: string;
  masterCode: string;
}

interface ReportData {
  class: {
    id: number;
    department: string;
    semester: string;
    masterCode: string;
    totalStudents: number;
  };
  subjects: {
    code: string;
    name: string;
    abbr: string;
    assessments: string[];
  }[];
  students: {
    id: number;
    name: string;
    enrollment: string;
    seat: string;
    marks: {
      [subjectAbbr: string]: {
        [assessment: string]: number | null;
      };
    };
  }[];
}

const PAGE_STYLE: React.CSSProperties = {
  pageBreakAfter: 'always',
  height: '210mm',
  width: '297mm',
  margin: '0 auto',
  marginBlockEnd: '8px',
};

const ReportPage = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes');
        const data = await res.json();
        setClasses(data);
        if (data.length > 0) setSelectedClassId(data[0].id.toString());
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;

    const fetchReportData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/report?classId=${selectedClassId}`);
        const data = await res.json();
        setReportData(data);
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [selectedClassId]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    pageStyle: `
      @page {
        size: A4 landscape;
      }
      @media print {
        .print-table {
          width: 100%;
          font-size: 8px;
        }
        .page-break {
          page-break-before: always;
        }
      }
    `,
  });

  const calculateTotals = (marks: { [assessment: string]: number | null }, assessments: string[]) => {
    const faTh = assessments.includes('FA-TH') ? (marks['FA-TH'] || 0) : 0;
    const saTh = assessments.includes('SA-TH') ? (marks['SA-TH'] || 0) : 0;
    const faPr = assessments.includes('FA-PR') ? (marks['FA-PR'] || 0) : 0;
    const saPr = assessments.includes('SA-PR') ? (marks['SA-PR'] || 0) : 0;
    return {
      thTotal: faTh + saTh,
      prTotal: faPr + saPr,
      overallTotal: faTh + saTh + faPr + saPr,
    };
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <Select onValueChange={setSelectedClassId} value={selectedClassId || ''}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id.toString()}>
                {cls.department} - {cls.semester} - {cls.masterCode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => handlePrint()} className="ml-4" disabled={!reportData}>
          Print Report
        </Button>
      </div>

      {reportData ? (
        <div ref={componentRef}>
          <div style={PAGE_STYLE} className="border border-black rounded">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold">Premalatai Chavan Polytechnic Karad</h1>
              <p>
                Class: {reportData.class.department} - Semester {reportData.class.semester} - Master Code:{' '}
                {reportData.class.masterCode}
              </p>
            </div>
            <Table className="print-table border">
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="border">Name</TableHead>
                  <TableHead rowSpan={2} className="border">Enroll</TableHead>
                  {reportData.subjects.map((subject) => (
                    <TableHead
                      key={subject.abbr}
                      colSpan={subject.assessments.length + Math.floor(subject.assessments.length / 2)}
                      className="border text-center"
                    >
                      {subject.name}-({subject.abbr})
                    </TableHead>
                  ))}
                  <TableHead rowSpan={2} className="border">TOTAL</TableHead>
                  <TableHead rowSpan={2} className="border">PERCENTAGE</TableHead>
                  <TableHead rowSpan={2} className="border">CLASS</TableHead>
                </TableRow>
                <TableRow>
                  {reportData.subjects.map((subject) => (
                    <React.Fragment key={subject.abbr}>
                      {subject.assessments.map((assessment, index) => (
                        <React.Fragment key={assessment}>
                          <TableHead className="border">{assessment}</TableHead>
                          {index % 2 === 1 && <TableHead className="border">Total</TableHead>}
                        </React.Fragment>
                      ))}
                      {subject.assessments.length % 2 === 1 && <TableHead className="border">Total</TableHead>}
                    </React.Fragment>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.students.map((student) => {
                  const overallTotals = reportData.subjects.reduce(
                    (acc, subject) => {
                      const totals = calculateTotals(student.marks[subject.abbr] || {}, subject.assessments);
                      acc.overallTotal += totals.overallTotal;
                      return acc;
                    },
                    { overallTotal: 0 }
                  );
                  const maxMarks = reportData.subjects.reduce(
                    (acc, subj) => acc + (subj.assessments.length * 50), // Assuming 50 per assessment
                    0
                  );
                  const percentage = ((overallTotals.overallTotal / maxMarks) * 100).toFixed(2);
                  const classRank = Number(percentage) >= 60 ? 'FIRST CLASS' : 'SECOND CLASS';

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="border">{student.name}</TableCell>
                      <TableCell className="border">{student.enrollment}</TableCell>
                      {reportData.subjects.map((subject) => {
                        const marks = student.marks[subject.abbr] || {};
                        const totals = calculateTotals(marks, subject.assessments);
                        return (
                          <React.Fragment key={subject.abbr}>
                            {subject.assessments.map((assessment, index) => (
                              <React.Fragment key={assessment}>
                                <TableCell className="border">{marks[assessment] ?? '-'}</TableCell>
                                {index % 2 === 1 && (
                                  <TableCell className="border">
                                    {assessment.includes('TH')
                                      ? totals.thTotal
                                      : assessment.includes('PR')
                                        ? totals.prTotal
                                        : '-'}
                                  </TableCell>
                                )}
                              </React.Fragment>
                            ))}
                            {subject.assessments.length % 2 === 1 && (
                              <TableCell className="border">
                                {subject.assessments.some((a) => a.includes('TH')) ? totals.thTotal : totals.prTotal}
                              </TableCell>
                            )}
                          </React.Fragment>
                        );
                      })}
                      <TableCell className="border">{overallTotals.overallTotal}</TableCell>
                      <TableCell className="border">{percentage}%</TableCell>
                      <TableCell className="border">{classRank}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div>No report data available</div>
      )}
    </div>
  );
};

export default ReportPage;