import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db/databaseService';
import { UserProfile } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
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
import { Search, UserPlus, Edit2, GraduationCap } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const StudentsManagementPage: React.FC = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Add/Edit Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toast = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const list = await dbService.getProfiles('student');
    setStudents(list);
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setRegNumber(`STU-2026-${Math.floor(100 + Math.random() * 900)}`);
    setDialogOpen(true);
  };

  const handleOpenEdit = (s: UserProfile) => {
    setEditingStudent(s);
    setFullName(s.fullName);
    setEmail(s.email);
    setPhone(s.phone || '');
    setRegNumber(s.registrationNumber || '');
    setDialogOpen(true);
  };

  const handleToggleStatus = async (s: UserProfile) => {
    try {
      await dbService.toggleUserActive(s.id);
      toast.success(
        `Student account for ${s.fullName} ${s.isActive ? 'deactivated' : 'activated'}.`
      );
      loadStudents();
    } catch (e: any) {
      toast.error(e.message || 'Action failed');
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setIsSaving(true);
    try {
      if (editingStudent) {
        await dbService.updateProfile(editingStudent.id, {
          fullName,
          phone,
          registrationNumber: regNumber,
        });
        toast.success('Student details updated.');
      } else {
        await dbService.createProfile({
          fullName,
          email,
          role: 'student',
          phone,
          registrationNumber: regNumber,
          isActive: true,
        });
        toast.success('New student enrolled.');
      }
      setDialogOpen(false);
      loadStudents();
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = students.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.registrationNumber?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Student Management</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Enroll examinees, configure institutional registration numbers, and manage credentials
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <UserPlus className="h-4 w-4 mr-1.5" />
          Enroll Student
        </Button>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Search by student name, email, or registration ID..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {paginated.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-8 w-8" />}
          title="No students found"
          description="Enrolled student accounts will appear here."
          actionText="Enroll Student"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Registration No</TableHead>
                <TableHead>Contact Phone</TableHead>
                <TableHead>Account Standing</TableHead>
                <TableHead>Enrolled On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {s.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground">{s.fullName}</p>
                        <p className="text-[11px] text-muted-foreground">{s.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold">
                      {s.registrationNumber || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{s.phone || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.isActive ? 'success' : 'destructive'} size="sm">
                      {s.isActive ? 'Active' : 'Deactivated'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(s.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Edit Student"
                        onClick={() => handleOpenEdit(s)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`text-xs h-7 ${
                          s.isActive ? 'text-destructive hover:text-red-700' : 'text-emerald-600'
                        }`}
                        onClick={() => handleToggleStatus(s)}
                      >
                        {s.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingStudent ? 'Edit Student Details' : 'Enroll New Student'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <Input
            label="Full Legal Name"
            placeholder="e.g. David Kim"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="david.kim@examflow.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={Boolean(editingStudent)}
            required
          />

          <Input
            label="Registration / Roll Number"
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value)}
            required
          />

          <Input
            label="Contact Phone (Optional)"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Student
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
