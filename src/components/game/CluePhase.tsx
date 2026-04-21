import { useEffect } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { GlassCard } from "../ui/GlassCard";
import { Users2, ArrowRight } from "lucide-react";

export function CluePhase() {
  const { players, currentTurnIndex, submitClue, setPhase } = useGameStore();

  const activePlayer = players[currentTurnIndex];

  useEffect(() => {
    // Failsafe: if somehow out of bounds without moving to discussion
    if (!activePlayer) {
      setPhase("discussion");
    }
  }, [activePlayer, setPhase]);

  const handleNextTurn = () => {
    // ... rest of code
    // Submit a dummy clue for now to pass turn
    if (activePlayer) {
      submitClue(activePlayer.id, "clue-submitted");
    }

    // Check if the next alive player index will exceed array bounds
    let nextIndex = currentTurnIndex + 1;
    while (nextIndex < players.length && !players[nextIndex].isAlive) {
      nextIndex++;
    }

    if (nextIndex >= players.length) {
      setPhase("discussion");
    }
  };

  if (!activePlayer) {
    return (
      <div className="flex flex-col items-center justify-center p-4 w-full h-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading discussion phase...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-8">
      <div className="text-center mb-8">
        <Users2 className="w-12 h-12 mx-auto text-gray-500/50 dark:text-white/50 mb-3" />
        <h1 className="text-2xl font-bold tracking-widest text-gray-700 dark:text-gray-300 uppercase">Clue Phase</h1>
        <p className="text-sm text-gray-600 dark:text-gray-500 mt-2">Give one word related to the secret word</p>
      </div>

      <GlassCard className="w-full bg-white/50 dark:bg-neutral-900 border border-gray-200 dark:border-white/10 p-8 shadow-2xl mb-8 text-center ring-1 ring-black/5 dark:ring-white/5 relative overflow-hidden">
        
        {/* Progress indicator bar at top of card */}
        <div className="absolute top-0 left-0 h-1 bg-black/10 dark:bg-white/10 w-full" />
        <div 
          className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-[800ms] ease-out" 
          style={{ width: `${((currentTurnIndex + 1) / players.length) * 100}%` }}
        />

        <div className="flex flex-col items-center space-y-4">
          <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500 dark:text-gray-400">Current Turn</span>
          <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 pb-2">
            {activePlayer.name}
          </h2>
        </div>

        <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex gap-4 overflow-x-auto snap-x pb-2">
           {players.map((p, idx) => (
             <div 
               key={p.id} 
               className={`snap-center shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 transition-all 
                           ${idx === currentTurnIndex ? "border-blue-500 bg-blue-100 dark:bg-blue-500/10 scale-110 shadow-lg shadow-blue-500/20 z-10" : "border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5 scale-90"}
                           ${!p.isAlive ? "opacity-20 grayscale line-through border-red-300 dark:border-red-900/50" : "opacity-80"}`}
             >
               <span className={`text-[10px] uppercase font-bold ${idx === currentTurnIndex ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-white/60"}`}>
                 {p.name.slice(0, 3)}
               </span>
               {!p.isAlive && <span className="absolute text-red-600 dark:text-red-500 text-xl font-bold">X</span>}
             </div>
           ))}
        </div>
      </GlassCard>

      <button
        onClick={handleNextTurn}
        className="w-full bg-black text-white dark:bg-white dark:text-black font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all hover:scale-[1.02] shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.15)] group"
      >
        <span>End {activePlayer.name}'s Turn</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
