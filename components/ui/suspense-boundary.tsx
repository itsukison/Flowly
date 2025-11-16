"use client";

import React, { Suspense } from 'react';
import { PageLoading } from './loading';
import { ErrorBoundary, ErrorFallback } from './error-boundary';

interface SuspenseBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorTitle?: string;
  errorDescription?: string;
}

export function SuspenseBoundary({
  children,
  fallback = <PageLoading />,
  errorTitle,
  errorDescription
}: SuspenseBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={(props) => (
        <ErrorFallback
          {...props}
          title={errorTitle}
          description={errorDescription}
        />
      )}
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

interface AsyncBoundaryProps {
  children: React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ComponentType<{ error?: Error; reset: () => void }>;
  errorTitle?: string;
  errorDescription?: string;
}

export function AsyncBoundary({
  children,
  loading,
  error,
  errorTitle,
  errorDescription
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={error || ((props) => (
        <ErrorFallback
          {...props}
          title={errorTitle}
          description={errorDescription}
        />
      ))}
    >
      <Suspense fallback={loading || <PageLoading />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}