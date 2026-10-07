import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../../services/db/databaseService';
import { useAuth } from '../../context/AuthContext';
import { ExamResult, Exam } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Award, Eye, Calendar } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const StudentResultsListPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) loadResults();
  }, [currentUser]);

  const loadResults = async () => {
    setIsLoading(true);
    try {
      const [resList, examList] = await Promise.all([
        dbService.getExamResults({ studentId: currentUser?.id }),
        dbService.getExams(),
      ]);
      setResults(resList);
      setExams(examList);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const examsMap = new Map(exams.map((e) => [e.id, e]));

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
        <p className="text-sm text-muted-foreground mt-2">Loading results...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Examination Results</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review your scores, percentage ranks, official outcomes, and feedback from examiners
        </p>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<Award className="h-8 w-8" />}
          title="No completed examinations yet"
          description="Take an available test to generate official academic scorecards."
          actionText="Browse Available Exams"
          onAction={() => navigate('/student/exams')}
        />
      ) : (
        <div className="space-y-3">
          {results.map((r) => {
            const exam = examsMap.get(r.examId);
            return (
              <Card
                key={r.id}
                className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={r.isPassed ? 'success' : 'destructive'} size="sm">
                        {r.isPassed ? 'PASSED' : 'FAILED'}
                      </Badge>
                      {r.hasPendingEssay && (
                        <Badge variant="warning" size="sm">
                          Essay Pending Review
                        </Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(r.generatedAt)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground leading-snug">
                      {exam?.title || 'Examination'}
                    </h3>

                    <p className="text-xs text-muted-foreground">
                      Answered: {r.answeredQuestions} of {r.totalQuestions} • Correct: {r.correctAnswers} • Incorrect: {r.incorrectAnswers}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 sm:border-l sm:border-border sm:pl-6">
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">Final Score</span>
                      <span className="text-xl font-extrabold text-foreground block">
                        {r.marksObtained}
                        <span className="text-xs font-normal text-muted-foreground"> / {r.totalMarks}</span>
                      </span>
                      <span className="text-xs font-semibold text-primary block">
                        {r.percentage}%
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/student/results/${r.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1.5" />
                      View Scorecard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
