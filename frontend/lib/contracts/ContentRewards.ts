import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type {
  Contest,
  Submission,
  UserSubmission,
  SubmitResult,
  TransactionReceipt,
} from "./types";

/**
 * Helper to convert Map to plain object recursively
 */
function mapToObject(data: any): any {
  if (data instanceof Map) {
    const obj: Record<string, any> = {};
    for (const [key, value] of data.entries()) {
      obj[key] = mapToObject(value);
    }
    return obj;
  }
  if (Array.isArray(data)) {
    return data.map(mapToObject);
  }
  return data;
}

/**
 * ContentRewards contract class for interacting with the GenLayer Content Rewards contract
 */
class ContentRewards {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(
    contractAddress: string,
    address?: string | null,
    studioUrl?: string
  ) {
    this.contractAddress = contractAddress as `0x${string}`;

    const config: any = {
      chain: studionet,
    };

    if (address) {
      config.account = address as `0x${string}`;
    }

    if (studioUrl) {
      config.endpoint = studioUrl;
    }

    this.client = createClient(config);
  }

  /**
   * Update the address used for transactions
   */
  updateAccount(address: string): void {
    const config: any = {
      chain: studionet,
      account: address as `0x${string}`,
    };

    this.client = createClient(config);
  }

  /**
   * Get all contests
   */
  async getAllContests(): Promise<Contest[]> {
    try {
      const contests = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_all_contests",
        args: [],
      });

      // Convert Map structures to plain objects
      const parsed = mapToObject(contests);

      if (Array.isArray(parsed)) {
        return parsed as Contest[];
      }

      return [];
    } catch (error) {
      console.error("Error fetching contests:", error);
      throw new Error("Failed to fetch contests from contract");
    }
  }

  /**
   * Get a specific contest by ID
   */
  async getContest(contestId: number): Promise<Contest> {
    try {
      const contest = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_contest",
        args: [contestId],
      });

      return mapToObject(contest) as Contest;
    } catch (error) {
      console.error("Error fetching contest:", error);
      throw new Error("Failed to fetch contest from contract");
    }
  }

  /**
   * Get all submissions for a contest
   */
  async getSubmissions(contestId: number): Promise<Submission[]> {
    try {
      console.log("Fetching submissions for contestId:", contestId);
      const submissions = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_submissions",
        args: [contestId],
      });

      console.log("Raw submissions response:", submissions);
      const parsed = mapToObject(submissions);
      console.log("Parsed submissions:", parsed);

      if (Array.isArray(parsed)) {
        return parsed as Submission[];
      }

      return [];
    } catch (error) {
      console.error("Error fetching submissions:", error);
      throw new Error("Failed to fetch submissions from contract");
    }
  }

  /**
   * Get winners for a contest
   */
  async getWinners(contestId: number): Promise<string[]> {
    try {
      const winners = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_winners",
        args: [contestId],
      });

      const parsed = mapToObject(winners);

      if (Array.isArray(parsed)) {
        return parsed as string[];
      }

      return [];
    } catch (error) {
      console.error("Error fetching winners:", error);
      throw new Error("Failed to fetch winners from contract");
    }
  }

  /**
   * Get a user's submission for a specific contest
   */
  async getUserSubmission(
    contestId: number,
    userAddress: string
  ): Promise<UserSubmission> {
    try {
      const submission = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_user_submission",
        args: [contestId, userAddress],
      });

      return mapToObject(submission) as UserSubmission;
    } catch (error) {
      console.error("Error fetching user submission:", error);
      return { has_submitted: false };
    }
  }

  /**
   * Create a new contest
   */
  async createContest(
    platformPattern: string,
    requiredTopic: string,
    rewardDescription: string,
    maxWinners: number,
    deadline: number
  ): Promise<{ receipt: TransactionReceipt; contestId?: number }> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "create_contest",
        args: [
          platformPattern,
          requiredTopic,
          rewardDescription,
          maxWinners,
          deadline,
        ],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });

      // Extract contest ID from receipt if available
      let contestId: number | undefined;
      if (receipt.data?.result !== undefined) {
        contestId = Number(receipt.data.result);
      }

      return { receipt: receipt as TransactionReceipt, contestId };
    } catch (error) {
      console.error("Error creating contest:", error);
      throw new Error("Failed to create contest");
    }
  }

  /**
   * Submit content to a contest
   */
  async submitContent(
    contestId: number,
    contentUrl: string
  ): Promise<{ receipt: TransactionReceipt; result?: SubmitResult }> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "submit_content",
        args: [contestId, contentUrl],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 60, // Longer wait for LLM validation
        interval: 5000,
      });

      // Extract result from receipt
      let result: SubmitResult | undefined;
      if (receipt.data?.result) {
        result = receipt.data.result as SubmitResult;
      }

      return { receipt: receipt as TransactionReceipt, result };
    } catch (error) {
      console.error("Error submitting content:", error);
      throw new Error("Failed to submit content");
    }
  }

  /**
   * Close a contest (creator only)
   */
  async closeContest(contestId: number): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "close_contest",
        args: [contestId],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error closing contest:", error);
      throw new Error("Failed to close contest");
    }
  }
}

export default ContentRewards;
