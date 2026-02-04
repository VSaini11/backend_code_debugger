'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Copy, CheckCircle2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import type { ErrorRecord } from '@/lib/db';

const SEVERITY_COLORS = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-blue-500 text-white',
};

export default function ErrorDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [error, setError] = useState<ErrorRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchError = async () => {
      try {
        const response = await fetch(`/api/errors/${id}`);
        if (!response.ok) throw new Error('Error not found');
        const data = await response.json();
        setError(data);
      } catch (error) {
        console.error('Failed to fetch error:', error);
        toast.error('Error not found');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchError();
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this error?')) return;

    try {
      const response = await fetch(`/api/errors/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Error deleted');
      router.push('/');
    } catch (error) {
      toast.error('Failed to delete error');
      console.error(error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="space-y-4">
              <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
              <div className="h-96 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!error) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="space-y-6">
            {/* Error Header */}
            <Card className="border-border shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-2">
                      <h1 className="font-mono text-2xl font-bold text-foreground">
                        {error.errorType}
                      </h1>
                      {error.analysis && (
                        <Badge className={SEVERITY_COLORS[error.analysis.severity]}>
                          {error.analysis.severity.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg text-muted-foreground">
                      {error.errorMessage}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                <CardDescription className="mt-4">
                  Submitted {new Date(error.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Analysis Section */}
            {error.analysis && (
              <Card className="border-border shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <CardTitle>Analysis Results</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold text-foreground">Category</p>
                      <Badge variant="outline">{error.analysis.category}</Badge>
                    </div>
                  </div>

                  {/* Confidence Score */}
                  {error.analysis.confidenceScore !== undefined && (
                    <div>
                      <div className="mb-2">
                        <p className="font-semibold text-foreground mb-3">Confidence Score</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Analysis Reliability</span>
                            <Badge
                              variant="outline"
                              className={
                                error.analysis.confidenceScore >= 0.8
                                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                                  : error.analysis.confidenceScore >= 0.6
                                    ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                                    : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
                              }
                            >
                              {Math.round(error.analysis.confidenceScore * 100)}%
                            </Badge>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full transition-all ${error.analysis.confidenceScore >= 0.8
                                  ? 'bg-green-500'
                                  : error.analysis.confidenceScore >= 0.6
                                    ? 'bg-yellow-500'
                                    : 'bg-orange-500'
                                }`}
                              style={{ width: `${error.analysis.confidenceScore * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {error.analysis.confidenceScore >= 0.8
                              ? 'High confidence - Analysis is highly reliable'
                              : error.analysis.confidenceScore >= 0.6
                                ? 'Medium confidence - Analysis is reasonably reliable'
                                : 'Low confidence - Analysis based on limited information'}
                          </p>
                        </div>
                      </div>
                      {error.analysis.analysisMetadata && (
                        <div className="mt-3 rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">
                            Analyzed by <span className="font-mono font-medium text-foreground">{error.analysis.analysisMetadata.model}</span>
                            {' '}in {error.analysis.analysisMetadata.processingTimeMs.toFixed(0)}ms
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="mb-2 font-semibold text-foreground">Root Cause</p>
                    <p className="rounded-lg bg-muted p-3 font-mono text-sm text-foreground">
                      {error.analysis.rootCause}
                    </p>
                  </div>

                  <div>
                    <p className="mb-3 font-semibold text-foreground">
                      Recommendations
                    </p>
                    <div className="space-y-2">
                      {error.analysis.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex gap-3 rounded-lg border border-border bg-card p-3"
                        >
                          <Lightbulb className="h-5 w-5 flex-shrink-0 text-primary" />
                          <p className="text-sm text-foreground">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Details */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Stack Trace */}
              {error.stackTrace && (
                <Card className="border-border shadow-lg lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Stack Trace</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative rounded-lg bg-muted p-4">
                      <pre className="overflow-x-auto font-mono text-xs text-foreground">
                        {error.stackTrace}
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute right-2 top-2 gap-2 bg-transparent"
                        onClick={() => copyToClipboard(error.stackTrace)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Context */}
              {error.context && (
                <Card className="border-border shadow-lg">
                  <CardHeader>
                    <CardTitle>Context</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm text-foreground">{error.context}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              <Card className="border-border shadow-lg">
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Error ID</p>
                    <p className="font-mono text-sm text-foreground">{error.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Timestamp</p>
                    <p className="text-sm text-foreground">
                      {new Date(error.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-mono text-sm text-foreground">{error.errorType}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
