import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../../services/db/databaseService';
import { useAuth } from '../../context/AuthContext';
import { Exam, Subject, ExamResult } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  Play,
  Eye,
  Shield,
  Sparkles,
} from 'lucide-react';
import { formatDuration } from '../../lib/utils';

export const AvailableExamsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const [allExams, allSubjects, allResults] = await Promise.all([
        dbService.getExams({ role: 'student' }),
        dbService.getSubjects(),
        dbService.getExamResults({ studentId: currentUser.id }),
      ]);

      setExams(allExams);
      setSubjects(allSubjects);
      setResults(allResults);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
        <p className="text-sm text-muted-foreground mt-2">Loading available examinations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Student Examination Portal
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome, {currentUser?.fullName || 'Examinee'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Select an examination from the roster below to view instructions and launch your proctored assessment.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-card p-3 rounded-lg border border-border text-xs shrink-0">
          <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
          <div>
            <p className="font-semibold text-foreground">Proctoring Ready</p>
            <p className="text-[11px] text-muted-foreground">Browser Verified</p>
          </div>
        </div>
      </div>

      {/* Recommended Demo Exam Highlight (Kids Easy Test) */}
      {exams.some((e) => e.title.includes('Kids Easy Test')) && (
        <Card className="border-primary/40 bg-card shadow-sm">
          <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">
                    Recommended Test Exam
                  </Badge>
                  <span className="text-xs text-muted-foreground">15 Minutes • 20 Questions</span>
                </div>
                <h3 className="text-base font-bold text-foreground mt-1">
                  Kids Easy Test – LKG / UKG / Kindergarten
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                  Intentionally easy 20-question test designed to test the complete examination engine: timer countdown, autosave, question palette navigation, review mode, and automatic server scoring.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              {results.find((r) => r.examId === 'exam-kids-01') ? (
                <Button
                  variant="outline"
                  size="md"
                  className="w-full md:w-auto"
                  onClick={() => {
                    const res = results.find((r) => r.examId === 'exam-kids-01');
                    if (res) navigate(`/student/results/${res.id}`);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" />
                  View Completed Scorecard
                </Button>
              ) : null}

              <Button
                variant="primary"
                size="md"
                className="w-full md:w-auto"
                onClick={() => navigate('/student/exam/exam-kids-01/instructions')}
              >
                <Play className="h-4 w-4 mr-1.5" />
                Take Test Exam
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Examinations Grid */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">All Assigned Examinations</h2>

        {exams.length === 0 ? (
          <EmptyState
            icon={<FileSpreadsheet className="h-8 w-8" />}
            title="No examinations available"
            description="You currently have no scheduled examinations active on your student roster."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => {
              const subject = subjects.find((s) => s.id === exam.subjectId);
              const pastResult = results.find((r) => r.examId === exam.id);

              return (
                <Card
                  key={exam.id}
                  className="flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={exam.status === 'live' ? 'success' : 'warning'} size="sm">
                        {exam.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock className="h-3.5 w-3.5" /> {formatDuration(exam.durationMinutes)}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-2">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {exam.description || 'Institutional examination.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                      <span>{subject ? subject.name : 'General'}</span>
                      <span className="font-semibold text-foreground">
                        {exam.totalMarks} Total Marks ({exam.passPercentage}% Pass)
                      </span>
                    </div>

                    {pastResult && (
                      <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
                        <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                          Completed: {pastResult.marksObtained} / {pastResult.totalMarks} ({pastResult.percentage}%)
                        </span>
                        <Badge variant={pastResult.isPassed ? 'success' : 'destructive'} size="sm">
                          {pastResult.isPassed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    )}
                  </CardContent>

                  <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between gap-2">
                    {pastResult ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => navigate(`/student/results/${pastResult.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        View Scorecard
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => navigate(`/student/exam/${exam.id}/instructions`)}
                      >
                        <Play className="h-3.5 w-3.5 mr-1.5" />
                        Start Examination
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
