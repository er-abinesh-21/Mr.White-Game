import { useGameStore } from "@/lib/store/gameStore";
import { GlassCard } from "../ui/GlassCard";
import { Users2, Settings2, Play, UserPlus, XCircle, Link as LinkIcon, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getRandomWordWithSettings } from "@/lib/data/words";
import { initializeGame } from "@/lib/engine/rules";

export function SetupPhase() {
  const { addPlayer, removePlayer, players, roomId, joinRoom, startGame, settings, isOffline, setOfflineMode, localPlayerId, hostPlayerId, updateSettings } = useGameStore();
  const [onlineMenuState, setOnlineMenuState] = useState<'start' | 'name' | 'choose' | 'join' | 'lobby'>('start');
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');

  // If a user gets here with a localPlayerId and a roomId, they belong in the lobby.
  useEffect(() => {
    if (!isOffline && localPlayerId && roomId) {
      setOnlineMenuState('lobby');
    } else if (isOffline && onlineMenuState !== 'lobby') {
      setOnlineMenuState('lobby'); // Offline mode just goes to the lobby setup
    }
  }, [localPlayerId, roomId, isOffline, onlineMenuState]);

  // Read URL parameters if the user was invited via link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const roomFromUrl = urlParams.get('room');
      if (roomFromUrl && !roomId) {
        setOfflineMode(false);
        setRoomCodeInput(roomFromUrl.toUpperCase());
        setOnlineMenuState('name'); // They still need to enter their name
      }
    }
  }, [roomId, setOfflineMode]);

  const handleStartGame = () => {
    if (players.length < 3) {
      alert("At least 3 players are required to start the game.");
      return;
    }
    
    if (isOffline) {
      // Local offline play logic
      try {
        const result = getRandomWordWithSettings(settings);
        const { roles, orderedPlayers } = initializeGame(players, settings.multipleMrWhites);
        startGame(result.category, result.word, roles, result.relatedWord, orderedPlayers);
      } catch (err: unknown) {
        alert((err as Error).message || "Failed to initialize game.");
      }
    } else {
      // Online mode logic
      const { socket } = useGameStore.getState();
      if (socket && roomId) {
        socket.send(JSON.stringify({ 
          type: "START_GAME", 
          settings: settings 
        }));
      }
    }
  };

  const copyRoomCode = () => {
    if (typeof window !== 'undefined' && roomId) {
      navigator.clipboard.writeText(roomId);
      alert("Room code copied to clipboard!");
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCodeInput.trim().length > 0) {
      const code = roomCodeInput.trim().toUpperCase();
      joinRoom(code);
      setRoomCodeInput('');
      
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('room', code);
        window.history.pushState({}, '', url.toString());
      }
    }
  };

  const handleGoBack = () => {
    if (isOffline) {
      setOfflineMode(false);
      setOnlineMenuState('start');
    } else {
      if (onlineMenuState === 'join') setOnlineMenuState('choose');
      else if (onlineMenuState === 'choose') setOnlineMenuState('name');
      else if (onlineMenuState === 'name') {
        setOnlineMenuState('start');
      }
      else if (onlineMenuState === 'lobby') {
        const { socket } = useGameStore.getState();
        if (socket) socket.close();
        useGameStore.setState({ socket: null, roomId: null, players: [], localPlayerId: null });
        window.history.pushState({}, '', '/');
        setOnlineMenuState('start');
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto relative"
    >
      {(onlineMenuState !== 'start') && (
        <button 
          onClick={handleGoBack}
          className="absolute top-2 left-2 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-black/10 dark:border-white/10 z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      )}

      <Link href="/settings" className="absolute top-2 right-2 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-black/10 dark:border-white/10 z-10">
        <Settings2 className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" />
      </Link>

      <div className="text-center mb-6 mt-2">
        <motion.div 
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          className="inline-block bg-black/5 dark:bg-white/10 p-4 rounded-3xl mb-4 border border-black/10 dark:border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.05)] dark:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        >
          <Users2 className="w-10 h-10 text-gray-800 dark:text-white" />
        </motion.div>
        <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-500 dark:from-white dark:to-gray-500 drop-shadow-2xl">
          MR. WHITE
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium tracking-wide">Social Deduction Game</p>
      </div>

      {/* Online Room Code Copier (Only in Lobby) */}
      {!isOffline && roomId && onlineMenuState === 'lobby' && (
        <div className="w-full flex-col flex gap-2 w-full max-w-sm mx-auto mb-6">
          <div className="w-full flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 shadow-sm">
            <div>
              <span className="text-sm text-gray-500 dark:text-blue-200">Room Code</span>
              <div className="font-bold text-xl text-blue-700 dark:text-blue-400 tracking-widest">{roomId}</div>
            </div>
            <button 
              onClick={copyRoomCode}
              className="flex items-center gap-2 bg-blue-100/50 hover:bg-blue-200 dark:bg-blue-800/50 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg transition-colors font-medium text-sm"
            >
              <LinkIcon className="w-4 h-4" />
              Copy Code
            </button>
          </div>
        </div>
      )}
      
      <GlassCard className="w-full bg-white/80 dark:bg-neutral-900/60 border-black/10 dark:border-white/10 shadow-2xl p-6 md:p-8">
        
        {/* UI State Machine for Online Mode */}
        {onlineMenuState === 'start' && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => { setOfflineMode(false); setOnlineMenuState('name'); }}
              className="flex items-center justify-between p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex flex-col text-left">
                <span className="font-black text-xl tracking-wide">PLAY ONLINE</span>
                <span className="text-blue-200 text-sm font-medium">Join or host a remote room</span>
              </div>
              <Wifi className="w-8 h-8 opacity-80" />
            </button>
            <button
              onClick={() => { setOfflineMode(true); setOnlineMenuState('lobby'); }}
              className="flex items-center justify-between p-6 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex flex-col text-left">
                <span className="font-black text-xl tracking-wide">PASS & PLAY</span>
                <span className="text-green-200 text-sm font-medium">Play offline on one device</span>
              </div>
              <WifiOff className="w-8 h-8 opacity-80" />
            </button>
          </div>
        )}

        {!isOffline ? (
          <>
            {onlineMenuState === 'name' && (
              <form 
                className="flex flex-col gap-3 isolate relative z-10"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (playerNameInput.trim()) {
                    setOnlineMenuState(roomCodeInput ? 'join' : 'choose');
                  }
                }}
              >
                <div className="text-center mb-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-widest">Register Profile</h2>
                  <p className="text-sm text-gray-500">Pick a display name for online play</p>
                </div>
                <div className="relative w-full">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="text" 
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    placeholder="Enter your display name..."
                    className="w-full bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!playerNameInput.trim()}
                  className="w-full bg-blue-600 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:bg-blue-500 transition-colors"
                >
                  Continue
                </motion.button>
              </form>
            )}

            {onlineMenuState === 'choose' && (
              <div className="flex flex-col gap-3 isolate relative z-10 text-center">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-2">Welcome, {playerNameInput}</h2>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase();
                    joinRoom(generatedId);
                    addPlayer(playerNameInput.trim());
                    setOnlineMenuState('lobby');
                  }}
                  className="w-full bg-blue-600 text-white px-5 py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:bg-blue-500 transition-colors"
                >
                  Create New Room
                </motion.button>

                <div className="flex items-center gap-4 my-2">
                  <div className="h-px bg-black/10 dark:bg-white/10 flex-1" />
                  <span className="text-xs font-bold text-gray-400 uppercase">OR</span>
                  <div className="h-px bg-black/10 dark:bg-white/10 flex-1" />
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setOnlineMenuState('join')}
                  className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 px-5 py-4 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Join Existing Room
                </motion.button>
                <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
                  <button onClick={() => setOnlineMenuState('name')} className="text-sm font-medium text-gray-500 hover:text-gray-800 dark:hover:text-white">Edit Profile Name</button>
                </div>
              </div>
            )}

            {onlineMenuState === 'join' && (
              <form 
                className="flex flex-col gap-3 isolate relative z-10 text-center"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (roomCodeInput.trim() && playerNameInput.trim()) {
                    const code = roomCodeInput.trim().toUpperCase();
                    joinRoom(code);
                    addPlayer(playerNameInput.trim());
                    
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location.href);
                      url.searchParams.set('room', code);
                      window.history.pushState({}, '', url.toString());
                    }
                  }
                }}
              >
                <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-2">Join Room</h2>
                <div className="relative w-full">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="text" 
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="Enter 6-character code"
                    className="w-full uppercase tracking-widest bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!roomCodeInput.trim() || roomCodeInput.trim().length !== 6}
                  className="w-full bg-blue-600 disabled:opacity-50 text-white px-5 py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:bg-blue-500 transition-colors"
                >
                  Join Room Lobby
                </motion.button>

                <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
                  <button type="button" onClick={() => setOnlineMenuState('choose')} className="text-sm font-medium text-gray-500 hover:text-gray-800 dark:hover:text-white">Go Back</button>
                </div>
              </form>
            )}

            {onlineMenuState === 'lobby' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 text-center mb-6">
                <span className="text-xs uppercase font-bold tracking-widest text-blue-600/70 dark:text-blue-400/70">Playing As</span>
                <div className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1 flex justify-center items-center gap-2">
                  {players.find(p => p.id === localPlayerId)?.name || playerNameInput || "Unknown"}
                </div>
              </div>
            )}
          </>
        ) : (
          <form 
            className="flex flex-col gap-3 isolate relative z-10"
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem('playerName') as HTMLInputElement;
              if (input.value.trim()) {
                addPlayer(input.value.trim());
                input.value = '';
                input.focus();
              }
            }}
          >
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-widest">Add Players</h2>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  name="playerName" 
                  placeholder="Add a player's name..."
                  className="w-full bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                  autoComplete="off"
                />
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit" 
                className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.2)] dark:shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-colors flex items-center justify-center whitespace-nowrap"
              >
                Add
              </motion.button>
            </div>
          </form>
        )}

        {/* Players List (Only show if Offline, or in Lobby if Online) */}
        {(isOffline || onlineMenuState === 'lobby') && (
        <div className="flex flex-col gap-2 mt-6 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
          <AnimatePresence>
            {players.map((p, idx) => (
              <motion.div 
                key={p.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-3 sm:p-4 rounded-xl border border-black/5 dark:border-white/5 group hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/20 dark:border-blue-500/30">
                    {idx + 1}
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-lg tracking-wide">{p.name}</span>
                </div>
                <button 
                  onClick={() => removePlayer(p.id)}
                  className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {players.length === 0 && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-gray-500 text-center py-6 border border-dashed border-black/10 dark:border-white/10 rounded-xl"
            >
              Waiting for players to join...
            </motion.p>
          )}
        </div>
        )}

        {/* Game Settings (Only shown to Host or Offline) */}
        {(isOffline || (onlineMenuState === 'lobby' && hostPlayerId === localPlayerId)) && (
          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="flex items-center gap-2 mb-4 text-gray-400">
              <Settings2 className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Game Settings</h3>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-black/20 rounded-xl border border-black/10 dark:border-white/5">
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">Mr. White Hint</span>
                  <select 
                    className="bg-white text-gray-900 border border-black/10 dark:bg-neutral-800 dark:text-white dark:border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={settings.mrWhiteHint || "none"}
                    onChange={(e) => updateSettings({ mrWhiteHint: e.target.value as "none" | "category" | "hard" })}
                  >
                    <option value="none">No Hint</option>
                    <option value="category">Category Only</option>
                    <option value="hard">Hard Mode</option>
                  </select>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-black/20 rounded-xl border border-black/10 dark:border-white/5">
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">Two Mr. Whites <span className="text-gray-500 text-xs ml-1">(6+ Players)</span></span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={!!settings.multipleMrWhites}
                      onChange={(e) => updateSettings({ multipleMrWhites: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-300 dark:bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 border border-black/10 dark:border-white/10 cursor-pointer"></div>
                  </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-black/20 rounded-xl border border-black/10 dark:border-white/5">
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">Typed Clues <span className="text-gray-500 text-xs ml-1">(off = speak)</span></span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={!!settings.typedClueMode}
                      onChange={(e) => updateSettings({ typedClueMode: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-300 dark:bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 border border-black/10 dark:border-white/10 cursor-pointer"></div>
                  </label>
              </div>
            </div>
          </div>
        )}

        {(isOffline || onlineMenuState === 'lobby') && (
          <>
            {(isOffline || hostPlayerId === localPlayerId) ? (
              <motion.button 
                whileHover={{ scale: players.length >= 3 ? 1.02 : 1 }}
                whileTap={{ scale: players.length >= 3 ? 0.98 : 1 }}
                onClick={handleStartGame}
                disabled={players.length < 3}
                className="w-full mt-8 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black font-black py-4 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                <Play className="w-5 h-5 fill-current" />
                {isOffline ? "START LOCAL GAME" : "START PARTY GAME"}
              </motion.button>
            ) : (
              <div className="w-full mt-8 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-500 font-bold tracking-widest text-sm uppercase py-4 rounded-xl flex flex-col gap-1 items-center justify-center text-center">
                Waiting for Host...
                <span className="text-[10px] text-gray-400 normal-case tracking-normal">({players.length} players so far)</span>
              </div>
            )}
          </>
        )}
      </GlassCard>
    </motion.div>
  );
}
