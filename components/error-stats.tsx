'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Bug, TrendingDown, Clock } from 'lucide-react';
import type { ErrorRecord } from '@/lib/db';

interface ErrorStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  recentHours: number;
}

export function ErrorStats() {
  const [stats, setStats] = useState<ErrorStats>({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    recentHours: 0,
  });

  useEffect(() => {
    const fetchErrors = async () => {
      try {
        const response = await fetch('/api/errors');
        if (response.ok) {
          const errors: ErrorRecord[] = await response.json();

          const now = Date.now();
          const oneHourAgo = now - 60 * 60 * 1000;

          const counts = {
            total: errors.length,
            critical: errors.filter(e => e.analysis?.severity === 'critical').length,
            high: errors.filter(e => e.analysis?.severity === 'high').length,
            medium: errors.filter(e => e.analysis?.severity === 'medium').length,
            low: errors.filter(e => e.analysis?.severity === 'low').length,
            recentHours: errors.filter(e => e.timestamp > oneHourAgo).length,
          };

          setStats(counts);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchErrors();
    const interval = setInterval(fetchErrors, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="glass-card glow-hover transition-smooth border-0 relative z-10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Errors</p>
              <p className="text-4xl font-bold text-foreground mt-2">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-3">
              <Bug className="h-8 w-8 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card glow-hover transition-smooth border-0 relative z-10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Critical</p>
              <p className="text-4xl font-bold text-destructive mt-2">{stats.critical}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/10 p-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card glow-hover transition-smooth border-0 relative z-10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">High Severity</p>
              <p className="text-4xl font-bold text-orange-400 mt-2">{stats.high}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-orange-400/20 to-orange-400/10 p-3">
              <TrendingDown className="h-8 w-8 text-orange-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card glow-hover transition-smooth border-0 relative z-10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Last 24h</p>
              <p className="text-4xl font-bold text-accent mt-2">{stats.recentHours}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 p-3">
              <Clock className="h-8 w-8 text-accent" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
