"use client";

import { Loader2, Trophy, AlertCircle } from "lucide-react";
import { useContests, useContentRewardsContract } from "@/lib/hooks/useContentRewards";
import { ContestCard } from "./ContestCard";

interface ContestListProps {
  selectedContestId: number | null;
  onSelectContest: (contestId: number) => void;
  showOnlyActive?: boolean;
}

export function ContestList({
  selectedContestId,
  onSelectContest,
  showOnlyActive = false,
}: ContestListProps) {
  const contract = useContentRewardsContract();
  const { data: contests, isLoading, isError } = useContests();

  if (isLoading) {
    return (
      <div className="brand-card p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Loading contests...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="brand-card p-12">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-yellow-400 opacity-60" />
          <h3 className="text-xl font-bold">Setup Required</h3>
          <div className="space-y-2">
            <p className="text-muted-foreground">Contract address not configured.</p>
            <p className="text-sm text-muted-foreground">
              Please set{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                NEXT_PUBLIC_CONTRACT_ADDRESS
              </code>{" "}
              in your .env file.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="brand-card p-8">
        <div className="text-center">
          <p className="text-destructive">Failed to load contests. Please try again.</p>
        </div>
      </div>
    );
  }

  // Filter contests if needed
  let displayContests = contests || [];
  if (showOnlyActive) {
    displayContests = displayContests.filter((c) => c.is_active && c.spots_remaining > 0);
  }

  // Sort by contest_id descending (newest first)
  displayContests = [...displayContests].sort((a, b) => Number(b.contest_id) - Number(a.contest_id));

  if (displayContests.length === 0) {
    return (
      <div className="brand-card p-12">
        <div className="text-center space-y-3">
          <Trophy className="w-16 h-16 mx-auto text-muted-foreground opacity-30" />
          <h3 className="text-xl font-bold">No Contests Yet</h3>
          <p className="text-muted-foreground">
            {showOnlyActive
              ? "No active contests available. Create one to get started!"
              : "Be the first to create a content rewards contest!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          {showOnlyActive ? "Active Contests" : "All Contests"}
        </h2>
        <span className="text-sm text-muted-foreground">
          {displayContests.length} contest{displayContests.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayContests.map((contest, index) => (
          <ContestCard
            key={`contest-${contest.contest_id ?? index}`}
            contest={contest}
            onSelect={onSelectContest}
            isSelected={selectedContestId === Number(contest.contest_id)}
          />
        ))}
      </div>
    </div>
  );
}
