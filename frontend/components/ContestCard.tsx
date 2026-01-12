"use client";

import { Trophy, Users, Clock, Globe, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { AddressDisplay } from "./AddressDisplay";
import type { Contest } from "@/lib/contracts/types";

interface ContestCardProps {
  contest: Contest;
  onSelect: (contestId: number) => void;
  isSelected: boolean;
}

export function ContestCard({ contest, onSelect, isSelected }: ContestCardProps) {
  // Handle is_active as it might come as boolean, string, or number from contract
  const isActive = contest.is_active === true || contest.is_active === "true" || contest.is_active === 1;
  const deadlineNum = Number(contest.deadline);
  const isExpired = deadlineNum > 0 && deadlineNum * 1000 < Date.now();
  const isFull = Number(contest.accepted_count) >= Number(contest.max_winners);
  const isClosed = !isActive || isExpired || isFull;

  const formatDeadline = (timestamp: number | bigint) => {
    const ts = Number(timestamp);
    if (ts === 0) return "No deadline";
    const date = new Date(ts * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = () => {
    if (!isActive) {
      return (
        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
          <XCircle className="w-3 h-3 mr-1" />
          Closed
        </Badge>
      );
    }
    if (isFull) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Complete
        </Badge>
      );
    }
    if (isExpired) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }
    return (
      <Badge className="bg-accent/20 text-accent border-accent/30">
        <Trophy className="w-3 h-3 mr-1" />
        Active
      </Badge>
    );
  };

  return (
    <div
      className={`brand-card p-5 cursor-pointer transition-all hover:border-accent/50 ${
        isSelected ? "border-accent border-2" : ""
      }`}
      onClick={() => onSelect(Number(contest.contest_id))}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">Contest #{String(contest.contest_id)}</span>
            {getStatusBadge()}
          </div>
          <h3 className="text-lg font-bold line-clamp-2">{contest.required_topic}</h3>
        </div>
      </div>

      {/* Platform */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        <Globe className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">Platform:</span>
        <span className="font-medium">
          {contest.platform_pattern === "*" ? "Any URL" : contest.platform_pattern}
        </span>
      </div>

      {/* Reward */}
      <div className="bg-accent/10 rounded-lg p-3 mb-4">
        <div className="text-xs text-muted-foreground mb-1">Reward</div>
        <div className="font-semibold text-accent">{contest.reward_description}</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-2 bg-white/5 rounded-lg">
          <div className="text-2xl font-bold text-accent">
            {String(contest.spots_remaining)}
          </div>
          <div className="text-xs text-muted-foreground">Spots Left</div>
        </div>
        <div className="text-center p-2 bg-white/5 rounded-lg">
          <div className="text-2xl font-bold">
            {String(contest.accepted_count)}/{String(contest.max_winners)}
          </div>
          <div className="text-xs text-muted-foreground">Winners</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-white/10">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDeadline(contest.deadline)}
        </div>
        <div className="flex items-center gap-1">
          <span>By:</span>
          <AddressDisplay address={contest.creator} maxLength={8} />
        </div>
      </div>
    </div>
  );
}
