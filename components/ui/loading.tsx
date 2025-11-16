import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-gray-900",
        sizeClasses[size],
        className
      )}
    />
  )
}

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-3 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}

interface CardSkeletonProps {
  count?: number
}

export function CardSkeleton({ count = 6 }: CardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="space-y-4">
            {/* Icon */}
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />

            {/* Title */}
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />

            {/* Description */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = "読み込み中..." }: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-600">{message}</p>
    </div>
  )
}

interface FormSkeletonProps {
  fields?: number
}

export function FormSkeleton({ fields = 4 }: FormSkeletonProps) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}

      {/* Button */}
      <div className="flex justify-end">
        <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
      </div>
    </div>
  )
}