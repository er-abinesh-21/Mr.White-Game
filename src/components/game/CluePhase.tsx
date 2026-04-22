import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { GlassCard } from "../ui/GlassCard";
import { Users2, ArrowRight, MessageSquareText } from "lucide-react";

export function CluePhase() {
  const { players, currentTurnIndex, submitClue, setPhase, settings, clues, localPlayerId, isOffline } = useGameStore();
  const [typedClue, setTypedClue] = useState("");

  const activePlayer = players[currentTurnIndex];

  useEffect(() => {
    // Failsafe: if somehow out of bounds without moving to discussion
    if (!activePlayer) {
      setPhase("discussion");
    }
  }, [activePlayer, setPhase]);

  useEffect(() => {
    setTypedClue("");
  }, [activePlayer?.id]);

  const isMyTurn = isOffline || !localPlayerId || localPlayerId === activePlayer?.id;

  const handleNextTurn = () => {
    if (!activePlayer || !isMyTurn) return;

    if (settings.typedClueMode) {
      const clue = typedClue.trim();
      if (!clue) {
        alert("Please type a clue before ending your turn.");
        return;
      }
      submitClue(activePlayer.id, clue);
      return;
    }

    submitClue(activePlayer.id, "spoken-clue");
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

        {settings.typedClueMode && isMyTurn ? (
          <div className="mt-6">
            <input
              type="text"
              value={typedClue}
              onChange={(e) => setTypedClue(e.target.value)}
              placeholder="Type one-word clue..."
              className="w-full bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              autoComplete="off"
              autoFocus
            />
          </div>
        ) : settings.typedClueMode ? (
          <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-center">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Waiting for {activePlayer.name} to type and submit their clue.</p>
          </div>
        ) : !isMyTurn ? (
          <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-center">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Waiting for {activePlayer.name} to share their clue.</p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 font-medium">
            Say your clue out loud, then end your turn.
          </p>
        )}

        <div className="mt-6 text-left w-full">
          <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[10px] font-bold">
            <MessageSquareText className="w-4 h-4" />
            Shared Clues
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {players.filter((player) => clues[player.id]).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No clues shared yet.</p>
            ) : (
              players.map((player) => {
                const clue = clues[player.id];
                if (!clue) return null;
                return (
                  <div key={player.id} className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-3">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-gray-500 dark:text-gray-400">
                      {player.name}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1 break-words">
                      {clue}
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
        disabled={!isMyTurn || (settings.typedClueMode && !typedClue.trim())}
        className="w-full bg-black text-white dark:bg-white dark:text-black font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all hover:scale-[1.02] shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.15)] group disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span>{isMyTurn ? `End ${activePlayer.name}'s Turn` : `Waiting for ${activePlayer.name}`}</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
