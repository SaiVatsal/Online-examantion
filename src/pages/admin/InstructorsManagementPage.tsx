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
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/ToastContext';
import { Search, UserPlus, Users } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const InstructorsManagementPage: React.FC = () => {
  const [instructors, setInstructors] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toast = useToast();

  useEffect(() => {
    loadInstructors();
  }, []);

  const loadInstructors = async () => {
    const list = await dbService.getProfiles('instructor');
    setInstructors(list);
  };

  const handleOpenAdd = () => {
    setEditingInstructor(null);
    setFullName('');
    setEmail('');
    setRegNumber(`FAC-2026-${Math.floor(100 + Math.random() * 900)}`);
    setPhone('');
    setDialogOpen(true);
  };

  const handleToggleStatus = async (inst: UserProfile) => {
    try {
      await dbService.toggleUserActive(inst.id);
      toast.success(`Instructor account for ${inst.fullName} updated.`);
      loadInstructors();
    } catch (e: any) {
      toast.error(e.message || 'Action failed');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setIsSaving(true);
    try {
      if (editingInstructor) {
        await dbService.updateProfile(editingInstructor.id, {
          fullName,
          phone,
          registrationNumber: regNumber,
        });
        toast.success('Instructor details updated.');
      } else {
        await dbService.createProfile({
          fullName,
          email,
          role: 'instructor',
          phone,
          registrationNumber: regNumber,
          isActive: true,
        });
        toast.success('New faculty member appointed.');
      }
      setDialogOpen(false);
      loadInstructors();
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = instructors.filter((i) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        i.fullName.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        i.registrationNumber?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Instructor & Faculty Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Authorize question bank authors, exam coordinators, and essay evaluators
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <UserPlus className="h-4 w-4 mr-1.5" />
          Add Faculty Member
        </Button>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Search instructors by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No instructors found"
          description="Appointed instructor accounts will appear here."
          actionText="Add Instructor"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instructor</TableHead>
                <TableHead>Faculty ID</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Standing</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inst) => (
                <TableRow key={inst.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {inst.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground">{inst.fullName}</p>
                        <p className="text-[11px] text-muted-foreground">{inst.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold">
                      {inst.registrationNumber || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{inst.phone || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={inst.isActive ? 'success' : 'destructive'} size="sm">
                      {inst.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(inst.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-xs h-7 ${
                        inst.isActive ? 'text-destructive hover:text-red-700' : 'text-emerald-600'
                      }`}
                      onClick={() => handleToggleStatus(inst)}
                    >
                      {inst.isActive ? 'Disable' : 'Enable'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingInstructor ? 'Edit Faculty Member' : 'Appoint New Faculty Member'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full Name & Title"
            placeholder="e.g. Prof. Alan Turing"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Institutional Email"
            type="email"
            placeholder="alan.turing@examflow.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={Boolean(editingInstructor)}
            required
          />

          <Input
            label="Faculty ID / Code"
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value)}
            required
          />

          <Input
            label="Phone"
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
              Save Instructor
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
