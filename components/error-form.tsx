'use client';

import React from "react"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ErrorFormProps {
  onSuccess?: () => void;
}

export function ErrorForm({ onSuccess }: ErrorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    errorMessage: '',
    errorType: 'Error',
    stackTrace: '',
    context: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.errorMessage.trim()) {
      toast.error('Please enter an error message');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to submit error');

      toast.success('Error analyzed and saved successfully');
      setFormData({ errorMessage: '', errorType: 'Error', stackTrace: '', context: '' });
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to submit error. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card border-0 shadow-2xl relative z-10">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/10 p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-xl">Submit Error for Analysis</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Describe your error and get instant analysis with recommendations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Error Message *</label>
            <textarea
              value={formData.errorMessage}
              onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
              placeholder="Describe the error you encountered..."
              className="mt-1 w-full rounded-xl border border-primary/20 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-smooth backdrop-blur-sm"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Error Type</label>
              <input
                type="text"
                value={formData.errorType}
                onChange={(e) => setFormData({ ...formData, errorType: e.target.value })}
                placeholder="e.g., TypeError, NetworkError"
                className="mt-1 w-full rounded-xl border border-primary/20 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-smooth backdrop-blur-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Stack Trace (Optional)</label>
            <textarea
              value={formData.stackTrace}
              onChange={(e) => setFormData({ ...formData, stackTrace: e.target.value })}
              placeholder="Paste your stack trace here..."
              className="mt-1 w-full rounded-xl border border-primary/20 bg-background/50 px-4 py-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-smooth backdrop-blur-sm"
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Context (Optional)</label>
            <input
              type="text"
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              placeholder="e.g., Production environment, User signup flow"
              className="mt-1 w-full rounded-xl border border-primary/20 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-smooth backdrop-blur-sm"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full gap-2 gradient-primary text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-smooth hover:scale-[1.02]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>Analyze Error</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
