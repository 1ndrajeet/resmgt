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

const SummaryStats = ({ reportData }: { reportData: ReportData | null }) => {
  if (!reportData) return null;

  const calculateSubjectStats = (subjectAbbr: string, assessments: string[]) => {
    // Calculate total marks for TH, PR, and SLA separately
    const thTotals = reportData.students.map(student => {
      const marks = student.marks[subjectAbbr] || {};
      return assessments
        .filter(assessment => assessment.includes('TH'))
        .reduce((sum, assessment) => sum + (marks[assessment] || 0), 0);
    });

    const prTotals = reportData.students.map(student => {
      const marks = student.marks[subjectAbbr] || {};
      return assessments
        .filter(assessment => assessment.includes('PR'))
        .reduce((sum, assessment) => sum + (marks[assessment] || 0), 0);
    });


    // Appeared: Students with at least one non-null mark
    const appeared = reportData.students.filter(student =>
      Object.values(student.marks[subjectAbbr] || {}).some(mark => mark !== null)
    ).length;

    // Min and Max of TH and PR totals
    const thMin = appeared > 0 ? Math.min(...thTotals.filter(total => total > 0)) : 0;
    const thMax = appeared > 0 ? Math.max(...thTotals) : 0;
    const prMin = appeared > 0 ? Math.min(...prTotals.filter(total => total > 0)) : 0;
    const prMax = appeared > 0 ? Math.max(...prTotals) : 0;


    // Passed: Students with total marks >= 40% of maximum possible marks
    const maxPossibleMarks = assessments.length * 50; // Assuming each assessment is out of 50
    const passThreshold = maxPossibleMarks * 0.4;
    
    const passed = reportData.students.filter(student => {
      const marks = student.marks[subjectAbbr] || {};
      const total = assessments.reduce((sum, assessment) => sum + (marks[assessment] || 0), 0);
      return total >= passThreshold;
    }).length;

    // 60% and above: Students with total marks >= 60% of maximum possible marks
    const sixtyPercentThreshold = maxPossibleMarks * 0.6;
    
    const sixtyPercentAndAbove = reportData.students.filter(student => {
      const marks = student.marks[subjectAbbr] || {};
      const total = assessments.reduce((sum, assessment) => sum + (marks[assessment] || 0), 0);
      return total >= sixtyPercentThreshold;
    }).length;

    return {
      thMin,
      thMax,
      prMin,
      prMax,
      appeared,
      passed,
      passPercentage: appeared > 0 ? (passed / appeared * 100) : 0,
      sixtyPercentPercentage: appeared > 0 ? (sixtyPercentAndAbove / appeared * 100) : 0,
    };
  };

  const summaryData = reportData.subjects.map(subject => ({
    name: subject.name,
    abbr: subject.abbr,
    stats: calculateSubjectStats(subject.abbr, subject.assessments),
  }));

  return (
    <div style={{ marginTop: '20px', fontSize: '10px' }} className="border border-black rounded">
      <Table className="print-table border">
        <TableHeader>
          <TableRow>
            <TableHead className="border">Parameter</TableHead>
            {reportData.subjects.map((subject) => (
              <React.Fragment key={subject.abbr}>
                <TableHead colSpan={2} className="border text-center">
                  {subject.name} ({subject.abbr})
                </TableHead>
              </React.Fragment>
            ))}
          </TableRow>
          <TableRow>
            <TableHead className="border"></TableHead>
            {reportData.subjects.map((subject) => (
              <React.Fragment key={subject.abbr}>
                <TableHead className="border text-center">TH</TableHead>
                <TableHead className="border text-center">PR</TableHead>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="border font-medium">min</TableCell>
            {summaryData.map((subject) => (
              <React.Fragment key={subject.abbr}>
                <TableCell className="border text-center">{subject.stats.thMin}</TableCell>
                <TableCell className="border text-center">{subject.stats.prMin}</TableCell>
              </React.Fragment>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="border font-medium">max</TableCell>
            {summaryData.map((subject) => (
              <React.Fragment key={subject.abbr}>
                <TableCell className="border text-center">{subject.stats.thMax}</TableCell>
                <TableCell className="border text-center">{subject.stats.prMax}</TableCell>
              </React.Fragment>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="border font-medium">Appeared</TableCell>
            {summaryData.map((subject) => (
              <React.Fragment key={subject.abbr}>
                <TableCell className="border text-center">{subject.stats.appeared}</TableCell>
                <TableCell className="border text-center">{subject.stats.appeared}</TableCell>
              </React.Fragment>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="border font-medium">Passed</TableCell>
            {summaryData.map((subject) => (
              <React.Fragment key={subject.abbr}>
                <TableCell className="border text-center">{subject.stats.passed}</TableCell>
                <TableCell className="border text-center">{subject.stats.passed}</TableCell>
              </React.Fragment>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="border font-medium">%pass</TableCell>
            {summaryData.map((subject) => (
              <React.Fragment key={subject.abbr}>
                <TableCell className="border text-center">{subject.stats.passPercentage.toFixed(2)}</TableCell>
                <TableCell className="border text-center">{subject.stats.passPercentage.toFixed(2)}</TableCell>
              </React.Fragment>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="border font-medium">60%above</TableCell>
            {summaryData.map((subject) => (
              <React.Fragment key={subject.abbr}>
                <TableCell className="border text-center">{subject.stats.sixtyPercentPercentage.toFixed(2)}</TableCell>
                <TableCell className="border text-center">{subject.stats.sixtyPercentPercentage.toFixed(2)}</TableCell>
              </React.Fragment>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
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
    const thAssessments = assessments.filter(a => a.includes('TH'));
    const prAssessments = assessments.filter(a => a.includes('PR'));
    const slaAssessments = assessments.filter(a => a.includes('SLA'));
    
    const thTotal = thAssessments.reduce((sum, assessment) => sum + (marks[assessment] || 0), 0);
    const prTotal = prAssessments.reduce((sum, assessment) => sum + (marks[assessment] || 0), 0);
    const slaTotal = slaAssessments.reduce((sum, assessment) => sum + (marks[assessment] || 0), 0);
    
    return {
      thTotal,
      prTotal,
      slaTotal,
      overallTotal: thTotal + prTotal + slaTotal,
    };
  };

  const isSubjectFailed = (marks: { [assessment: string]: number | null }, assessments: string[]) => {
    const totals = calculateTotals(marks, assessments);
    const maxPossibleMarks = assessments.length * 50; // Assuming each assessment is out of 50
    return (totals.overallTotal / maxPossibleMarks) * 100 < 40;
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
              <h1 className="text-xl font-bold">SMT. PREMALATAI CHAVAN POLYTECHNIC, KARAD</h1>
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
                      colSpan={subject.assessments.length + 3} // +3 for TH Total, PR Total, SLA Total
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
                  {reportData.subjects.map((subject) => {
                    const hasTheory = subject.assessments.some(a => a.includes('TH'));
                    const hasPractical = subject.assessments.some(a => a.includes('PR'));
                    const hasSLA = subject.assessments.some(a => a.includes('SLA'));
                    
                    return (
                      <React.Fragment key={subject.abbr}>
                        {/* Theory assessments */}
                        {subject.assessments.filter(a => a.includes('TH')).map(assessment => (
                          <TableHead key={assessment} className="border">{assessment}</TableHead>
                        ))}
                        {hasTheory && <TableHead className="border">Total</TableHead>}
                        
                        {/* Practical assessments */}
                        {subject.assessments.filter(a => a.includes('PR')).map(assessment => (
                          <TableHead key={assessment} className="border">{assessment}</TableHead>
                        ))}
                        {hasPractical && <TableHead className="border">Total</TableHead>}
                        
                        {/* SLA assessments */}
                        {subject.assessments.filter(a => a.includes('SLA')).map(assessment => (
                          <TableHead key={assessment} className="border">{assessment}</TableHead>
                        ))}
                        {hasSLA && <TableHead className="border">Total</TableHead>}
                        
                      </React.Fragment>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.students.map((student) => {
                  let overallTotal = 0;
                  let maxPossibleMarks = 0;
                  const failedSubjects: string[] = [];
                  
                  // Check which subjects the student failed
                  for (const subject of reportData.subjects) {
                    const marks = student.marks[subject.abbr] || {};
                    if (isSubjectFailed(marks, subject.assessments)) {
                      failedSubjects.push(subject.abbr);
                    }
                  }
                  
                  // Calculate overall percentage
                  for (const subject of reportData.subjects) {
                    const marks = student.marks[subject.abbr] || {};
                    const totals = calculateTotals(marks, subject.assessments);
                    overallTotal += totals.overallTotal;
                    maxPossibleMarks += subject.assessments.length * 50;
                  }
                  
                  const overallPercentage = maxPossibleMarks > 0 ? (overallTotal / maxPossibleMarks) * 100 : 0;
                  const isFailed = overallPercentage < 40;
                  
                  return (
                    <TableRow 
                      key={student.id} 
                      style={{ backgroundColor: isFailed ? '#FFFDE7' : undefined }}
                    >
                      <TableCell className="border">{student.name}</TableCell>
                      <TableCell className="border">{student.enrollment}</TableCell>
                      {reportData.subjects.map((subject) => {
                        const marks = student.marks[subject.abbr] || {};
                        const totals = calculateTotals(marks, subject.assessments);
                        const subjectFailed = failedSubjects.includes(subject.abbr);
                        const hasTheory = subject.assessments.some(a => a.includes('TH'));
                        const hasPractical = subject.assessments.some(a => a.includes('PR'));
                        
                        return (
                          <React.Fragment key={subject.abbr}>
                            {/* Theory marks */}
                            {subject.assessments.filter(a => a.includes('TH')).map(assessment => (
                              <TableCell 
                                key={assessment} 
                                className="border"
                                style={{ backgroundColor: subjectFailed ? '#FFEBEE' : undefined }}
                              >
                                {marks[assessment] ?? '-'}
                              </TableCell>
                            ))}
                            {hasTheory && (
                              <TableCell 
                                className="border"
                                style={{ backgroundColor: subjectFailed ? '#FFEBEE' : undefined }}
                              >
                                {totals.thTotal}
                              </TableCell>
                            )}
                            
                            {/* Practical marks */}
                            {subject.assessments.filter(a => a.includes('PR')).map(assessment => (
                              <TableCell 
                                key={assessment} 
                                className="border"
                                style={{ backgroundColor: subjectFailed ? '#FFEBEE' : undefined }}
                              >
                                {marks[assessment] ?? '-'}
                              </TableCell>
                            ))}
                            {hasPractical && (
                              <TableCell 
                                className="border"
                                style={{ backgroundColor: subjectFailed ? '#FFEBEE' : undefined }}
                              >
                                {totals.prTotal}
                              </TableCell>
                            )}
                            
                            {/* SLA marks */}
                            {subject.assessments.filter(a => a.includes('SLA')).map(assessment => (
                              <TableCell 
                                key={assessment} 
                                className="border"
                                style={{ backgroundColor: subjectFailed ? '#FFEBEE' : undefined }}
                              >
                                {marks[assessment] ?? '-'}
                              </TableCell>
                            ))}
                            
                            {/* Overall total for the subject */}
                            <TableCell 
                              className="border"
                              style={{ backgroundColor: subjectFailed ? '#FFEBEE' : undefined }}
                            >
                              {totals.overallTotal}
                            </TableCell>
                          </React.Fragment>
                        );
                      })}
                      
                      <TableCell className="border">{overallTotal}</TableCell>
                      <TableCell className="border">
                        {maxPossibleMarks > 0 ? overallPercentage.toFixed(2) : '0.00'}%
                      </TableCell>
                      <TableCell 
                        className="border "
                        style={{ color: isFailed ? 'red' : undefined, fontWeight: isFailed ? 'bold' : undefined }}
                      >
                        {maxPossibleMarks > 0 && overallPercentage >= 75
                          ? 'FIRST CLASS WITH DISTINCTION'
                          : overallPercentage >= 60
                            ? 'FIRST CLASS'
                            : overallPercentage >= 40
                              ? 'SECOND CLASS'
                              : 'FAIL'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <SummaryStats reportData={reportData} />
          </div>
        </div>
      ) : (
        <div>No report data available</div>
      )}
    </div>
  );
};

export default ReportPage;