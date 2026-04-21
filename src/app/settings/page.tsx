"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { PRESET_CATEGORIES } from "@/lib/data/words";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft, Moon, Sun, CheckCircle2, Circle } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { settings, updateSettings, players } = useGameStore();

  const [tempCustomWords, setTempCustomWords] = useState(
    settings.customWords ? settings.customWords.join(", ") : ""
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleCategory = (categoryId: string) => {
    const active = settings.activeCategories || [];
    if (active.includes(categoryId)) {
      updateSettings({ activeCategories: active.filter(id => id !== categoryId) });
    } else {
      updateSettings({ activeCategories: [...active, categoryId] });
    }
  };

  const handleCustomWordsChange = (value: string) => {
    setTempCustomWords(value);
    const parsed = value.split(",").map(w => w.trim()).filter(w => w.length > 0);
    updateSettings({ customWords: parsed });
  };

  // Helper for Theme to avoid hydration mismatch
  const currentTheme = mounted ? theme : "dark";

  return (
    <div className="flex flex-col items-center justify-start p-6 w-full h-full max-w-md mx-auto overflow-y-auto relative">
      <div className="flex items-center justify-between w-full mb-6 mt-4">
        <Link href="/" className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-black/10 dark:border-white/10 z-10">
          <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">SETTINGS</h1>
        <div className="w-10 z-10"></div> {/* Placeholder for centering */}
      </div>

      <GlassCard className="w-full mb-6 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Theme</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Toggle light and dark mode</p>
          </div>
          <div className="flex gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setTheme("light")}
              className={`p-2 rounded-lg transition-all ${currentTheme === "light" ? "bg-white dark:bg-gray-700 shadow-md text-blue-500" : "text-gray-500 dark:text-gray-400 hover:bg-black/5"}`}
            >
              <Sun className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`p-2 rounded-lg transition-all ${currentTheme === "dark" ? "bg-white dark:bg-gray-700 shadow-md text-blue-500" : "text-gray-500 dark:text-gray-400 hover:bg-black/5"}`}
            >
              <Moon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="w-full mb-6 p-5">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Game Rules</h2>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Timer Mode</span>
          <button 
            onClick={() => updateSettings({ timerMode: !settings.timerMode })}
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.timerMode ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}
          >
            <div className={`w-4 h-4 rounded-full absolute top-1 transition-all ${settings.timerMode ? 'left-7 bg-white' : 'left-1 bg-white dark:bg-gray-900 shadow-sm'}`} />
          </button>
        </div>

        {settings.timerMode && (
          <div className="mt-4 bg-black/5 dark:bg-white/5 p-3 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Round Time</span>
              <span className="text-sm font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">{settings.timerSeconds}s</span>
            </div>
            <input 
              type="range" 
              min="5" max="60" step="5"
              value={settings.timerSeconds || 10} 
              onChange={(e) => updateSettings({ timerSeconds: parseInt(e.target.value) })}
              className="w-full accent-blue-500"
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Multiple Mr. Whites</span>
          <button 
            onClick={() => updateSettings({ multipleMrWhites: !settings.multipleMrWhites })}
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.multipleMrWhites ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}
          >
             <div className={`w-4 h-4 rounded-full absolute top-1 transition-all ${settings.multipleMrWhites ? 'left-7 bg-white' : 'left-1 bg-white dark:bg-gray-900 shadow-sm'}`} />
          </button>
        </div>
      </GlassCard>

      <GlassCard className="w-full mb-6 p-5">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Words Source</h2>
        
        <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl mb-4 mt-3">
          {(["preset", "custom", "both"] as const).map(src => (
            <button
              key={src}
              onClick={() => updateSettings({ wordSource: src })}
              className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${settings.wordSource === src ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-black/5 dark:border-white/10" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
            >
              {src}
            </button>
          ))}
        </div>

        {(settings.wordSource === 'preset' || settings.wordSource === 'both') && (
          <div className="mt-5">
            <h3 className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-3">Preset Categories</h3>
            <div className="space-y-2">
              {PRESET_CATEGORIES.map(cat => {
                const isActive = settings.activeCategories?.includes(cat.id);
                return (
                  <div 
                    key={cat.id} 
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-colors ${isActive ? 'bg-blue-50/80 border-blue-200 dark:bg-blue-900/20 dark:border-blue-500/30' : 'bg-black/5 border-transparent dark:bg-white/5'}`}
                  >
                    <span className={`text-sm font-bold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>{cat.name}</span>
                    {isActive ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5 text-gray-400" />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(settings.wordSource === 'custom' || settings.wordSource === 'both') && (
          <div className="mt-6">
             <h3 className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-3">Custom Words <span className="font-normal lowercase ml-1 tracking-normal">(comma separated)</span></h3>
             <textarea 
               value={tempCustomWords}
               onChange={(e) => handleCustomWordsChange(e.target.value)}
               placeholder="e.g. Lightsaber, Harry Potter, Superman..."
               className="w-full h-24 p-3 rounded-xl bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none shadow-inner"
             />
             <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-wider">
               {settings.customWords?.length || 0} custom words
             </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}