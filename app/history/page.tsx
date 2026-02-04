'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { ErrorRecord } from '@/lib/db';

const SEVERITY_COLORS = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-blue-500 text-white',
};

export default function HistoryPage() {
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filteredErrors, setFilteredErrors] = useState<ErrorRecord[]>([]);

  useEffect(() => {
    const fetchErrors = async () => {
      try {
        const response = await fetch('/api/errors');
        if (response.ok) {
          const data = await response.json();
          setErrors(data.sort((a: ErrorRecord, b: ErrorRecord) => b.timestamp - a.timestamp));
        }
      } catch (error) {
        console.error('Failed to fetch errors:', error);
        toast.error('Failed to load errors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchErrors();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredErrors(errors);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredErrors(
        errors.filter(
          (e) =>
            e.errorMessage.toLowerCase().includes(query) ||
            e.errorType.toLowerCase().includes(query) ||
            e.context.toLowerCase().includes(query) ||
            e.id.includes(query)
        )
      );
    }
  }, [searchQuery, errors]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this error?')) return;
    try {
      const response = await fetch(`/api/errors/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      setErrors(errors.filter((e) => e.id !== id));
      toast.success('Error deleted');
    } catch {
      toast.error('Failed to delete error');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Error History
              </CardTitle>
              <CardDescription>
                View and search all error records with detailed analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search errors by message, type, context, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : filteredErrors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Search className="mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No errors match your search' : 'No errors recorded yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredErrors.map((error) => (
                    <Link
                      key={error.id}
                      href={`/error/${error.id}`}
                      className="block rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-medium text-foreground">
                              {error.errorType}
                            </p>
                            {error.analysis && (
                              <Badge className={SEVERITY_COLORS[error.analysis.severity]}>
                                {error.analysis.severity.toUpperCase()}
                              </Badge>
                            )}
                            {error.analysis && (
                              <Badge variant="outline" className="text-xs">
                                {error.analysis.category}
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
                          {error.context && (
                            <p className="text-xs text-muted-foreground">
                              Context: {error.context}
                            </p>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(error.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-6 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredErrors.length} of {errors.length} error(s)
                </p>
              </div>
            </CardContent>
        </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
