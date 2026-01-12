"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ContestList } from "@/components/ContestList";
import { SubmissionsTable } from "@/components/SubmissionsTable";
import { SubmitContentModal } from "@/components/SubmitContentModal";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [selectedContestId, setSelectedContestId] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content - Padding to account for fixed navbar */}
      <main className="flex-grow pt-20 pb-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Content Rewards
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered content validation on GenLayer blockchain.
              <br />
              Create contests, submit content, and earn rewards.
            </p>
          </div>

          {/* Main Content Area */}
          {selectedContestId !== null ? (
            // Contest Detail View
            <div className="animate-slide-up">
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedContestId(null)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Contests
                </Button>
                <div className="flex-grow" />
                <SubmitContentModal contestId={selectedContestId} />
              </div>
              <SubmissionsTable contestId={selectedContestId} />
            </div>
          ) : (
            // Contest List View
            <div className="animate-slide-up">
              <ContestList
                selectedContestId={selectedContestId}
                onSelectContest={setSelectedContestId}
              />
            </div>
          )}

          {/* Info Section */}
          <div
            className="mt-8 glass-card p-6 md:p-8 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <h2 className="text-2xl font-bold mb-4">How it Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">1. Create a Contest</div>
                <p className="text-sm text-muted-foreground">
                  Connect your wallet and create a content rewards contest. Specify the topic,
                  platform, and reward details.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">2. Submit Content</div>
                <p className="text-sm text-muted-foreground">
                  Participants submit URLs to their published content. Each wallet can submit
                  once per contest.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">3. AI Validation</div>
                <p className="text-sm text-muted-foreground">
                  GenLayer validators use AI to verify if content matches the required topic.
                  Valid submissions are accepted.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">4. Get Rewarded</div>
                <p className="text-sm text-muted-foreground">
                  Accepted submissions are added to the winners list. Rewards are distributed
                  offline by the contest creator.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-2">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <a
              href="https://genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Powered by GenLayer
            </a>
            <a
              href="https://studio.genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Studio
            </a>
            <a
              href="https://docs.genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Docs
            </a>
            <a
              href="https://github.com/genlayerlabs/genlayer-project-boilerplate"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
