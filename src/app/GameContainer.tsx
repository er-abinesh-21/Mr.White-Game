"use client";

import { ErrorBoundary } from "react-error-boundary";
import { useEffect } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { SetupPhase } from "@/components/game/SetupPhase";
import { RevealPhase } from "@/components/game/RevealPhase";
import { CluePhase } from "@/components/game/CluePhase";
import { DiscussionPhase } from "@/components/game/DiscussionPhase";
import { VotingPhase } from "@/components/game/VotingPhase";
import { EliminationPhase } from "@/components/game/EliminationPhase";
import { ResultPhase } from "@/components/game/ResultPhase";

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-red-500 p-8 text-center font-mono w-full">
      <h2 className="text-2xl font-bold mb-4">React Render Crash!</h2>
      <pre className="bg-red-950 p-4 rounded text-left overflow-auto w-full max-w-2xl">{error.message}</pre>
      <button 
        onClick={() => {
          resetErrorBoundary();
          window.location.reload();
        }} 
        className="mt-6 bg-red-600 text-white font-bold py-2 px-6 rounded hover:bg-red-500"
      >
        Reload Game
      </button>
    </div>
  );
}

export default function GameContainer() {
  const { phase, round, category, settings, joinRoom } = useGameStore();

  useEffect(() => {
    // If the user arrived via a share link, SetupPhase handles the routing logic now
    // We remove the automatic immediate joinRoom here since they haven't set their user name
  }, []);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <main className="min-h-screen bg-gray-50 dark:bg-black sm:bg-white dark:sm:bg-neutral-950 text-gray-900 dark:text-white flex items-center justify-center font-sans sm:p-6 selection:bg-black/10 dark:selection:bg-white/30">
        
        {/* App Frame Structure */}
        <div className="relative w-full h-full sm:h-[844px] max-w-[390px] mx-auto flex flex-col bg-white dark:bg-neutral-950 sm:border sm:border-gray-200 dark:sm:border-white/10 sm:rounded-[2.5rem] shadow-2xl overflow-hidden sm:shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          
          {/* Universal Sticky App Header (Hidden on Setup and Result screens for immersion) */}
          {phase !== "setup" && phase !== "result" && (
            <header className="absolute top-0 w-full px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md z-50 pointer-events-none">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest leading-tight">Category</span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400 capitalize">
                  {settings.mrWhiteHint === 'none' ? "Hidden" : (category || "Unknown")}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest leading-tight">Round</span>
                <span className="text-sm font-black text-gray-900 dark:text-white px-2 py-0.5 mt-0.5 bg-black/5 dark:bg-white/10 rounded-md">#{round}</span>
              </div>
            </header>
          )}

          {/* Phase Router (Dynamic scrollable viewport) */}
          <div className={`flex-1 flex flex-col w-full h-full overflow-y-auto overflow-x-hidden relative scroll-smooth ${phase !== "setup" && phase !== "result" ? "pt-16 pb-6" : ""}`}>
            {phase === "setup" && <SetupPhase />}
            {phase === "reveal" && <RevealPhase />}
            {phase === "clue" && <CluePhase />}
            {phase === "discussion" && <DiscussionPhase />}
            {phase === "voting" && <VotingPhase />}
            {phase === "elimination" && <EliminationPhase />}
            {phase === "result" && <ResultPhase />}

            {/* Debug Fallback */}
            {(!["setup", "reveal", "clue", "discussion", "voting", "elimination", "result"].includes(phase)) && (
              <div className="text-red-500 m-auto text-center p-4">
                 <h2 className="font-bold">Critical Render Missing!</h2>
                 <p className="text-sm">Invalid Phase: {String(phase)}</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </ErrorBoundary>
  );
}
