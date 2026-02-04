import Link from 'next/link';
import { CircuitBoard, BarChart3 } from 'lucide-react';

export function Header() {
  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          <Link href="/" className="flex items-center gap-3 transition-smooth hover:opacity-90">
            <div className="rounded-xl gradient-primary p-3 shadow-lg glow">
              <CircuitBoard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">Error Debugger Pro</h1>
              <p className="text-sm text-muted-foreground">
                Real-time error analysis and intelligent debugging platform
              </p>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/history"
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground hover:bg-muted/50 hover:shadow-lg"
            >
              <BarChart3 className="h-4 w-4" />
              History
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
