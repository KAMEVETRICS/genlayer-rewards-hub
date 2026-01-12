/**
 * TypeScript types for GenLayer Content Rewards contract
 */

export interface Contest {
  contest_id: number;
  creator: string;
  platform_pattern: string;
  required_topic: string;
  reward_description: string;
  max_winners: number;
  deadline: number;
  accepted_count: number;
  is_active: boolean | string | number;
  spots_remaining: number;
}

export interface Submission {
  submitter: string;
  content_url: string;
  status: "pending" | "accepted" | "rejected" | "voided";
  rejection_reason: string;
}

export interface UserSubmission {
  has_submitted: boolean | string | number;
  content_url?: string;
  status?: "pending" | "accepted" | "rejected" | "voided";
  rejection_reason?: string;
}

export interface SubmitResult {
  status: "accepted" | "rejected" | "voided";
  reason: string;
}

export interface TransactionReceipt {
  status: string;
  hash: string;
  blockNumber?: number;
  data?: any;
  [key: string]: any;
}

// Legacy types (kept for compatibility)
export interface Bet {
  id: string;
  game_date: string;
  team1: string;
  team2: string;
  predicted_winner: string;
  has_resolved: boolean;
  real_winner?: string;
  real_score?: string;
  resolution_url?: string;
  owner: string;
}

export interface LeaderboardEntry {
  address: string;
  points: number;
}

export interface BetFilters {
  resolved?: boolean;
  owner?: string;
}
