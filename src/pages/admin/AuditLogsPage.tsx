import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db/databaseService';
import { AuditLog, SecurityEvent } from '../../types';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { Search, ShieldAlert, FileText } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const AuditLogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'security'>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const [audits, sec] = await Promise.all([
      dbService.getAuditLogs(),
      dbService.getSecurityEvents(),
    ]);
    setAuditLogs(audits);
    setSecurityEvents(sec);
  };

  const filteredAudits = auditLogs.filter((log) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        log.resourceType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredSecurity = securityEvents.filter((ev) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return ev.eventType.toLowerCase().includes(q) || ev.details.toLowerCase().includes(q);
    }
    return true;
  });

  const currentList = activeTab === 'audit' ? filteredAudits : filteredSecurity;
  const totalPages = Math.ceil(currentList.length / pageSize) || 1;
  const paginatedList = currentList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit & Security Logs</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Immutable event trails covering administrative actions and proctoring violation incidents
        </p>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={(t) => {
          setActiveTab(t as any);
          setCurrentPage(1);
        }}
        variant="pills"
        tabs={[
          {
            id: 'audit',
            label: 'Administrative Audit Trail',
            count: auditLogs.length,
            icon: <FileText className="h-4 w-4" />,
          },
          {
            id: 'security',
            label: 'Proctoring Security Violations',
            count: securityEvents.length,
            icon: <ShieldAlert className="h-4 w-4" />,
          },
        ]}
      />

      <div className="max-w-md">
        <Input
          placeholder="Filter logs by actor, action or event..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {activeTab === 'audit' ? (
        <div className="bg-card rounded-lg border border-border shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(paginatedList as AuditLog[]).map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-foreground text-xs block">
                      {log.actorName}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase">{log.actorRole}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground capitalize">
                      {log.resourceType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <code className="text-[11px] bg-muted/60 px-1.5 py-0.5 rounded text-muted-foreground">
                      {JSON.stringify(log.metadata)}
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAudits.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Incident Details</TableHead>
                <TableHead>Attempt Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(paginatedList as SecurityEvent[]).map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(ev.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="warning" size="sm" className="capitalize">
                      {ev.eventType.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ev.severity === 'critical'
                          ? 'destructive'
                          : ev.severity === 'high'
                          ? 'destructive'
                          : ev.severity === 'medium'
                          ? 'warning'
                          : 'secondary'
                      }
                      size="sm"
                      className="uppercase"
                    >
                      {ev.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-foreground font-medium">
                    {ev.details}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {ev.attemptId}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSecurity.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
