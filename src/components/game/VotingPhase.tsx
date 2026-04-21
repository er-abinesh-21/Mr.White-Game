import { useState } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { GlassCard } from "../ui/GlassCard";
import { UserCheck2, CheckCircle2 } from "lucide-react";

export function VotingPhase() {
  const { players, submitVote, tallyVotesAndEliminate, localPlayerId } = useGameStore();

  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [isVotingRevealed, setIsVotingRevealed] = useState(!localPlayerId ? false : true); // Hides vote list for passing device offline

  const voters = players.filter(p => p.isAlive);
  
  // For online mode, identify the current user
  const myPlayer = players.find(p => p.id === localPlayerId);

  // In pass-and-play, use the loop index. In online, use myPlayer (if alive).
  const activeVoter = localPlayerId 
    ? myPlayer 
    : voters[currentVoterIndex];

  const hasVoted = localPlayerId ? myPlayer?.votedFor !== null : false;
  const numVoted = players.filter(p => p.isAlive && p.votedFor !== null).length;

  const handleVoteSubmit = () => {
    if (!selectedTarget || !activeVoter?.id) return;

    submitVote(activeVoter.id, selectedTarget);
    setSelectedTarget(null);

    if (localPlayerId) {
      // Online mode: We don't increment a local index. 
      // We just check if we are the last person to vote.
      if (numVoted + 1 === voters.length) {
        tallyVotesAndEliminate();
      }
    } else {
      // Pass-and-play mode
      setIsVotingRevealed(false); // Hide the screen for the next person
      if (currentVoterIndex < voters.length - 1) {
        setCurrentVoterIndex(prev => prev + 1);
      } else {
        // Finish Voting and process automatically
        tallyVotesAndEliminate(); 
      }
    }
  };

  // Online Mode: Spectator / Already Voted views
  if (localPlayerId) {
    if (!myPlayer?.isAlive) {
      return (
        <div className="flex flex-col items-center justify-center p-4 w-full h-full max-w-md mx-auto">
           <UserCheck2 className="w-12 h-12 mx-auto text-gray-600 mb-3 opacity-50" />
           <h1 className="text-2xl font-bold tracking-widest text-gray-500 uppercase">Voting Phase</h1>
           <p className="text-xl mt-4 font-black text-gray-400">You are eliminated.</p>
           <p className="text-sm mt-2 text-gray-500">Watching the survivors vote...</p>
           <div className="mt-8 text-gray-400 font-bold">{numVoted} / {voters.length} Voted</div>
        </div>
      );
    }
    
    if (hasVoted) {
      return (
        <div className="flex flex-col items-center justify-center p-4 w-full h-full max-w-md mx-auto animate-pulse">
           <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
           <h1 className="text-2xl font-bold tracking-widest text-gray-700 dark:text-gray-300 uppercase">Vote Cast</h1>
           <p className="text-sm mt-4 text-gray-500 font-medium">Waiting for other players to vote...</p>
           <div className="mt-8 text-gray-500 dark:text-gray-400 font-bold">{numVoted} / {voters.length} Voted</div>
        </div>
      );
    }
  }

  // Active Voter View (Pass-and-play OR Online user who hasn't voted yet)
  if (!isVotingRevealed && !localPlayerId) {
    return (
      <div className="flex flex-col items-center justify-center p-4 w-full h-full max-w-md mx-auto animate-in fade-in">
         <UserCheck2 className="w-12 h-12 mx-auto text-blue-600 mb-3" />
         <h1 className="text-2xl font-bold tracking-widest text-gray-700 uppercase">Voting Phase</h1>
         <p className="text-xl text-gray-900 mt-4 font-black">Pass to {activeVoter?.name}</p>
         <button
            onClick={() => setIsVotingRevealed(true)}
            className="mt-8 bg-blue-600 text-white font-extrabold py-3 px-8 rounded-xl hover:bg-blue-700"
         >
            I am {activeVoter?.name}
         </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full max-w-md mx-auto animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-8">
        <UserCheck2 className="w-12 h-12 mx-auto text-blue-600 dark:text-blue-400 mb-3" />
        <h1 className="text-2xl font-bold tracking-widest text-gray-700 dark:text-gray-300 uppercase">Voting Phase</h1>
        <p className="text-xl text-gray-900 dark:text-white mt-4 font-black">{activeVoter?.name}, who is Mr. White?</p>
      </div>

      <GlassCard className="w-full bg-white/50 dark:bg-neutral-900 border border-gray-200 dark:border-white/10 p-6 shadow-2xl mb-8 opacity-100 flex flex-col space-y-3 max-h-[60vh] overflow-y-auto">
        {players.map((p) => {
          if (!p.isAlive || p.id === activeVoter?.id) return null; // Can't vote for self or dead
          return (
             <div 
               key={p.id}
               onClick={() => setSelectedTarget(p.id)}
               className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${selectedTarget === p.id ? 'bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] dark:shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-gray-100/50 dark:bg-white/5 border-gray-300 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10'}`}
             >
               <span className="font-bold text-gray-900 dark:text-white text-lg">{p.name}</span>
               {selectedTarget === p.id && <CheckCircle2 className="w-6 h-6 text-red-600 dark:text-red-500" />}
             </div>
          );
        })}
      </GlassCard>

      <button
        onClick={handleVoteSubmit}
        disabled={!selectedTarget}
        className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-extrabold py-4 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:from-red-700 hover:to-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
      >
        Vote
      </button>

      <div className="mt-4 text-gray-500 dark:text-gray-400 font-semibold tracking-wider text-xs flex gap-1">
         {localPlayerId ? (
           <span>{numVoted} / {voters.length} Voted</span>
         ) : (
           <span>{currentVoterIndex + 1} / {voters.length} Voted</span>
         )}
      </div>
    </div>
  );
}
