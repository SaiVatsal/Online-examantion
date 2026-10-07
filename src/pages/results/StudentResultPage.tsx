import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../../services/db/databaseService';
import { useAuth } from '../../context/AuthContext';
import { ExamResult, Exam, ExamAttempt, UserProfile, AttemptAnswer, Question } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/ToastContext';
import {
  CheckCircle2,
  Printer,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const StudentResultPage: React.FC = () => {
  const { id: resultId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState<{
    result: ExamResult;
    exam: Exam;
    attempt: ExamAttempt;
    student: UserProfile;
    answers: AttemptAnswer[];
    questions: Question[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (resultId) loadResult();
  }, [resultId]);

  const loadResult = async () => {
    setIsLoading(true);
    try {
      const res = await dbService.getResultById(resultId!);
      if (!res) {
        toast.error('Result scorecard not found');
        navigate('/student/results');
        return;
      }
      setData(res);
      // Auto-expand all questions for review
      setExpandedQuestions(new Set(res.questions.map((q) => q.id)));
    } catch (e) {
      console.error(e);
      toast.error('Failed to load examination result');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleExpand = (qId: string) => {
    const next = new Set(expandedQuestions);
    if (next.has(qId)) next.delete(qId);
    else next.add(qId);
    setExpandedQuestions(next);
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const { result, exam, attempt, student, answers, questions } = data;
  const answersMap = new Map(answers.map((a) => [a.questionId, a]));

  const timeSpentMinutes = attempt.submittedAt && attempt.startedAt
    ? Math.max(1, Math.round((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60000))
    : 0;

  const backUrl = currentUser?.role === 'student' ? '/student/results' : currentUser?.role === 'admin' ? '/admin/results' : '/instructor/results';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" size="sm" onClick={() => navigate(backUrl)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Results
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-1.5" /> Print Scorecard
        </Button>
      </div>

      {/* Main Scorecard Banner */}
      <Card className="overflow-hidden border-border shadow-sm">
        <div className="p-6 sm:p-8 bg-slate-900 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Official Examination Scorecard
                </span>
                <Badge variant={result.isPassed ? 'success' : 'destructive'} size="sm">
                  {result.isPassed ? 'PASSED' : 'NOT PASSED'}
                </Badge>
                {result.hasPendingEssay && (
                  <Badge variant="warning" size="sm">
                    ESSAY PENDING EVALUATION
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{exam.title}</h1>
              <p className="text-xs text-slate-300 mt-1">
                Candidate: {student.fullName} ({student.registrationNumber || 'STU'}) • Submitted on {formatDate(result.generatedAt)}
              </p>
            </div>

            {/* Score circle / summary */}
            <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700 shrink-0">
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Score</p>
                <p className="text-3xl font-extrabold text-white">
                  {result.marksObtained}
                  <span className="text-base font-normal text-slate-400"> / {result.totalMarks}</span>
                </p>
              </div>
              <div className="h-10 w-px bg-slate-700" />
              <div className="text-left">
                <p className="text-xs text-slate-400">Percentage</p>
                <p className="text-2xl font-bold text-primary">{result.percentage}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border bg-card border-b border-border text-center">
          <div className="p-4">
            <span className="text-xs text-muted-foreground block">Correct Answers</span>
            <span className="text-lg font-bold text-emerald-600 block mt-0.5">
              {result.correctAnswers}
            </span>
          </div>
          <div className="p-4">
            <span className="text-xs text-muted-foreground block">Incorrect Answers</span>
            <span className="text-lg font-bold text-red-600 block mt-0.5">
              {result.incorrectAnswers}
            </span>
          </div>
          <div className="p-4">
            <span className="text-xs text-muted-foreground block">Unanswered</span>
            <span className="text-lg font-bold text-muted-foreground block mt-0.5">
              {result.unansweredQuestions}
            </span>
          </div>
          <div className="p-4">
            <span className="text-xs text-muted-foreground block">Time Elapsed</span>
            <span className="text-lg font-bold text-foreground block mt-0.5">
              {timeSpentMinutes} mins
            </span>
          </div>
        </div>
      </Card>

      {/* QUESTION-BY-QUESTION REVIEW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" /> Examination Review & Solutions
          </h2>
          <span className="text-xs text-muted-foreground">
            {questions.length} Questions Evaluated
          </span>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => {
            const ans = answersMap.get(q.id);
            const isExpanded = expandedQuestions.has(q.id);
            const isCorrect = ans?.isCorrect;

            return (
              <Card key={q.id} className="overflow-hidden transition-all">
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(q.id)}
                  className={`p-4 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                    isCorrect === true
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                      : isCorrect === false
                      ? 'bg-red-50/40 dark:bg-red-950/20'
                      : 'bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-border bg-card">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                      {q.questionText}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {q.questionType === 'essay' ? (
                      <Badge variant="warning" size="sm">
                        {ans?.marksObtained !== undefined && ans.marksObtained > 0
                          ? `${ans.marksObtained} / ${q.defaultMarks} Marks`
                          : 'Pending Review'}
                      </Badge>
                    ) : isCorrect === true ? (
                      <Badge variant="success" size="sm">
                        +{ans?.marksObtained || q.defaultMarks} Marks
                      </Badge>
                    ) : isCorrect === false ? (
                      <Badge variant="destructive" size="sm">
                        {ans?.marksObtained || 0} Marks
                      </Badge>
                    ) : (
                      <Badge variant="secondary" size="sm">
                        Unanswered
                      </Badge>
                    )}

                    <button className="text-muted-foreground p-1">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <CardContent className="p-4 pt-2 border-t border-border space-y-3 text-xs bg-muted/10">
                    <p className="text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed">
                      {q.questionText}
                    </p>

                    {/* Options list for MCQ / Multiple Select / TrueFalse */}
                    {(q.questionType === 'mcq' ||
                      q.questionType === 'multiple_select' ||
                      q.questionType === 'true_false') && (
                      <div className="space-y-1.5 pt-1">
                        {q.options?.map((opt, optIdx) => {
                          const isStudentSelected = ans?.selectedOptionIds?.includes(opt.id);
                          const isOptionCorrect = Boolean(opt.isCorrect);

                          let itemStyle = 'border-border bg-card text-foreground';
                          if (isOptionCorrect && isStudentSelected) {
                            itemStyle = 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                          } else if (isOptionCorrect && !isStudentSelected) {
                            itemStyle = 'border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300';
                          } else if (!isOptionCorrect && isStudentSelected) {
                            itemStyle = 'border-red-300 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 font-semibold line-through';
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center justify-between p-2.5 rounded-md border text-xs ${itemStyle}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold text-[11px] w-4">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <span>{opt.optionText}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {isStudentSelected && (
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                    (Your Choice)
                                  </span>
                                )}
                                {isOptionCorrect && (
                                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                                    ✓ Correct
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short answer review */}
                    {q.questionType === 'short_answer' && (
                      <div className="space-y-2 pt-1">
                        <div className="p-2.5 rounded bg-card border border-border">
                          <span className="text-[11px] text-muted-foreground block font-semibold">Your Answer:</span>
                          <span className="text-xs font-mono font-medium text-foreground">
                            {ans?.textResponse || 'No answer submitted'}
                          </span>
                        </div>
                        {q.shortAnswerKey && (
                          <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-900 dark:text-emerald-300">
                            <span className="text-[11px] block font-semibold">Correct Answer Key:</span>
                            <span className="text-xs font-mono font-bold">{q.shortAnswerKey}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Essay review */}
                    {q.questionType === 'essay' && (
                      <div className="space-y-2 pt-1">
                        <div className="p-3 rounded bg-card border border-border">
                          <span className="text-[11px] text-muted-foreground block font-semibold mb-1">
                            Your Essay Response:
                          </span>
                          <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                            {ans?.textResponse || 'No response provided.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Solution Explanation */}
                    {q.explanation && (
                      <div className="p-3 rounded-md bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-950 dark:text-blue-300">
                        <span className="font-semibold block mb-0.5">Explanation:</span>
                        {q.explanation}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
