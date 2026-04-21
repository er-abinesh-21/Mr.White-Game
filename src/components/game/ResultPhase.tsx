import { useGameStore } from "@/lib/store/gameStore";
import { GlassCard } from "../ui/GlassCard";
import { Trophy, ThumbsDown, RotateCcw, Target, Skull } from "lucide-react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

export function ResultPhase() {
  const { winner, secretWord, mrWhiteWord, mrWhiteGuess, players, resetGame } = useGameStore();
  const { width, height } = useWindowSize(); 

  const isCivilianWin = winner === "civilians";
  const mrWhites = players.filter((p) => p.role === "mr_white");

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-6 w-full h-full max-w-md mx-auto text-center"
    >
      {isCivilianWin && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} colors={['#60A5FA', '#3B82F6', '#FFFFFF']} />}
      {!isCivilianWin && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} colors={['#EF4444', '#B91C1C', '#000000']} />}

      <div className="mb-8 relative">
        <motion.div
           initial={{ y: -20, rotate: -10 }}
           animate={{ y: 0, rotate: 0 }}
           transition={{ type: "spring", bounce: 0.6 }}
           className="relative z-10"
        >
          {isCivilianWin ? (
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-30 rounded-full" />
              <Trophy className="w-24 h-24 mx-auto text-blue-600 dark:text-blue-400 mb-4 drop-shadow-[0_0_25px_rgba(96,165,250,0.8)]" />
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-red-600 blur-3xl opacity-30 rounded-full" />
              <Skull className="w-24 h-24 mx-auto text-red-600 dark:text-red-500 mb-4 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]" />
            </div>
          )}
        </motion.div>

        <h1 className={`text-4xl sm:text-5xl font-black tracking-tighter uppercase relative z-10 ${isCivilianWin ? 'text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-300 dark:to-blue-500' : 'text-transparent bg-clip-text bg-gradient-to-br from-red-600 to-red-800 dark:from-red-400 dark:to-red-600'}`}>
          {isCivilianWin ? "Civilians Win!" : "Mr. White Wins!"}
        </h1>
      </div>

      <GlassCard className={`w-full bg-white/80 dark:bg-neutral-900/80 p-8 shadow-2xl mb-8 relative overflow-hidden backdrop-blur-xl ${isCivilianWin ? 'border-t-[6px] border-t-blue-500 border-gray-200 dark:border-white/5' : 'border-t-[6px] border-t-red-500 border-gray-200 dark:border-white/5'}`}>
        
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:1rem_1rem]"></div>

        <div className="flex flex-col items-center space-y-6 relative z-10 w-full">
          
          <div className="flex flex-col w-full gap-4">
            <div className="bg-black/5 dark:bg-black/60 rounded-2xl w-full p-5 text-center border border-gray-200 dark:border-white/10 shadow-inner flex flex-col justify-center">
              <span className="text-[10px] uppercase font-black tracking-[0.25em] text-gray-500 flex justify-center items-center gap-2 mb-2">
                <Target className="w-3 h-3" /> {mrWhiteWord ? "Civilian Target" : "The Secret Word"}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mt-1 uppercase tracking-tight break-words">
                {secretWord}
              </h2>
            </div>

            {mrWhiteWord && (
              <div className="bg-red-500/5 dark:bg-red-950/20 rounded-2xl w-full p-5 text-center border border-red-200 dark:border-red-900/30 shadow-inner flex flex-col justify-center">
                <span className="text-[10px] uppercase font-black tracking-[0.25em] text-red-500 flex justify-center items-center gap-2 mb-2 break-normal">
                  <Skull className="w-3 h-3" /> Mr. White Target
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-red-600 dark:text-red-500 mt-1 uppercase tracking-tight break-words">
                  {mrWhiteWord}
                </h2>
              </div>
            )}
          </div>

          {!isCivilianWin && mrWhiteGuess && (
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.3 }}
               className="bg-red-100 dark:bg-red-500/10 rounded-2xl p-4 w-full text-center border border-red-300 dark:border-red-500/30"
             >
               <span className="text-[10px] uppercase font-black tracking-widest text-red-600 dark:text-red-500">Correct Guess Intercepted</span>
               <h2 className="text-3xl font-black text-red-900 dark:text-red-100 mt-1">"{mrWhiteGuess}"</h2>
             </motion.div>
          )}

          <div className="w-full text-left pt-6 border-t border-gray-200 dark:border-white/10">
            <h3 className="text-xs font-black tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-4 text-center">Intel on Target(s)</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {mrWhites.map((mw, i) => (
                 <motion.span 
                   key={mw.id} 
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: 0.5 + (0.1 * i) }}
                   className={`border font-black px-4 py-2 rounded-xl text-sm shadow-xl flex items-center gap-2 ${isCivilianWin ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-950/40 dark:border-red-500/30 dark:text-red-400' : 'bg-red-600 border-red-500 text-white'}`}
                 >
                   <Skull className="w-4 h-4" />
                   {mw.name}
                 </motion.span>
              ))}
            </div>
          </div>

        </div>
      </GlassCard>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={resetGame}
        className="w-full bg-black text-white dark:bg-white dark:text-black font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg dark:shadow-[0_0_40px_rgba(255,255,255,0.2)] group"
      >
        <RotateCcw className="w-6 h-6 group-hover:-rotate-90 transition-transform duration-500" />
        <span className="text-lg">REPLAY MISSION</span>
      </motion.button>
    </motion.div>
  );
}
