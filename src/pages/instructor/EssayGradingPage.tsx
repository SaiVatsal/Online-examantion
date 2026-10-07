import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db/databaseService';
import { useAuth } from '../../context/AuthContext';
import { AttemptAnswer, Question, Exam, UserProfile, ExamAttempt, EssayGrade } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/ToastContext';
import { FileCheck, Award, BookOpen } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const EssayGradingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<
    Array<{
      answer: AttemptAnswer;
      question: Question;
      exam: Exam;
      student: UserProfile;
      attempt: ExamAttempt;
      grade?: EssayGrade;
    }>
  >([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [marks, setMarks] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const toast = useToast();

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const list = await dbService.getPendingEssayGradingList();
      setItems(list);
      if (list.length > 0) {
        setMarks(list[0].grade?.marksAwarded || 0);
        setFeedback(list[0].grade?.feedback || '');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load essay grading queue');
    } finally {
      setIsLoading(false);
    }
  };

  const currentItem = items[selectedItemIndex];

  const handleSelectSubmission = (index: number) => {
    setSelectedItemIndex(index);
    const item = items[index];
    setMarks(item.grade?.marksAwarded || 0);
    setFeedback(item.grade?.feedback || '');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || !currentUser) return;

    if (marks < 0 || marks > currentItem.question.defaultMarks) {
      toast.error(`Marks must be between 0 and ${currentItem.question.defaultMarks}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await dbService.gradeEssaySubmission(
        currentItem.answer.id,
        currentUser.id,
        Number(marks),
        feedback.trim()
      );

      toast.success(
        `Graded successfully! Awarded ${marks}/${currentItem.question.defaultMarks} marks to ${currentItem.student.fullName}. Total score recalculated.`,
        'Evaluation Finalized'
      );

      loadSubmissions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit grade');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
        <p className="text-sm text-muted-foreground mt-2">Loading essay submissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Essay Grading & Evaluation
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review subjective descriptive essay submissions, apply grading rubrics, and record feedback
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<FileCheck className="h-8 w-8" />}
          title="Grading Queue Empty"
          description="There are currently no descriptive essay submissions awaiting instructor evaluation."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions List sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Pending Submissions ({items.length})
            </h3>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const isSelected = idx === selectedItemIndex;
                const isGraded = Boolean(item.grade);
                return (
                  <div
                    key={item.answer.id}
                    onClick={() => handleSelectSubmission(idx)}
                    className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                        : 'border-border bg-card hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-semibold text-foreground truncate">
                        {item.student.fullName}
                      </span>
                      <Badge variant={isGraded ? 'success' : 'warning'} size="sm">
                        {isGraded ? 'Graded' : 'Pending'}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground truncate">{item.exam.title}</p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border">
                      <span>Max: {item.question.defaultMarks} Marks</span>
                      <span>{formatDate(item.attempt.submittedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grading Editor */}
          {currentItem && (
            <div className="lg:col-span-2 space-y-5">
              <Card>
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        {currentItem.exam.title}
                      </span>
                      <CardTitle className="text-base mt-0.5">
                        Examinee: {currentItem.student.fullName} ({currentItem.student.registrationNumber || 'STU'})
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" size="md">
                      Max Marks: {currentItem.question.defaultMarks}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-5">
                  {/* Question Prompt */}
                  <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Essay Problem Statement:
                    </span>
                    <p className="text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed">
                      {currentItem.question.questionText}
                    </p>
                  </div>

                  {/* Official Rubric */}
                  {currentItem.question.rubric && (
                    <div className="p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 space-y-1 text-xs">
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" /> Official Grading Rubric & Criteria
                      </span>
                      <p className="text-amber-950 dark:text-amber-200 whitespace-pre-line leading-relaxed font-mono">
                        {currentItem.question.rubric}
                      </p>
                    </div>
                  )}

                  {/* Student Response */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Student's Submitted Response:
                    </span>
                    <div className="p-4 rounded-lg bg-card border border-border text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground min-h-[140px] shadow-xs">
                      {currentItem.answer.textResponse || (
                        <span className="italic text-muted-foreground">No response submitted.</span>
                      )}
                    </div>
                  </div>

                  {/* Evaluation Form */}
                  <form onSubmit={handleSaveGrade} className="space-y-4 pt-3 border-t border-border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={`Marks Awarded (Out of ${currentItem.question.defaultMarks})`}
                        type="number"
                        min="0"
                        max={currentItem.question.defaultMarks}
                        step="0.5"
                        value={marks}
                        onChange={(e) => setMarks(Number(e.target.value))}
                        required
                        helperText="Will be added directly to the candidate's total score."
                      />
                    </div>

                    <Textarea
                      label="Evaluator Feedback / Comments"
                      placeholder="Constructive feedback justifying marks breakdown..."
                      rows={3}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />

                    <div className="flex justify-end pt-2">
                      <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                        <Award className="h-4 w-4 mr-1.5" />
                        Finalize & Recalculate Score
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
