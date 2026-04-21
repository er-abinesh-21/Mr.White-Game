import { useState } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { GlassCard } from "../ui/GlassCard";
import { Eye, EyeOff, UserCircle2, ArrowRight, ShieldAlert, Fingerprint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function RevealPhase() {
  const { players, secretWord, mrWhiteWord, category, settings, setPhase, localPlayerId } = useGameStore();

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  // In online mode, we only care about the local player
  const myPlayer = players.find(p => p.id === localPlayerId);
  // Fallback for passing-device or spectators (just loop through)
  const currentPlayer = myPlayer || players[currentPlayerIndex];

  const handleNext = () => {
    // If online, don't loop through array. Just mark ready by fast-forwarding index artificially or setting phase
    if (localPlayerId) {
      // In a fully built online game, this would send a "READY" socket message to advance the phase 
      // when everyone is ready. For now, we'll let whoever clicks it just advance the phase for everyone.
      setPhase("clue");
    } else {
      // Pass-and-play local logic
      if (currentPlayerIndex < players.length - 1) {
        setCurrentPlayerIndex((prev) => prev + 1);
        setIsRevealed(false);
      } else {
        setPhase("clue");
      }
    }
  };

  const isHardMode = settings.mrWhiteHint === "hard";
  const isActuallyCivilian = currentPlayer?.role === "civilian";
  const isMrWhite = currentPlayer?.role === "mr_white";
  
  // In hard mode, Mr. White's role text says "Civilian" to disguise their identity visually.
  const visualRoleLabel = isActuallyCivilian || (isHardMode && isMrWhite) ? "Civilian" : "Mr. White";
  const isVisuallyCivilian = visualRoleLabel === "Civilian";

  let displayWord = secretWord;
  let hintText = 
    settings.mrWhiteHint === "none" ? "No intel available." 
    : settings.mrWhiteHint === "category" ? `Category: ${category}`
    : `Hint: It's in the ${category}.`; 
    
  if (isMrWhite) {
    if (isHardMode && mrWhiteWord) {
      displayWord = mrWhiteWord;
      hintText = `Category: ${category}`; // They think they are a civilian, just show word and category normally
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center p-6 w-full h-full max-w-md mx-auto"
    >
      <div className="mb-6 w-full text-center">
        <h2 className="text-sm font-bold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-2">
           {localPlayerId ? "Target Acquired for" : "Pass device to"}
        </h2>
        <motion.h1 
          key={currentPlayer?.id}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight break-words py-2"
        >
          {currentPlayer?.name}
        </motion.h1>
      </div>

      <GlassCard className="w-full flex-1 flex flex-col items-center justify-center p-0 overflow-hidden bg-white/80 dark:bg-neutral-900/80 border-gray-200 dark:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.div 
              key="hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-6 cursor-pointer group w-full h-full min-h-[350px]" 
              onClick={() => setIsRevealed(true)}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-200 dark:group-hover:bg-blue-500/40 transition-colors duration-500" />
                <div className="h-32 w-32 relative z-10 rounded-full bg-black/5 dark:bg-black/40 border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center group-hover:scale-105 group-hover:border-blue-500/50 shadow-inner overflow-hidden transition-all duration-500">
                  <Fingerprint className="w-14 h-14 text-blue-500/50 dark:text-blue-400/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-400/50 -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite]" />
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Tap to authenticate</p>
            </motion.div>
          ) : (
            <motion.div 
              key="revealed"
              initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
              className="flex flex-col items-center justify-between w-full h-full min-h-[350px] p-6 lg:p-8 relative"
            >
              {/* Background Glow based on role */}
              <div className={`absolute inset-0 opacity-10 pointer-events-none ${isVisuallyCivilian ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600 via-transparent to-transparent'}`} />

              <div className="flex flex-col items-center justify-center z-10">
                 {isVisuallyCivilian ? <UserCircle2 className="w-16 h-16 text-blue-600 dark:text-blue-400 mb-4 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" /> : <ShieldAlert className="w-16 h-16 text-red-600 dark:text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />}
                 <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em] font-extrabold mb-1">Identity</span>
                 <h2 className={`text-4xl font-black uppercase tracking-widest ${isVisuallyCivilian ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-500"}`}>
                   {visualRoleLabel}
                 </h2>
              </div>

              <div className={`w-full backdrop-blur-md rounded-2xl p-6 border text-center z-10 my-8 shadow-2xl ${isVisuallyCivilian ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-500/20' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-500/20'}`}>
                <span className={`text-[10px] uppercase font-black tracking-[0.2em] ${isVisuallyCivilian ? 'text-blue-600/70 dark:text-blue-400/70' : 'text-red-600/70 dark:text-red-400/70'}`}>
                  {isVisuallyCivilian ? "Target Protocol" : "Classified Intel"}
                </span>
                <p className="text-3xl font-black text-gray-900 dark:text-white mt-2 tracking-tight">
                  {displayWord}
                </p>
                {isVisuallyCivilian && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/5 flex items-center justify-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Category:</span>
                    <span className="text-gray-700 dark:text-gray-300 text-sm font-black capitalize bg-black/5 dark:bg-white/5 px-3 py-1 rounded-md">{category}</span>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="w-full bg-black text-white dark:bg-white dark:text-black font-black py-4 rounded-xl shadow-lg dark:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all flex items-center justify-center gap-2 z-10"
              >
                <span>
                  {localPlayerId ? "Start Match" : currentPlayerIndex < players.length - 1 ? "Hide & Pass Device" : "Enter Lobby"}
                </span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Hide the progress bar in online mode since there is no passing device loop */}
      {!localPlayerId && (
        <div className="w-full mt-8 flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 font-mono">{currentPlayerIndex + 1}/{players.length}</span>
          <div className="h-1.5 flex-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentPlayerIndex + 1) / players.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400" 
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
