import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../../services/db/databaseService';
import { ExamResult, Exam, UserProfile } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/ToastContext';
import { Search, Eye, Download, CheckSquare } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const ExamResultsListPage: React.FC = () => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resList, examList, userList] = await Promise.all([
        dbService.getExamResults(),
        dbService.getExams(),
        dbService.getProfiles('student'),
      ]);
      setResults(resList);
      setExams(examList);
      setStudents(userList);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load results table');
    } finally {
      setIsLoading(false);
    }
  };

  const examsMap = new Map(exams.map((e) => [e.id, e]));
  const studentsMap = new Map(students.map((s) => [s.id, s]));

  const filteredResults = results.filter((res) => {
    if (selectedExamId && res.examId !== selectedExamId) return false;
    if (selectedStatus === 'passed' && !res.isPassed) return false;
    if (selectedStatus === 'failed' && res.isPassed) return false;
    if (selectedStatus === 'pending_essay' && !res.hasPendingEssay) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const student = studentsMap.get(res.studentId);
      const exam = examsMap.get(res.examId);
      const matchesStudent =
        student?.fullName.toLowerCase().includes(q) ||
        student?.email.toLowerCase().includes(q) ||
        student?.registrationNumber?.toLowerCase().includes(q);
      const matchesExam = exam?.title.toLowerCase().includes(q);
      if (!matchesStudent && !matchesExam) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredResults.length / pageSize) || 1;
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportCSV = () => {
    if (filteredResults.length === 0) return;
    const headers = 'Student Name,Registration Number,Exam Title,Marks Obtained,Total Marks,Percentage,Status,Submitted At\n';
    const rows = filteredResults
      .map((r) => {
        const student = studentsMap.get(r.studentId);
        const exam = examsMap.get(r.examId);
        return `"${student?.fullName || 'Student'}","${student?.registrationNumber || ''}","${exam?.title || ''}",${r.marksObtained},${r.totalMarks},${r.percentage}%,"${r.isPassed ? 'Passed' : 'Failed'}","${r.generatedAt}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `examflow-results-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    toast.success('Results exported to CSV');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
        <p className="text-sm text-muted-foreground mt-2">Loading examination results...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Examination Results</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Review completed candidate scorecards, pass/fail status, and score distribution
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-1.5" />
          Export to CSV
        </Button>
      </div>

      {/* Filter Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Search candidate name or reg number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="h-4 w-4" />}
            />

            <Select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Examinations</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </Select>

            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="pending_essay">Pending Essay Evaluation</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      {paginatedResults.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-8 w-8" />}
          title="No examination results found"
          description="There are no completed candidate submissions matching your selected filters."
        />
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Examination</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResults.map((r) => {
                const student = studentsMap.get(r.studentId);
                const exam = examsMap.get(r.examId);
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground text-xs">
                          {student?.fullName || 'Examinee'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {student?.registrationNumber || 'STU'} • {student?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground text-xs line-clamp-1">
                        {exam?.title || r.examId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-foreground">
                        {r.marksObtained} / {r.totalMarks}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold">{r.percentage}%</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={r.isPassed ? 'success' : 'destructive'} size="sm">
                          {r.isPassed ? 'PASSED' : 'FAILED'}
                        </Badge>
                        {r.hasPendingEssay && (
                          <Badge variant="warning" size="sm">
                            Essay Pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(r.generatedAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-primary"
                        onClick={() => navigate(`/student/results/${r.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Scorecard
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredResults.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
