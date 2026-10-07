import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db/databaseService';
import { Question, Subject, Topic } from '../../types';
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
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { QuestionEditorDialog } from '../../components/questions/QuestionEditorDialog';
import { QuestionPreviewDialog } from '../../components/questions/QuestionPreviewDialog';
import { useToast } from '../../components/ui/ToastContext';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Copy,
  Trash2,
  HelpCircle,
  CheckSquare,
  Square,
} from 'lucide-react';

export const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [qs, subs, tops] = await Promise.all([
        dbService.getQuestions(),
        dbService.getSubjects(),
        dbService.getTopics(),
      ]);
      setQuestions(qs);
      setSubjects(subs);
      setTopics(tops);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load question bank data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered list
  const filteredQuestions = questions.filter((q) => {
    if (selectedSubject && q.subjectId !== selectedSubject) return false;
    if (selectedTopic && q.topicId !== selectedTopic) return false;
    if (selectedType && q.questionType !== selectedType) return false;
    if (selectedDifficulty && q.difficulty !== selectedDifficulty) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const inText = q.questionText.toLowerCase().includes(query);
      const inTags = q.tags?.some((t) => t.toLowerCase().includes(query));
      if (!inText && !inTags) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAllCurrentPage = () => {
    if (paginatedQuestions.every((q) => selectedIds.has(q.id))) {
      const next = new Set(selectedIds);
      paginatedQuestions.forEach((q) => next.delete(q.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginatedQuestions.forEach((q) => next.add(q.id));
      setSelectedIds(next);
    }
  };

  // Save question handler
  const handleSaveQuestion = async (data: any) => {
    if (editingQuestion) {
      await dbService.updateQuestion(editingQuestion.id, data);
      toast.success('Question updated successfully.');
    } else {
      await dbService.createQuestion(data);
      toast.success('New question created and added to bank.');
    }
    loadData();
  };

  // Duplicate handler
  const handleDuplicate = async (id: string) => {
    try {
      await dbService.duplicateQuestion(id);
      toast.success('Question duplicated.');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Duplicate failed');
    }
  };

  // Delete single
  const handleDeleteSingle = async () => {
    if (!questionToDelete) return;
    try {
      await dbService.deleteQuestion(questionToDelete);
      toast.success('Question removed.');
      setDeleteConfirmOpen(false);
      setQuestionToDelete(null);
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    }
  };

  // Delete bulk
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    try {
      await dbService.bulkDeleteQuestions(ids);
      toast.success(`Successfully deleted ${ids.length} questions.`);
      setSelectedIds(new Set());
      setBulkDeleteConfirmOpen(false);
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Bulk delete failed');
    }
  };

  const difficultyVariants = {
    easy: 'success',
    medium: 'warning',
    hard: 'destructive',
  } as const;

  const typeLabels: Record<string, string> = {
    mcq: 'MCQ',
    multiple_select: 'MSQ',
    true_false: 'True/False',
    short_answer: 'Short Ans',
    essay: 'Essay',
  };

  if (isLoading) {
    return (
      <div className="space-y-6 py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
        <p className="text-sm text-muted-foreground mt-2">Loading question bank...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Question Bank</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Author, categorize, and maintain institutional assessment items across subjects
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingQuestion(null);
              setEditorOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Search */}
            <div className="md:col-span-2">
              <Input
                placeholder="Search questions or tags..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Subject */}
            <Select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('');
                setCurrentPage(1);
              }}
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>

            {/* Type */}
            <Select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Question Types</option>
              <option value="mcq">Multiple Choice (Single)</option>
              <option value="multiple_select">Multiple Select (Multi)</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer</option>
              <option value="essay">Essay / Descriptive</option>
            </Select>

            {/* Difficulty */}
            <Select
              value={selectedDifficulty}
              onChange={(e) => {
                setSelectedDifficulty(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
            <span>
              Showing <span className="font-semibold text-foreground">{filteredQuestions.length}</span>{' '}
              questions total
            </span>
            {(searchQuery || selectedSubject || selectedType || selectedDifficulty) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSubject('');
                  setSelectedTopic('');
                  setSelectedType('');
                  setSelectedDifficulty('');
                  setCurrentPage(1);
                }}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      {paginatedQuestions.length === 0 ? (
        <EmptyState
          icon={<HelpCircle className="h-8 w-8" />}
          title="No questions match your criteria"
          description="Adjust your search terms or filters, or create a new question to populate your institutional repository."
          actionText="Add Question"
          onAction={() => {
            setEditingQuestion(null);
            setEditorOpen(true);
          }}
        />
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <button
                    onClick={handleSelectAllCurrentPage}
                    className="p-1 rounded text-muted-foreground hover:text-foreground"
                    title="Select all on this page"
                  >
                    {paginatedQuestions.every((q) => selectedIds.has(q.id)) ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </TableHead>
                <TableHead>Question Prompt</TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead className="w-36">Subject</TableHead>
                <TableHead className="w-24">Difficulty</TableHead>
                <TableHead className="w-20">Marks</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedQuestions.map((q) => {
                const isSelected = selectedIds.has(q.id);
                const subject = subjects.find((s) => s.id === q.subjectId);
                return (
                  <TableRow key={q.id} className={isSelected ? 'bg-muted/40' : undefined}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(q.id)}
                        className="h-4 w-4 rounded text-primary cursor-pointer"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground line-clamp-2 leading-snug">
                          {q.questionText}
                        </p>
                        {q.tags && q.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {q.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] bg-muted px-1.5 py-0.2 rounded text-muted-foreground"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" size="sm">
                        {typeLabels[q.questionType] || q.questionType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground truncate block max-w-[140px]">
                        {subject ? subject.name : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={difficultyVariants[q.difficulty]} size="sm">
                        {q.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold">{q.defaultMarks}</span>
                      {q.defaultNegativeMarks > 0 && (
                        <span className="text-[10px] text-destructive block">
                          -{q.defaultNegativeMarks}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Preview Question"
                          onClick={() => {
                            setPreviewQuestion(q);
                            setPreviewOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          title="Edit Question"
                          onClick={() => {
                            setEditingQuestion(q);
                            setEditorOpen(true);
                          }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Duplicate Question"
                          onClick={() => handleDuplicate(q.id)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          title="Delete Question"
                          onClick={() => {
                            setQuestionToDelete(q.id);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredQuestions.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Question Editor Dialog */}
      <QuestionEditorDialog
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
        initialQuestion={editingQuestion}
        subjects={subjects}
        topics={topics}
      />

      {/* Question Preview Dialog */}
      <QuestionPreviewDialog
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewQuestion(null);
        }}
        question={previewQuestion}
        subjects={subjects}
        topics={topics}
      />

      {/* Delete Single Confirm */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteSingle}
        title="Delete Question"
        message="Are you sure you want to permanently delete this question from the Question Bank? Any draft exams referencing it will be updated."
        variant="destructive"
        confirmText="Delete Question"
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Questions"
        message={`Are you sure you want to delete ${selectedIds.size} selected questions? This action cannot be undone.`}
        variant="destructive"
        confirmText={`Delete ${selectedIds.size} Questions`}
      />
    </div>
  );
};
