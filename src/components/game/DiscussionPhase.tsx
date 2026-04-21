import { useState, useEffect } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { GlassCard } from "../ui/GlassCard";
import { MessageSquare, Timer, ArrowRight } from "lucide-react";

export function DiscussionPhase() {
  const { settings, setPhase } = useGameStore();
  const [timeLeft, setTimeLeft] = useState(settings.timerMode ? settings.timerSeconds : 60); // Default 60s if not set but timer enabled

  useEffect(() => {
    if (!settings.timerMode) return;
    
    if (timeLeft <= 0) {
      setPhase("voting");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, settings.timerMode, setPhase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full max-w-md mx-auto animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-8">
        <MessageSquare className="w-12 h-12 mx-auto text-gray-500/50 dark:text-white/50 mb-3" />
        <h1 className="text-2xl font-bold tracking-widest text-gray-700 dark:text-gray-300 uppercase">Discussion</h1>
        <p className="text-sm text-gray-600 dark:text-gray-500 mt-2">Discuss who you think Mr. White is!</p>
      </div>

      <GlassCard className="w-full bg-white/50 dark:bg-neutral-900 border border-gray-200 dark:border-white/10 p-8 shadow-2xl mb-8 flex flex-col items-center justify-center min-h-[300px]">
        {settings.timerMode ? (
          <div className="flex flex-col items-center justify-center">
            <Timer className={`w-16 h-16 mb-4 ${timeLeft <= 10 ? 'text-red-600 dark:text-red-500 animate-pulse' : 'text-blue-600 dark:text-blue-400'}`} />
            <h2 className={`text-6xl font-black font-mono tracking-tighter ${timeLeft <= 10 ? 'text-red-600 dark:text-red-500' : 'text-gray-900 dark:text-white'}`}>
              {formatTime(timeLeft)}
            </h2>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center opacity-70">
            <MessageSquare className="w-16 h-16 mb-4 text-green-600 dark:text-green-400" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">Untimed Discussion</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-center text-sm">Take your time to deliberate. Proceed to voting whenever you are ready.</p>
          </div>
        )}
      </GlassCard>

      <button
        onClick={() => setPhase("voting")}
        className="w-full bg-black text-white dark:bg-white dark:text-black font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all hover:scale-[1.02] shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.15)] group"
      >
        <span>Proceed to Voting</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
