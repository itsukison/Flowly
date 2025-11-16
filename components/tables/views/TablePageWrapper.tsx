"use client";

import { Suspense } from 'react';
import { PageLoading } from '@/components/ui/loading';
import { ErrorBoundary, ErrorFallback } from '@/components/ui/error-boundary';

interface TablePageWrapperProps {
  children: React.ReactNode;
  title?: string;
}

export function TablePageWrapper({ children, title = "テーブルページ" }: TablePageWrapperProps) {
  return (
    <ErrorBoundary
      fallback={(props) => (
        <ErrorFallback
          {...props}
          title={`${title}の読み込みエラー`}
          description={`${title}の読み込み中にエラーが発生しました。もう一度お試しください。`}
        />
      )}
    >
      <Suspense fallback={<PageLoading message={`${title}を読み込み中...`} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}