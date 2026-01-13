"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Globe, FileText, Trophy, Clock, Gift } from "lucide-react";
import { useCreateContest } from "@/lib/hooks/useContentRewards";
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

export function CreateContestModal() {
  const { isConnected, address, isLoading } = useWallet();
  const { createContest, isCreating, isSuccess } = useCreateContest();

  const [isOpen, setIsOpen] = useState(false);
  const [platformPattern, setPlatformPattern] = useState("");
  const [requiredTopic, setRequiredTopic] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [maxWinners, setMaxWinners] = useState("");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");

  const [errors, setErrors] = useState({
    platformPattern: "",
    requiredTopic: "",
    rewardDescription: "",
    maxWinners: "",
    deadline: "",
  });

  // Auto-close modal when wallet disconnects
  useEffect(() => {
    if (!isConnected && isOpen && !isCreating) {
      setIsOpen(false);
    }
  }, [isConnected, isOpen, isCreating]);

  const validateForm = (): boolean => {
    const newErrors = {
      platformPattern: "",
      requiredTopic: "",
      rewardDescription: "",
      maxWinners: "",
      deadline: "",
    };

    if (!requiredTopic.trim()) {
      newErrors.requiredTopic = "Topic description is required";
    }

    if (!rewardDescription.trim()) {
      newErrors.rewardDescription = "Reward description is required";
    }

    if (!maxWinners.trim()) {
      newErrors.maxWinners = "Maximum winners is required";
    } else if (isNaN(Number(maxWinners)) || Number(maxWinners) < 1) {
      newErrors.maxWinners = "Must be a positive number";
    }

    if (hasDeadline && !deadlineDate) {
      newErrors.deadline = "Please select a deadline date";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      error("Please connect your wallet first");
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Calculate deadline timestamp
    let deadline = 0;
    if (hasDeadline && deadlineDate) {
      const dateTimeStr = deadlineTime
        ? `${deadlineDate}T${deadlineTime}`
        : `${deadlineDate}T23:59`;
      deadline = Math.floor(new Date(dateTimeStr).getTime() / 1000);
    }

    createContest({
      platformPattern: platformPattern.trim() || "*",
      requiredTopic: requiredTopic.trim(),
      rewardDescription: rewardDescription.trim(),
      maxWinners: Number(maxWinners),
      deadline,
    });
  };

  const resetForm = () => {
    setPlatformPattern("");
    setRequiredTopic("");
    setRewardDescription("");
    setMaxWinners("");
    setHasDeadline(false);
    setDeadlineDate("");
    setDeadlineTime("");
    setErrors({
      platformPattern: "",
      requiredTopic: "",
      rewardDescription: "",
      maxWinners: "",
      deadline: "",
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isCreating) {
      resetForm();
    }
    setIsOpen(open);
  };

  // Reset form and close modal on successful creation
  useEffect(() => {
    if (isSuccess) {
      resetForm();
      setIsOpen(false);
    }
  }, [isSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="gradient" disabled={!isConnected || !address || isLoading} size="default" className="px-3 sm:px-4">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Create Contest</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="brand-card border-2 sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create Rewards Contest</DialogTitle>
          <DialogDescription>
            Set up a content rewards program for your community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Required Topic */}
          <div className="space-y-2">
            <Label htmlFor="requiredTopic" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Content Topic *
            </Label>
            <Input
              id="requiredTopic"
              type="text"
              placeholder="e.g., Write about the benefits of decentralized AI"
              value={requiredTopic}
              onChange={(e) => {
                setRequiredTopic(e.target.value);
                setErrors({ ...errors, requiredTopic: "" });
              }}
              className={errors.requiredTopic ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Describe what topic the content should be about. AI will validate submissions.
            </p>
            {errors.requiredTopic && (
              <p className="text-xs text-destructive">{errors.requiredTopic}</p>
            )}
          </div>

          {/* Platform Pattern */}
          <div className="space-y-2">
            <Label htmlFor="platformPattern" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Platform URL Pattern
            </Label>
            <Input
              id="platformPattern"
              type="text"
              placeholder="e.g., medium.com, twitter.com, or leave empty for any"
              value={platformPattern}
              onChange={(e) => {
                setPlatformPattern(e.target.value);
                setErrors({ ...errors, platformPattern: "" });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to accept URLs from any platform, or specify a domain (e.g., medium.com)
            </p>
          </div>

          {/* Reward Description */}
          <div className="space-y-2">
            <Label htmlFor="rewardDescription" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Reward Description *
            </Label>
            <Input
              id="rewardDescription"
              type="text"
              placeholder="e.g., 100 USDT per winner"
              value={rewardDescription}
              onChange={(e) => {
                setRewardDescription(e.target.value);
                setErrors({ ...errors, rewardDescription: "" });
              }}
              className={errors.rewardDescription ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Describe the rewards winners will receive (distributed offline)
            </p>
            {errors.rewardDescription && (
              <p className="text-xs text-destructive">{errors.rewardDescription}</p>
            )}
          </div>

          {/* Max Winners */}
          <div className="space-y-2">
            <Label htmlFor="maxWinners" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Maximum Winners *
            </Label>
            <Input
              id="maxWinners"
              type="number"
              min="1"
              placeholder="e.g., 10"
              value={maxWinners}
              onChange={(e) => {
                setMaxWinners(e.target.value);
                setErrors({ ...errors, maxWinners: "" });
              }}
              className={errors.maxWinners ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Contest closes when this many submissions are accepted (FCFS)
            </p>
            {errors.maxWinners && (
              <p className="text-xs text-destructive">{errors.maxWinners}</p>
            )}
          </div>

          {/* Deadline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasDeadline"
                checked={hasDeadline}
                onChange={(e) => setHasDeadline(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5"
              />
              <Label htmlFor="hasDeadline" className="flex items-center gap-2 cursor-pointer">
                <Clock className="w-4 h-4" />
                Set Deadline (Optional)
              </Label>
            </div>

            {hasDeadline && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div className="space-y-1">
                  <Label htmlFor="deadlineDate" className="text-xs">
                    Date
                  </Label>
                  <Input
                    id="deadlineDate"
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => {
                      setDeadlineDate(e.target.value);
                      setErrors({ ...errors, deadline: "" });
                    }}
                    className={errors.deadline ? "border-destructive" : ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="deadlineTime" className="text-xs">
                    Time (optional)
                  </Label>
                  <Input
                    id="deadlineTime"
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                  />
                </div>
              </div>
            )}
            {errors.deadline && (
              <p className="text-xs text-destructive pl-6">{errors.deadline}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="flex-1"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Contest"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
