import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../../services/db/databaseService';
import { useAuth } from '../../context/AuthContext';
import { Exam, Subject, ExamStatus } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/ToastContext';
import {
  Plus,
  Search,
  FileSpreadsheet,
  Clock,
  Edit2,
  Trash2,
  Archive,
  Sparkles,
} from 'lucide-react';
import { formatDuration } from '../../lib/utils';

export const ExamsListPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Delete modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allExams, allSubjects] = await Promise.all([
        dbService.getExams({ role: currentUser?.role }),
        dbService.getSubjects(),
      ]);
      setExams(allExams);
      setSubjects(allSubjects);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load examinations list.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (examId: string, newStatus: ExamStatus) => {
    try {
      await dbService.updateExamStatus(examId, newStatus);
      toast.success(`Exam status updated to ${newStatus.toUpperCase()}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    try {
      await dbService.deleteExam(examToDelete.id);
      toast.success(`Exam "${examToDelete.title}" deleted.`);
      setDeleteConfirmOpen(false);
      setExamToDelete(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  // Filtered examinations
  const filteredExams = exams.filter((exam) => {
    if (statusTab !== 'all' && exam.status !== statusTab) return false;
    if (selectedSubject && exam.subjectId !== selectedSubject) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!exam.title.toLowerCase().includes(q) && !exam.description?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const statusBadges: Record<ExamStatus, { variant: 'default' | 'success' | 'warning' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    draft: { variant: 'secondary', label: 'Draft' },
    scheduled: { variant: 'warning', label: 'Scheduled' },
    live: { variant: 'success', label: 'Live' },
    completed: { variant: 'default', label: 'Completed' },
    archived: { variant: 'outline', label: 'Archived' },
  };

  const createRoute =
    currentUser?.role === 'admin' ? '/admin/exams/create' : '/instructor/exams/create';

  if (isLoading) {
    return (
      <div className="space-y-6 py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
        <p className="text-sm text-muted-foreground mt-2">Loading examinations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Examinations</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage institutional assessments, review proctoring configurations, and schedule exams
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate(createRoute)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create Examination
        </Button>
      </div>

      {/* Tabs by Status */}
      <Tabs
        activeTab={statusTab}
        onChange={setStatusTab}
        variant="pills"
        tabs={[
          { id: 'all', label: 'All Exams', count: exams.length },
          { id: 'live', label: 'Live Now', count: exams.filter((e) => e.status === 'live').length },
          { id: 'scheduled', label: 'Scheduled', count: exams.filter((e) => e.status === 'scheduled').length },
          { id: 'draft', label: 'Drafts', count: exams.filter((e) => e.status === 'draft').length },
          { id: 'completed', label: 'Completed', count: exams.filter((e) => e.status === 'completed').length },
          { id: 'archived', label: 'Archived', count: exams.filter((e) => e.status === 'archived').length },
        ]}
      />

      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <Input
            placeholder="Search exams by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Exams Grid / List */}
      {filteredExams.length === 0 ? (
        <EmptyState
          icon={<FileSpreadsheet className="h-8 w-8" />}
          title="No examinations found"
          description="There are no examinations matching your selected filter or search query."
          actionText="Create New Examination"
          onAction={() => navigate(createRoute)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => {
            const subject = subjects.find((s) => s.id === exam.subjectId);
            const badgeInfo = statusBadges[exam.status];
            const editRoute =
              currentUser?.role === 'admin'
                ? `/admin/exams/${exam.id}/edit`
                : `/instructor/exams/${exam.id}/edit`;

            return (
              <Card key={exam.id} className="flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={badgeInfo.variant} size="sm">
                      {badgeInfo.label}
                    </Badge>
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDuration(exam.durationMinutes)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-2">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {exam.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>{subject ? subject.code : 'General'}</span>
                    <span className="font-semibold text-foreground">
                      {exam.totalMarks} Marks ({exam.passPercentage}% Pass)
                    </span>
                  </div>
                </CardContent>

                {/* Card Action Footer */}
                <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    {/* Status Toggle Quick Actions */}
                    {exam.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                        onClick={() => handleStatusChange(exam.id, 'live')}
                      >
                        <Sparkles className="h-3 w-3 mr-1" /> Publish Live
                      </Button>
                    )}
                    {exam.status === 'live' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-slate-600 hover:text-slate-700"
                        onClick={() => handleStatusChange(exam.id, 'completed')}
                      >
                        Complete Exam
                      </Button>
                    )}
                    {exam.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => handleStatusChange(exam.id, 'archived')}
                      >
                        <Archive className="h-3 w-3 mr-1" /> Archive
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      title="Edit Exam"
                      onClick={() => navigate(editRoute)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Delete Exam"
                      onClick={() => {
                        setExamToDelete(exam);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Exam Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteExam}
        title="Delete Examination"
        message={`Are you sure you want to delete "${examToDelete?.title}"? All associated attempt questions and results will be permanently archived.`}
        variant="destructive"
        confirmText="Delete Examination"
      />
    </div>
  );
};
