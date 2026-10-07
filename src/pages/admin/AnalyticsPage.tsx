import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db/databaseService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
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

export const AnalyticsPage: React.FC = () => {
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const [sList, qList] = await Promise.all([
        dbService.getSecurityEvents(),
        dbService.getQuestions(),
      ]);
      setSecurityEvents(sList);
      setQuestions(qList);
    }
    loadData();
  }, []);

  const difficultyBreakdown = [
    { name: 'Easy', count: questions.filter((q) => q.difficulty === 'easy').length, color: '#10b981' },
    { name: 'Medium', count: questions.filter((q) => q.difficulty === 'medium').length, color: '#f59e0b' },
    { name: 'Hard', count: questions.filter((q) => q.difficulty === 'hard').length, color: '#ef4444' },
  ];

  const violationTypeCounts: Record<string, number> = {};
  securityEvents.forEach((ev) => {
    const key = ev.eventType.replace('_', ' ');
    violationTypeCounts[key] = (violationTypeCounts[key] || 0) + 1;
  });

  const securityIncidentData = Object.entries(violationTypeCounts).map(([type, count]) => ({
    type,
    count,
  }));

  const subjectPerformance = [
    { subject: 'Early Childhood (ECE)', avgScore: 95, attempts: 1 },
    { subject: 'Computer Science (CS)', avgScore: 65, attempts: 1 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Examination Analytics</h1>
        <p className="text-xs text-muted-foreground mt-1">
          In-depth institutional evaluation metrics, item difficulty distributions, and proctoring analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Question Difficulty Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Question Difficulty Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-60 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={difficultyBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {difficultyBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 text-xs mt-2">
              {difficultyBreakdown.map((item) => (
                <span key={item.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}: {item.count}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Incident Breakdown */}
        <Card className="md:col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Proctoring Violations by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-60 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={securityIncidentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Subject-Level Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent className="h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="avgScore" fill="#2563eb" radius={[4, 4, 0, 0]} name="Average Score %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
