import { Skeleton } from "@/components/ui/skeleton";

export function MatchCardSkeleton() {
  return (
    <div className="rounded-3xl bg-surface p-4 shadow-card">
      <div className="flex items-start gap-3">
        <Skeleton className="size-11" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-7 w-20" />
      </div>
      <Skeleton className="mt-4 h-4 w-48" />
      <Skeleton className="mt-2 h-3 w-60" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}
