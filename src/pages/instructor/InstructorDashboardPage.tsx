import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../../services/db/databaseService';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  FileSpreadsheet,
  HelpCircle,
  FileCheck,
  CheckSquare,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const InstructorDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [pendingEssays, setPendingEssays] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadInstructorData();
  }, [currentUser]);

  const loadInstructorData = async () => {
    setIsLoading(true);
    try {
      const [allExams, allQuestions, essayQueue, results] = await Promise.all([
        dbService.getExams({ role: 'instructor' }),
        dbService.getQuestions(),
        dbService.getPendingEssayGradingList(),
        dbService.getExamResults(),
      ]);
      setExams(allExams);
      setQuestions(allQuestions);
      setPendingEssays(essayQueue);
      setRecentResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
        <p className="text-sm text-muted-foreground mt-2">Loading faculty dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Faculty Instructor Portal
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Welcome back, {currentUser?.fullName}. Manage questions, exams, and essay grading queues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/instructor/questions')}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Question
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/instructor/exams/create')}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Exam
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">My Examinations</p>
              <p className="text-xl font-bold text-foreground">{exams.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/50">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Authored Items</p>
              <p className="text-xl font-bold text-foreground">{questions.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Essays</p>
              <p className="text-xl font-bold text-foreground">{pendingEssays.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Submissions Evaluated</p>
              <p className="text-xl font-bold text-foreground">{recentResults.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Essay Evaluation Callout */}
      {pendingEssays.length > 0 && (
        <Card className="border-amber-300 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="warning" size="sm">
                  Action Required
                </Badge>
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  {pendingEssays.length} Essay Submission{pendingEssays.length > 1 ? 's' : ''} Awaiting Grading
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Candidates have submitted descriptive responses requiring instructor manual review and rubric scoring.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/instructor/grading')}
              className="shrink-0"
            >
              Open Grading Queue <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Grid: Exams List & Recent Student Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Examinations */}
        <Card>
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Examinations Overview</CardTitle>
            <Button
              variant="link"
              size="sm"
              className="text-xs"
              onClick={() => navigate('/instructor/exams')}
            >
              Manage All →
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {exams.slice(0, 4).map((ex) => (
              <div
                key={ex.id}
                className="p-3 rounded-lg border border-border bg-card flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">{ex.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {ex.durationMinutes} mins • {ex.totalMarks} marks • {ex.passPercentage}% Pass
                  </p>
                </div>
                <Badge variant={ex.status === 'live' ? 'success' : 'secondary'} size="sm">
                  {ex.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card>
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Latest Exam Results</CardTitle>
            <Button
              variant="link"
              size="sm"
              className="text-xs"
              onClick={() => navigate('/instructor/results')}
            >
              View Full Table →
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {recentResults.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-lg border border-border bg-card flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    Score: {r.marksObtained} / {r.totalMarks} ({r.percentage}%)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Submitted on {formatDate(r.generatedAt)}
                  </p>
                </div>
                <Badge variant={r.isPassed ? 'success' : 'destructive'} size="sm">
                  {r.isPassed ? 'PASSED' : 'FAILED'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
