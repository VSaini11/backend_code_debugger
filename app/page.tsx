'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ErrorStats } from '@/components/error-stats';
import { ErrorForm } from '@/components/error-form';
import { ErrorList } from '@/components/error-list';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <ErrorStats key={refreshKey} />

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <ErrorForm onSuccess={() => setRefreshKey(prev => prev + 1)} />
              </div>
              <div className="lg:col-span-2">
                <ErrorList />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
