import React, { useState, useEffect } from 'react';
import { Question, QuestionType, DifficultyLevel, Subject, Topic, QuestionOption } from '../../types';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../ui/ToastContext';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { generateId } from '../../lib/utils';

interface QuestionEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (questionData: any) => Promise<void>;
  initialQuestion?: Question | null;
  subjects: Subject[];
  topics: Topic[];
}

export const QuestionEditorDialog: React.FC<QuestionEditorDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialQuestion,
  subjects,
  topics,
}) => {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [defaultMarks, setDefaultMarks] = useState<number>(1);
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState<number>(0);
  const [explanation, setExplanation] = useState('');
  const [rubric, setRubric] = useState('');
  const [shortAnswerKey, setShortAnswerKey] = useState('');
  const [tagsString, setTagsString] = useState('');
  const [options, setOptions] = useState<Array<{ id: string; optionText: string; isCorrect: boolean }>>([
    { id: generateId('opt'), optionText: '', isCorrect: true },
    { id: generateId('opt'), optionText: '', isCorrect: false },
    { id: generateId('opt'), optionText: '', isCorrect: false },
    { id: generateId('opt'), optionText: '', isCorrect: false },
  ]);
  const [tfAnswer, setTfAnswer] = useState<'true' | 'false'>('true');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toast = useToast();

  useEffect(() => {
    if (initialQuestion) {
      setQuestionText(initialQuestion.questionText);
      setQuestionType(initialQuestion.questionType);
      setSubjectId(initialQuestion.subjectId || '');
      setTopicId(initialQuestion.topicId || '');
      setDifficulty(initialQuestion.difficulty);
      setDefaultMarks(initialQuestion.defaultMarks);
      setDefaultNegativeMarks(initialQuestion.defaultNegativeMarks);
      setExplanation(initialQuestion.explanation || '');
      setRubric(initialQuestion.rubric || '');
      setShortAnswerKey(initialQuestion.shortAnswerKey || '');
      setTagsString(initialQuestion.tags?.join(', ') || '');

      if (initialQuestion.questionType === 'true_false') {
        const trueOpt = initialQuestion.options?.find((o) => o.optionText.toLowerCase() === 'true');
        setTfAnswer(trueOpt?.isCorrect ? 'true' : 'false');
      } else if (initialQuestion.options && initialQuestion.options.length > 0) {
        setOptions(
          initialQuestion.options.map((o) => ({
            id: o.id,
            optionText: o.optionText,
            isCorrect: Boolean(o.isCorrect),
          }))
        );
      }
    } else {
      // Defaults for new question
      setQuestionText('');
      setQuestionType('mcq');
      setSubjectId(subjects[0]?.id || '');
      setTopicId('');
      setDifficulty('easy');
      setDefaultMarks(1);
      setDefaultNegativeMarks(0);
      setExplanation('');
      setRubric('');
      setShortAnswerKey('');
      setTagsString('');
      setOptions([
        { id: generateId('opt'), optionText: '', isCorrect: true },
        { id: generateId('opt'), optionText: '', isCorrect: false },
        { id: generateId('opt'), optionText: '', isCorrect: false },
        { id: generateId('opt'), optionText: '', isCorrect: false },
      ]);
      setTfAnswer('true');
    }
    setErrorMsg('');
  }, [initialQuestion, isOpen, subjects]);

  const filteredTopics = topics.filter((t) => !subjectId || t.subjectId === subjectId);

  const handleAddOption = () => {
    setOptions([...options, { id: generateId('opt'), optionText: '', isCorrect: false }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.warning('A multiple choice question must have at least 2 options.');
      return;
    }
    const newOpts = [...options];
    newOpts.splice(index, 1);
    // If we removed the only correct one, make the first one correct
    if (!newOpts.some((o) => o.isCorrect) && newOpts.length > 0) {
      newOpts[0].isCorrect = true;
    }
    setOptions(newOpts);
  };

  const handleOptionChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index].optionText = text;
    setOptions(updated);
  };

  const handleSetCorrectMCQ = (index: number) => {
    setOptions(
      options.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      }))
    );
  };

  const handleToggleCorrectMSQ = (index: number) => {
    const updated = [...options];
    updated[index].isCorrect = !updated[index].isCorrect;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setErrorMsg('Please enter the question text.');
      return;
    }

    if (defaultMarks <= 0) {
      setErrorMsg('Marks must be greater than zero.');
      return;
    }

    // Question type validation
    let finalOptions: QuestionOption[] = [];

    if (questionType === 'mcq') {
      if (options.some((o) => !o.optionText.trim())) {
        setErrorMsg('All option fields must have text.');
        return;
      }
      if (!options.some((o) => o.isCorrect)) {
        setErrorMsg('Please select at least one correct option.');
        return;
      }
      finalOptions = options.map((o, idx) => ({
        id: o.id,
        questionId: initialQuestion?.id || '',
        optionText: o.optionText.trim(),
        isCorrect: o.isCorrect,
        orderIndex: idx,
      }));
    } else if (questionType === 'multiple_select') {
      if (options.some((o) => !o.optionText.trim())) {
        setErrorMsg('All option fields must have text.');
        return;
      }
      if (options.filter((o) => o.isCorrect).length < 2) {
        setErrorMsg('Multiple-select questions should have at least 2 correct options.');
        return;
      }
      finalOptions = options.map((o, idx) => ({
        id: o.id,
        questionId: initialQuestion?.id || '',
        optionText: o.optionText.trim(),
        isCorrect: o.isCorrect,
        orderIndex: idx,
      }));
    } else if (questionType === 'true_false') {
      finalOptions = [
        {
          id: generateId('opt'),
          questionId: initialQuestion?.id || '',
          optionText: 'True',
          isCorrect: tfAnswer === 'true',
          orderIndex: 0,
        },
        {
          id: generateId('opt'),
          questionId: initialQuestion?.id || '',
          optionText: 'False',
          isCorrect: tfAnswer === 'false',
          orderIndex: 1,
        },
      ];
    } else if (questionType === 'short_answer') {
      if (!shortAnswerKey.trim()) {
        setErrorMsg('Please provide the correct answer key for short answer evaluation.');
        return;
      }
    } else if (questionType === 'essay') {
      if (!rubric.trim()) {
        setErrorMsg('Please specify evaluation criteria / grading rubric for the essay.');
        return;
      }
    }

    const tags = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setErrorMsg('');
    setIsSaving(true);

    try {
      await onSave({
        questionText: questionText.trim(),
        questionType,
        subjectId: subjectId || undefined,
        topicId: topicId || undefined,
        difficulty,
        defaultMarks: Number(defaultMarks),
        defaultNegativeMarks: Number(defaultNegativeMarks),
        explanation: explanation.trim() || undefined,
        rubric: questionType === 'essay' ? rubric.trim() : undefined,
        shortAnswerKey: questionType === 'short_answer' ? shortAnswerKey.trim() : undefined,
        tags,
        status: 'active',
        options: finalOptions,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save question');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialQuestion ? 'Edit Question' : 'Create New Question'}
      description="Add questions to the institutional question bank for exam composition"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Basic Taxonomy & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Question Type"
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as QuestionType)}
            options={[
              { value: 'mcq', label: 'Multiple Choice (Single)' },
              { value: 'multiple_select', label: 'Multiple Select (Multi)' },
              { value: 'true_false', label: 'True / False' },
              { value: 'short_answer', label: 'Short Answer' },
              { value: 'essay', label: 'Essay / Descriptive' },
            ]}
          />

          <Select
            label="Subject"
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setTopicId('');
            }}
          >
            <option value="">Select Subject...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </Select>

          <Select
            label="Topic"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
          >
            <option value="">Select Topic...</option>
            {filteredTopics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Question Text */}
        <Textarea
          label="Question Prompt"
          placeholder="Enter the question text or problem statement..."
          rows={3}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          required
        />

        {/* Marks & Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
            options={[
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
          />

          <Input
            label="Marks (Score)"
            type="number"
            min="0.5"
            step="0.5"
            value={defaultMarks}
            onChange={(e) => setDefaultMarks(Number(e.target.value))}
            required
          />

          <Input
            label="Negative Marks (Penalty)"
            type="number"
            min="0"
            step="0.25"
            value={defaultNegativeMarks}
            onChange={(e) => setDefaultNegativeMarks(Number(e.target.value))}
          />
        </div>

        {/* TYPE SPECIFIC CONFIGURATION */}
        {/* 1. MCQ OPTIONS */}
        {questionType === 'mcq' && (
          <div className="space-y-3 p-4 rounded-md border border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Multiple Choice Options (Select single correct answer)
              </span>
              <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
              </Button>
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mcq-correct"
                    checked={opt.isCorrect}
                    onChange={() => handleSetCorrectMCQ(idx)}
                    className="h-4 w-4 text-primary cursor-pointer"
                    title="Mark as correct answer"
                  />
                  <span className="text-xs font-bold text-muted-foreground w-5">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <Input
                    placeholder={`Option ${String.fromCharCode(65 + idx)} text...`}
                    value={opt.optionText}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(idx)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. MULTIPLE SELECT OPTIONS */}
        {questionType === 'multiple_select' && (
          <div className="space-y-3 p-4 rounded-md border border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Multiple Select Options (Check all correct answers)
              </span>
              <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
              </Button>
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={opt.isCorrect}
                    onChange={() => handleToggleCorrectMSQ(idx)}
                    className="h-4 w-4 text-primary rounded cursor-pointer"
                    title="Mark as correct answer"
                  />
                  <span className="text-xs font-bold text-muted-foreground w-5">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <Input
                    placeholder={`Option ${String.fromCharCode(65 + idx)} text...`}
                    value={opt.optionText}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(idx)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. TRUE / FALSE */}
        {questionType === 'true_false' && (
          <div className="p-4 rounded-md border border-border bg-muted/20 space-y-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
              Correct Answer
            </span>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="tf-correct"
                  value="true"
                  checked={tfAnswer === 'true'}
                  onChange={() => setTfAnswer('true')}
                  className="h-4 w-4 text-primary"
                />
                True
              </label>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="tf-correct"
                  value="false"
                  checked={tfAnswer === 'false'}
                  onChange={() => setTfAnswer('false')}
                  className="h-4 w-4 text-primary"
                />
                False
              </label>
            </div>
          </div>
        )}

        {/* 4. SHORT ANSWER */}
        {questionType === 'short_answer' && (
          <div className="p-4 rounded-md border border-border bg-muted/20 space-y-2">
            <Input
              label="Accepted Answer Key (Exact Match)"
              placeholder="e.g. Representational State Transfer"
              value={shortAnswerKey}
              onChange={(e) => setShortAnswerKey(e.target.value)}
              helperText="Comparison is case-insensitive and trims surrounding whitespace."
              required
            />
          </div>
        )}

        {/* 5. ESSAY / RUBRIC */}
        {questionType === 'essay' && (
          <div className="p-4 rounded-md border border-border bg-muted/20 space-y-2">
            <Textarea
              label="Grading Rubric & Evaluation Criteria (For Instructor Review)"
              placeholder="Outline marks breakdown per criterion (e.g., Concept: 4 marks, Examples: 3 marks, Conclusion: 3 marks)..."
              rows={4}
              value={rubric}
              onChange={(e) => setRubric(e.target.value)}
              helperText="Shown to instructors during manual grading workflow."
              required
            />
          </div>
        )}

        {/* Explanation & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Textarea
            label="Explanation / Solution Rationale (Optional)"
            placeholder="Shown to examinees when reviewing submitted examination results..."
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />

          <Input
            label="Tags (Comma separated)"
            placeholder="e.g. kindergarten, counting, math"
            value={tagsString}
            onChange={(e) => setTagsString(e.target.value)}
            helperText="Separate tags with commas."
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
            {initialQuestion ? 'Save Question Changes' : 'Create Question'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
