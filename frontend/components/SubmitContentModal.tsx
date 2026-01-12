"use client";

import { useState, useEffect } from "react";
import { Send, Loader2, Link, AlertCircle } from "lucide-react";
import { useSubmitContent, useUserSubmission, useContest } from "@/lib/hooks/useContentRewards";
import { useWallet } from "@/lib/genlayer/wallet";
import { error } from "@/lib/utils/toast";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";

interface SubmitContentModalProps {
  contestId: number;
}

export function SubmitContentModal({ contestId }: SubmitContentModalProps) {
  const { isConnected, address, isLoading: isWalletLoading } = useWallet();
  const { submitContent, isSubmitting, isSuccess } = useSubmitContent();
  const { data: userSubmission } = useUserSubmission(contestId, address);
  const { data: contest } = useContest(contestId);

  const [isOpen, setIsOpen] = useState(false);
  const [contentUrl, setContentUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  const hasAlreadySubmitted = userSubmission?.has_submitted === true || userSubmission?.has_submitted === "true";
  const isContestActive = contest?.is_active === true || contest?.is_active === "true" || contest?.is_active === 1;
  const isContestClosed = contest && !isContestActive;
  const isContestFull = contest && Number(contest.accepted_count) >= Number(contest.max_winners);
  const isExpired = contest && Number(contest.deadline) > 0 && Number(contest.deadline) * 1000 < Date.now();

  const canSubmit = isConnected && !hasAlreadySubmitted && !isContestClosed && !isContestFull && !isExpired;

  // Auto-close modal when wallet disconnects
  useEffect(() => {
    if (!isConnected && isOpen && !isSubmitting) {
      setIsOpen(false);
    }
  }, [isConnected, isOpen, isSubmitting]);

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError("Content URL is required");
      return false;
    }

    try {
      new URL(url);
    } catch {
      setUrlError("Please enter a valid URL");
      return false;
    }

    // Check platform pattern if specified
    if (contest?.platform_pattern && contest.platform_pattern !== "*") {
      if (!url.toLowerCase().includes(contest.platform_pattern.toLowerCase())) {
        setUrlError(`URL must be from ${contest.platform_pattern}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      error("Please connect your wallet first");
      return;
    }

    setUrlError("");
    if (!validateUrl(contentUrl)) {
      return;
    }

    submitContent({
      contestId,
      contentUrl: contentUrl.trim(),
    });
  };

  const resetForm = () => {
    setContentUrl("");
    setUrlError("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      resetForm();
    }
    setIsOpen(open);
  };

  // Reset form and close modal on successful submission
  useEffect(() => {
    if (isSuccess) {
      resetForm();
      setIsOpen(false);
    }
  }, [isSuccess]);

  // Determine button state and message
  const getButtonState = () => {
    if (!isConnected) {
      return { disabled: true, text: "Connect Wallet" };
    }
    if (isWalletLoading) {
      return { disabled: true, text: "Loading..." };
    }
    if (hasAlreadySubmitted) {
      return { disabled: true, text: "Already Submitted" };
    }
    if (isContestClosed) {
      return { disabled: true, text: "Contest Closed" };
    }
    if (isContestFull) {
      return { disabled: true, text: "Contest Full" };
    }
    if (isExpired) {
      return { disabled: true, text: "Deadline Passed" };
    }
    return { disabled: false, text: "Submit Content" };
  };

  const buttonState = getButtonState();

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="gradient" disabled={buttonState.disabled}>
          <Send className="w-4 h-4 mr-2" />
          {buttonState.text}
        </Button>
      </DialogTrigger>
      <DialogContent className="brand-card border-2 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Submit Content</DialogTitle>
          <DialogDescription>
            Submit your content URL for validation
          </DialogDescription>
        </DialogHeader>

        {/* Contest Info */}
        {contest && (
          <div className="bg-white/5 rounded-lg p-4 space-y-2">
            <div className="text-sm font-semibold">Contest #{contestId}</div>
            <div className="text-sm text-muted-foreground">{contest.required_topic}</div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline">
                {contest.platform_pattern === "*" ? "Any Platform" : contest.platform_pattern}
              </Badge>
              <Badge variant="outline">
                {contest.spots_remaining} spots left
              </Badge>
            </div>
          </div>
        )}

        {/* Warning if already submitted */}
        {hasAlreadySubmitted && userSubmission && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-yellow-400">Already Submitted</div>
                <div className="text-sm text-muted-foreground mt-1">
                  You have already submitted to this contest.
                </div>
                <div className="text-sm mt-2">
                  Status:{" "}
                  <span
                    className={
                      userSubmission.status === "accepted"
                        ? "text-green-400"
                        : userSubmission.status === "rejected"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }
                  >
                    {userSubmission.status}
                  </span>
                </div>
                {userSubmission.rejection_reason && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {userSubmission.rejection_reason}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {canSubmit && (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Content URL */}
            <div className="space-y-2">
              <Label htmlFor="contentUrl" className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                Content URL *
              </Label>
              <Input
                id="contentUrl"
                type="url"
                placeholder="https://..."
                value={contentUrl}
                onChange={(e) => {
                  setContentUrl(e.target.value);
                  setUrlError("");
                }}
                className={urlError ? "border-destructive" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Enter the full URL to your published content
              </p>
              {urlError && <p className="text-xs text-destructive">{urlError}</p>}
            </div>

            {/* Info Box */}
            <div className="bg-accent/10 rounded-lg p-4 text-sm">
              <div className="font-semibold mb-2">What happens next?</div>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>1. Your content will be fetched and analyzed by AI</li>
                <li>2. Validators verify if it matches the required topic</li>
                <li>3. If accepted, you'll be added to the winners list</li>
                <li>4. Rewards will be distributed offline by the contest creator</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>

            {isSubmitting && (
              <p className="text-xs text-center text-muted-foreground">
                This may take a minute while AI validates your content...
              </p>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
