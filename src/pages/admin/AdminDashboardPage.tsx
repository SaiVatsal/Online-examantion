import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../../services/db/databaseService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Users,
  GraduationCap,
  HelpCircle,
  FileSpreadsheet,
  Award,
  CheckCircle2,
  ShieldAlert,
  Plus,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatDate } from '../../lib/utils';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getAdminDashboardMetrics();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Realistic score distribution chart data
  const scoreDistributionData = [
    { range: '0-20%', count: 0 },
    { range: '21-40%', count: 0 },
    { range: '41-60%', count: 1 },
    { range: '61-80%', count: 0 },
    { range: '81-100%', count: 1 },
  ];

  const passFailData = [
    { name: 'Passed', value: Math.max(1, metrics.passPercentage), color: '#10b981' },
    { name: 'Failed', value: Math.max(0, 100 - metrics.passPercentage), color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Administrative Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Institutional examination metrics, active proctoring logs, and academic standing
          </p>
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/questions')}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Question
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/exams/create')}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Examination
          </Button>
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase">Students</span>
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{metrics.totalStudents}</p>
            <span className="text-[10px] text-emerald-600 font-medium">Enrolled</span>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase">Instructors</span>
              <Users className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{metrics.totalInstructors}</p>
            <span className="text-[10px] text-muted-foreground font-medium">Faculty Staff</span>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase">Questions</span>
              <HelpCircle className="h-4 w-4 text-sky-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{metrics.totalQuestions}</p>
            <span className="text-[10px] text-muted-foreground font-medium">Question Bank</span>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase">Live Exams</span>
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{metrics.liveExams}</p>
            <span className="text-[10px] text-emerald-600 font-medium">
              {metrics.totalExams} Total
            </span>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase">Pass Rate</span>
              <Award className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{metrics.passPercentage}%</p>
            <span className="text-[10px] text-muted-foreground font-medium">All attempts</span>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase">Avg. Score</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{metrics.averageScore}%</p>
            <span className="text-[10px] text-muted-foreground font-medium">Normalized</span>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Distribution Histogram */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Candidate Score Distribution</span>
              <span className="text-xs font-normal text-muted-foreground">Performance brackets</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pass vs Fail Ratio */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Pass / Fail Outcome Ratio</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={passFailData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {passFailData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 text-xs mt-2">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Passed ({metrics.passPercentage}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                Failed ({Math.max(0, 100 - metrics.passPercentage)}%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Split Activity & Security Logs Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Proctoring & Security Incidents */}
        <Card>
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <ShieldAlert className="h-4 w-4 text-amber-500" /> Recent Proctoring Events
            </CardTitle>
            <Button
              variant="link"
              size="sm"
              className="text-xs"
              onClick={() => navigate('/admin/audit-logs')}
            >
              View All →
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {metrics.recentSecurityEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No security violations recorded.</p>
            ) : (
              metrics.recentSecurityEvents.map((ev: any) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-md border border-border bg-card flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-foreground capitalize block truncate">
                      {ev.eventType.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-muted-foreground line-clamp-1">
                      {ev.details}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDate(ev.timestamp)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Administrative Audit Trail */}
        <Card>
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Audit Trail Stream
            </CardTitle>
            <Button
              variant="link"
              size="sm"
              className="text-xs"
              onClick={() => navigate('/admin/audit-logs')}
            >
              View Full Audit →
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {metrics.recentActivity.slice(0, 5).map((log: any) => (
              <div
                key={log.id}
                className="p-2.5 rounded-md border border-border bg-card flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-foreground block truncate">
                    {log.action}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    by {log.actorName} ({log.actorRole})
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDate(log.timestamp)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
