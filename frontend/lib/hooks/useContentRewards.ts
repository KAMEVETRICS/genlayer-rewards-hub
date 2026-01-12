"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ContentRewards from "../contracts/ContentRewards";
import { getContractAddress, getStudioUrl } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { success, error, configError } from "../utils/toast";
import type { Contest, Submission, UserSubmission } from "../contracts/types";

/**
 * Hook to get the ContentRewards contract instance
 */
export function useContentRewardsContract(): ContentRewards | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();
  const studioUrl = getStudioUrl();

  const contract = useMemo(() => {
    if (!contractAddress) {
      configError(
        "Setup Required",
        "Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file.",
        {
          label: "Setup Guide",
          onClick: () => window.open("/docs/setup", "_blank"),
        }
      );
      return null;
    }

    return new ContentRewards(contractAddress, address, studioUrl);
  }, [contractAddress, address, studioUrl]);

  return contract;
}

/**
 * Hook to fetch all contests
 */
export function useContests() {
  const contract = useContentRewardsContract();

  return useQuery<Contest[], Error>({
    queryKey: ["contests"],
    queryFn: () => {
      if (!contract) {
        return Promise.resolve([]);
      }
      return contract.getAllContests();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract,
  });
}

/**
 * Hook to fetch a specific contest
 */
export function useContest(contestId: number | null) {
  const contract = useContentRewardsContract();
  // Convert to string for query key to avoid BigInt serialization issues
  const contestIdKey = contestId !== null ? String(contestId) : null;

  return useQuery<Contest | null, Error>({
    queryKey: ["contest", contestIdKey],
    queryFn: () => {
      if (!contract || contestId === null) {
        return Promise.resolve(null);
      }
      return contract.getContest(Number(contestId));
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract && contestId !== null,
  });
}

/**
 * Hook to fetch submissions for a contest
 */
export function useSubmissions(contestId: number | null) {
  const contract = useContentRewardsContract();
  const contestIdKey = contestId !== null ? String(contestId) : null;

  return useQuery<Submission[], Error>({
    queryKey: ["submissions", contestIdKey],
    queryFn: () => {
      if (!contract || contestId === null) {
        return Promise.resolve([]);
      }
      return contract.getSubmissions(Number(contestId));
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract && contestId !== null,
  });
}

/**
 * Hook to fetch winners for a contest
 */
export function useWinners(contestId: number | null) {
  const contract = useContentRewardsContract();
  const contestIdKey = contestId !== null ? String(contestId) : null;

  return useQuery<string[], Error>({
    queryKey: ["winners", contestIdKey],
    queryFn: () => {
      if (!contract || contestId === null) {
        return Promise.resolve([]);
      }
      return contract.getWinners(Number(contestId));
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract && contestId !== null,
  });
}

/**
 * Hook to fetch user's submission for a contest
 */
export function useUserSubmission(
  contestId: number | null,
  userAddress: string | null
) {
  const contract = useContentRewardsContract();
  const contestIdKey = contestId !== null ? String(contestId) : null;

  return useQuery<UserSubmission, Error>({
    queryKey: ["userSubmission", contestIdKey, userAddress],
    queryFn: () => {
      if (!contract || contestId === null || !userAddress) {
        return Promise.resolve({ has_submitted: false });
      }
      return contract.getUserSubmission(Number(contestId), userAddress);
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract && contestId !== null && !!userAddress,
  });
}

/**
 * Hook to create a new contest
 */
export function useCreateContest() {
  const contract = useContentRewardsContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      platformPattern,
      requiredTopic,
      rewardDescription,
      maxWinners,
      deadline,
    }: {
      platformPattern: string;
      requiredTopic: string;
      rewardDescription: string;
      maxWinners: number;
      deadline: number;
    }) => {
      if (!contract) {
        throw new Error(
          "Contract not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file."
        );
      }
      if (!address) {
        throw new Error(
          "Wallet not connected. Please connect your wallet to create a contest."
        );
      }
      setIsCreating(true);
      return contract.createContest(
        platformPattern,
        requiredTopic,
        rewardDescription,
        maxWinners,
        deadline
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contests"] });
      setIsCreating(false);
      success("Contest created successfully!", {
        description: data.contestId !== undefined
          ? `Contest ID: ${data.contestId}`
          : "Your contest is now live.",
      });
    },
    onError: (err: any) => {
      console.error("Error creating contest:", err);
      setIsCreating(false);
      error("Failed to create contest", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isCreating,
    createContest: mutation.mutate,
    createContestAsync: mutation.mutateAsync,
  };
}

/**
 * Hook to submit content to a contest
 */
export function useSubmitContent() {
  const contract = useContentRewardsContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      contestId,
      contentUrl,
    }: {
      contestId: number;
      contentUrl: string;
    }) => {
      if (!contract) {
        throw new Error(
          "Contract not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file."
        );
      }
      if (!address) {
        throw new Error(
          "Wallet not connected. Please connect your wallet to submit content."
        );
      }
      setIsSubmitting(true);
      return contract.submitContent(contestId, contentUrl);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["submissions", variables.contestId] });
      queryClient.invalidateQueries({ queryKey: ["contest", variables.contestId] });
      queryClient.invalidateQueries({ queryKey: ["contests"] });
      queryClient.invalidateQueries({ queryKey: ["winners", variables.contestId] });
      queryClient.invalidateQueries({ queryKey: ["userSubmission"] });
      setIsSubmitting(false);

      if (data.result?.status === "accepted") {
        success("Content accepted!", {
          description: "Congratulations! Your submission has been accepted.",
        });
      } else if (data.result?.status === "rejected") {
        error("Content rejected", {
          description: data.result.reason || "Your content did not meet the requirements.",
        });
      } else if (data.result?.status === "voided") {
        error("Submission voided", {
          description: data.result.reason || "Contest reached maximum winners.",
        });
      }
    },
    onError: (err: any) => {
      console.error("Error submitting content:", err);
      setIsSubmitting(false);
      error("Failed to submit content", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isSubmitting,
    submitContent: mutation.mutate,
    submitContentAsync: mutation.mutateAsync,
  };
}

/**
 * Hook to close a contest
 */
export function useCloseContest() {
  const contract = useContentRewardsContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isClosing, setIsClosing] = useState(false);

  const mutation = useMutation({
    mutationFn: async (contestId: number) => {
      if (!contract) {
        throw new Error(
          "Contract not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file."
        );
      }
      if (!address) {
        throw new Error(
          "Wallet not connected. Please connect your wallet to close a contest."
        );
      }
      setIsClosing(true);
      return contract.closeContest(contestId);
    },
    onSuccess: (_, contestId) => {
      queryClient.invalidateQueries({ queryKey: ["contests"] });
      queryClient.invalidateQueries({ queryKey: ["contest", contestId] });
      setIsClosing(false);
      success("Contest closed successfully!", {
        description: "The contest is no longer accepting submissions.",
      });
    },
    onError: (err: any) => {
      console.error("Error closing contest:", err);
      setIsClosing(false);
      error("Failed to close contest", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isClosing,
    closeContest: mutation.mutate,
    closeContestAsync: mutation.mutateAsync,
  };
}
