import { Github, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="glass-header mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-sm text-foreground font-medium">
              Error Debugger Pro - Intelligent Backend Error Analysis
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Built with Next.js, React, and TypeScript
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2.5 text-muted-foreground transition-smooth hover:bg-muted/50 hover:text-foreground"
            >
              <Github className="h-5 w-5" />
            </a>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              Made with <Heart className="inline h-4 w-4 text-destructive fill-destructive" /> by developers
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
