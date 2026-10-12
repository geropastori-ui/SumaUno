import { MatchCardSkeleton } from "@/components/match/match-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="px-5 pt-6">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-2 h-4 w-56" />
      <div className="mt-6 flex flex-col gap-3">
        <MatchCardSkeleton />
        <MatchCardSkeleton />
        <MatchCardSkeleton />
      </div>
    </div>
  );
}
