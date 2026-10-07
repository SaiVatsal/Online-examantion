import React from 'react';
import { Question, Subject, Topic } from '../../types';
import { Dialog } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CheckCircle2 } from 'lucide-react';

interface QuestionPreviewDialogProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  topics: Topic[];
}

export const QuestionPreviewDialog: React.FC<QuestionPreviewDialogProps> = ({
  question,
  isOpen,
  onClose,
  subjects,
  topics,
}) => {
  if (!question) return null;

  const subject = subjects.find((s) => s.id === question.subjectId);
  const topic = topics.find((t) => t.id === question.topicId);

  const difficultyColors = {
    easy: 'success',
    medium: 'warning',
    hard: 'destructive',
  } as const;

  const typeLabels = {
    mcq: 'Multiple Choice (Single)',
    multiple_select: 'Multiple Select (Multi)',
    true_false: 'True / False',
    short_answer: 'Short Answer',
    essay: 'Essay / Descriptive',
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Question Details" maxWidth="lg">
      <div className="space-y-6">
        {/* Metadata badges */}
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant={difficultyColors[question.difficulty]}>
            {question.difficulty.toUpperCase()}
          </Badge>
          <Badge variant="outline">{typeLabels[question.questionType]}</Badge>
          <Badge variant="secondary">Marks: {question.defaultMarks}</Badge>
          {question.defaultNegativeMarks > 0 && (
            <Badge variant="destructive">Penalty: -{question.defaultNegativeMarks}</Badge>
          )}
          {subject && <Badge variant="info">{subject.name}</Badge>}
          {topic && <Badge variant="outline">{topic.name}</Badge>}
        </div>

        {/* Question Prompt */}
        <div className="p-4 rounded-lg bg-muted/40 border border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Question Prompt
          </h4>
          <p className="text-base font-medium text-foreground whitespace-pre-wrap leading-relaxed">
            {question.questionText}
          </p>
        </div>

        {/* Type-Specific Options / Answers */}
        {(question.questionType === 'mcq' ||
          question.questionType === 'multiple_select' ||
          question.questionType === 'true_false') && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Configured Options
            </h4>
            <div className="space-y-2">
              {question.options?.map((opt, idx) => (
                <div
                  key={opt.id}
                  className={`flex items-center justify-between p-3 rounded-md border text-sm ${
                    opt.isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                      : 'bg-card border-border text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center font-semibold text-xs text-muted-foreground">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt.optionText}</span>
                  </div>
                  {opt.isCorrect && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Correct Answer
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {question.questionType === 'short_answer' && (
          <div className="p-3.5 rounded-md border border-border bg-card">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Accepted Answer Key
            </h4>
            <p className="text-sm font-mono font-semibold text-primary">
              {question.shortAnswerKey || 'None set'}
            </p>
          </div>
        )}

        {question.questionType === 'essay' && (
          <div className="p-3.5 rounded-md border border-border bg-card space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Grading Rubric & Evaluation Criteria
            </h4>
            <p className="text-xs text-foreground whitespace-pre-line leading-relaxed font-mono bg-muted/30 p-2.5 rounded">
              {question.rubric || 'No rubric configured.'}
            </p>
          </div>
        )}

        {/* Explanation */}
        {question.explanation && (
          <div className="p-3.5 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300">
            <span className="font-semibold block mb-0.5">Explanation / Educational Rationale:</span>
            {question.explanation}
          </div>
        )}

        {/* Tags */}
        {question.tags && question.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Tags:</span>
            {question.tags.map((t) => (
              <span
                key={t}
                className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
