"use client";

import { Loader2, CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy, Trophy } from "lucide-react";
import { useSubmissions, useWinners, useContest, useCloseContest } from "@/lib/hooks/useContentRewards";
import { useWallet } from "@/lib/genlayer/wallet";
import { AddressDisplay } from "./AddressDisplay";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { success } from "@/lib/utils/toast";
import type { Submission } from "@/lib/contracts/types";

interface SubmissionsTableProps {
  contestId: number;
}

export function SubmissionsTable({ contestId }: SubmissionsTableProps) {
  const { data: submissions, isLoading } = useSubmissions(contestId);
  const { data: winners } = useWinners(contestId);
  const { data: contest } = useContest(contestId);
  const { address } = useWallet();
  const { closeContest, isClosing } = useCloseContest();

  const isCreator = contest?.creator?.toLowerCase() === address?.toLowerCase();
  const isActive = contest?.is_active === true || contest?.is_active === "true" || contest?.is_active === 1;
  const canClose = isCreator && isActive;

  const handleCopyWinners = async () => {
    if (winners && winners.length > 0) {
      await navigator.clipboard.writeText(winners.join("\n"));
      success("Winner addresses copied to clipboard!");
    }
  };

  const handleCloseContest = () => {
    if (confirm("Are you sure you want to close this contest? This action cannot be undone.")) {
      closeContest(Number(contestId));
    }
  };

  const getStatusBadge = (status: Submission["status"]) => {
    switch (status) {
      case "accepted":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "voided":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Voided
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="brand-card p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contest Info Header */}
      {contest && (
        <div className="brand-card p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Contest #{String(contestId)}</h2>
              <p className="text-muted-foreground text-sm">{contest.required_topic}</p>
            </div>
            <div className="flex items-center gap-3">
              {winners && winners.length > 0 && (
                <Button variant="secondary" size="sm" onClick={handleCopyWinners}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Winners ({winners.length})
                </Button>
              )}
              {canClose && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCloseContest}
                  disabled={isClosing}
                >
                  {isClosing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Closing...
                    </>
                  ) : (
                    "Close Contest"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submissions Table */}
      <div className="brand-card p-6 overflow-hidden">
        {!submissions || submissions.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-3" />
            <p className="text-muted-foreground">No submissions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to submit content to this contest!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Submitter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Content URL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions.map((submission, index) => {
                  const isCurrentUser =
                    submission.submitter.toLowerCase() === address?.toLowerCase();
                  return (
                    <tr
                      key={submission.submitter}
                      className={`group hover:bg-white/5 transition-colors ${
                        isCurrentUser ? "bg-accent/5" : ""
                      }`}
                    >
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <AddressDisplay
                            address={submission.submitter}
                            maxLength={10}
                            showCopy={true}
                          />
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <a
                          href={submission.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-accent hover:underline text-sm max-w-xs truncate"
                        >
                          {submission.content_url.length > 40
                            ? submission.content_url.slice(0, 40) + "..."
                            : submission.content_url}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground max-w-xs">
                        {submission.rejection_reason || (
                          submission.status === "accepted" ? "Content validated" : "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Winners Summary */}
      {winners && winners.length > 0 && (
        <div className="brand-card p-4">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Winners ({winners.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {winners.map((winner, index) => (
              <div
                key={winner}
                className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2"
              >
                <span className="text-xs text-muted-foreground">#{index + 1}</span>
                <AddressDisplay address={winner} maxLength={10} showCopy={true} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
