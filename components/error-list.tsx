'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Clock } from 'lucide-react';
import type { ErrorRecord } from '@/lib/db';

const SEVERITY_COLORS = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-400 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-accent text-white',
};

export function ErrorList() {
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchErrors = async () => {
      try {
        const response = await fetch('/api/errors?limit=10');
        if (response.ok) {
          const data = await response.json();
          setErrors(data);
        }
      } catch (error) {
        console.error('Failed to fetch errors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchErrors();
    const interval = setInterval(fetchErrors, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card className="glass-card border-0 shadow-2xl relative z-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-6 w-6 text-primary" />
            Recent Errors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/30" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errors.length === 0) {
    return (
      <Card className="glass-card border-0 shadow-2xl relative z-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-6 w-6 text-primary" />
            Recent Errors
          </CardTitle>
          <CardDescription>No errors recorded yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 p-4 mb-4">
              <AlertCircle className="h-12 w-12 text-primary" />
            </div>
            <p className="text-center text-muted-foreground">
              Submit your first error to get started with analysis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-0 shadow-2xl relative z-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="h-6 w-6 text-primary" />
          Recent Errors
        </CardTitle>
        <CardDescription>{errors.length} error(s) analyzed</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {errors.map((error) => (
            <Link
              key={error.id}
              href={`/error/${error.id}`}
              className="block rounded-xl border border-primary/20 bg-background/30 backdrop-blur-sm p-4 transition-smooth hover:border-primary/40 hover:shadow-lg hover:bg-background/50 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-mono text-sm font-semibold text-foreground line-clamp-1">
                      {error.errorType}
                    </p>
                    {error.analysis && (
                      <Badge className={SEVERITY_COLORS[error.analysis.severity]}>
                        {error.analysis.severity.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {error.errorMessage}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(error.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  {error.analysis && (
                    <Badge variant="outline" className="text-xs border-primary/30">
                      {error.analysis.category}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
