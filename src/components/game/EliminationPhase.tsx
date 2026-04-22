import { useState } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { GlassCard } from "../ui/GlassCard";
import { Skull, ShieldAlert, ArrowRight } from "lucide-react";
import { validateMrWhiteGuess } from "@/lib/engine/rules";

export function EliminationPhase() {
  const { eliminatedPlayerId, players, mrWhiteSubmitGuess, secretWord, setWinner, settings, setPhase, startNextRound } = useGameStore();

  const eliminatedPlayer = players.find((p) => p.id === eliminatedPlayerId);
  const [guess, setGuess] = useState("");

  const handleNext = () => {
    if (!eliminatedPlayer) {
      startNextRound(); // Tie/skip handled
      return;
    }

    if (eliminatedPlayer.role === "mr_white") {
       if (settings.mrWhiteGuessEnabled) {
         if (guess.trim().length > 0) {
           mrWhiteSubmitGuess(guess);
           const isCorrect = validateMrWhiteGuess(guess, secretWord);
           if (isCorrect) {
             setWinner("mr_white");
           } else {
             // If they guessed wrong, they are eliminated.
             // Check if there are other Mr. Whites alive
             const aliveMrWhites = players.filter((p) => p.isAlive && p.role === "mr_white").length;
             if (aliveMrWhites === 0) {
                 setWinner("civilians");
             } else {
                 // There is still another Mr. White alive
                 startNextRound();
             }
           }
         } else {
           alert("Mr. White must make a guess.");
           return;
         }
       } else {
         // Guessing is disabled. Mr. White is eliminated immediately.
         const aliveMrWhites = players.filter((p) => p.isAlive && p.role === "mr_white").length;
         if (aliveMrWhites === 0) {
             setWinner("civilians");
         } else {
             startNextRound();
         }
       }
    } else {
        // Civilian eliminated
        const aliveMrWhites = players.filter((p) => p.isAlive && p.role === "mr_white").length;
        if (aliveMrWhites === 0) {
            setWinner("civilians");
        } else {
            // Check if only Mr Whites remain or balance tips to them
            const totalAlive = players.filter(p => p.isAlive).length;
            if (aliveMrWhites >= totalAlive - aliveMrWhites) {
                setWinner("mr_white");
            } else {
                startNextRound();
            }
        }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full max-w-md mx-auto animate-in fade-in zoom-in duration-500 text-center">
      <div className="mb-8">
        <Skull className="w-16 h-16 mx-auto text-red-600 dark:text-red-500 mb-4 animate-bounce" />
        <h1 className="text-3xl font-bold tracking-widest text-red-700 dark:text-red-400 uppercase">Eliminated</h1>
      </div>

      <GlassCard className="w-full bg-white/50 dark:bg-neutral-900 border border-red-300 dark:border-red-500/20 p-8 shadow-2xl mb-8 border-t-4 border-t-red-600 dark:border-t-red-500">
        {!eliminatedPlayer ? (
          <div>
             <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">It's a Tie!</h2>
             <p className="mt-4 text-gray-600 dark:text-gray-400">No one was eliminated this round.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 pb-2">
              {eliminatedPlayer.name}
            </h2>
            <div className="mt-4 px-4 py-1 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-full font-bold uppercase tracking-widest text-xs">
              {eliminatedPlayer.role === "mr_white" ? "Was Mr. White!" : "Was a Civilian"}
            </div>

            {eliminatedPlayer.role === "mr_white" && settings.mrWhiteGuessEnabled && (
                <div className="mt-12 w-full pt-4 border-t border-gray-200 dark:border-white/5 space-y-4 animate-in slide-in-from-bottom-6">
                   <ShieldAlert className="w-8 h-8 mx-auto text-yellow-600 dark:text-yellow-500" />
                   <h3 className="text-xl font-bold text-yellow-600 dark:text-yellow-400">Final Guess</h3>
                   <p className="text-sm text-gray-600 dark:text-gray-400">Mr. White gets one chance to guess the secret word.</p>
                   
                   <input
                     type="text"
                     value={guess}
                     onChange={(e) => setGuess(e.target.value)}
                     placeholder="Enter exact word..."
                     className="w-full bg-black/5 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white text-center font-bold tracking-wide placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 dark:focus:ring-yellow-500/50"
                   />
                </div>
            )}
          </div>
        )}
      </GlassCard>

      <button
        onClick={handleNext}
        className="w-full bg-black text-white dark:bg-white dark:text-black font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.15)] group"
      >
        <span>{eliminatedPlayer?.role === "mr_white" && settings.mrWhiteGuessEnabled ? "Submit Guess & See Winner" : "Continue"}</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
