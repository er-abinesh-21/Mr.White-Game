import { create } from 'zustand';
import PartySocket from 'partysocket';
import { GameState, GameSettings, GamePhase, Role, Player } from '../types/game';
import { calculateElimination } from '../engine/rules';

export interface GameStore extends GameState {
  socket: PartySocket | null;
  localPlayerId: string | null; // <-- NEW
  isOffline: boolean;
  setOfflineMode: (offline: boolean) => void;
  // Network Lifecycle Actions
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  syncState: (state: Partial<GameState>) => void;
  
  // Game Actions
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  setPhase: (phase: GamePhase) => void;
  startGame: (category: string, secretWord: string, roles: Record<string, Role>, mrWhiteWord?: string | null, orderedPlayers?: Player[] | null) => void;
  submitClue: (playerId: string, clue: string) => void;
  submitVote: (voterId: string, targetId: string) => void;
  eliminatePlayer: (playerId: string | null) => void;
  tallyVotesAndEliminate: () => void;
  mrWhiteSubmitGuess: (guess: string) => void;
  setWinner: (winner: 'civilians' | 'mr_white') => void;
  resetGame: () => void;
  startNextRound: () => void;
}

const defaultSettings: GameSettings = {
  mrWhiteHint: 'none',
  timerMode: false,
  timerSeconds: 10,
  noRepeatWords: true,
  multipleMrWhites: false,
  activeCategories: ['animals', 'movies', 'fruits', 'professions', 'countries'],
  customWords: [],
  wordSource: 'preset',
};

const initialState: Omit<GameState, 'roomId'> = {
  phase: 'setup',
  players: [],
  settings: defaultSettings,
  category: '',
  secretWord: '',
  mrWhiteWord: null,
  currentTurnIndex: 0,
  clues: {},
  round: 1,
  eliminatedPlayerId: null,
  mrWhiteGuess: null,
  winner: null,
};

export const useGameStore = create<GameStore>((set, get) => {
  // Helper to update local state and optionally broadcast to other clients
  const setAndBroadcast = (
    updateFn: (state: GameStore) => Partial<GameState>,
    broadcast: boolean = true
  ) => {
    set((state) => {
      const updates = updateFn(state);
      
      if (broadcast && state.socket) {
        state.socket.send(
          JSON.stringify({ type: "UPDATE_STATE", state: updates })
        );
      }
      
      return updates;
    });
  };

  return {
    ...initialState,
    roomId: null,
    socket: null,
    localPlayerId: null,
    isOffline: false,

    setOfflineMode: (offline) => {
      const state = get();
      if (offline) {
        state.leaveRoom();
        set({ isOffline: true, localPlayerId: null, roomId: null });
      } else {
        set({ isOffline: false });
        if (!state.roomId) {
          const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase();
          state.joinRoom(generatedId);
        }
      }
    },

    // -- Network Actions --
    joinRoom: (roomId: string) => {
      const currentSocket = get().socket;
      if (currentSocket) {
        currentSocket.close();
      }

      const partyhost = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999";
      
      const socket = new PartySocket({
        host: partyhost,
        room: roomId,
      });

      socket.addEventListener("message", (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "SYNC_STATE" && data.state) {
            get().syncState(data.state);
          }
        } catch (err) {
          console.error("Failed to parse party socket message", err);
        }
      });

      set({ socket, roomId });
    },

    leaveRoom: () => {
      const currentSocket = get().socket;
      if (currentSocket) {
        currentSocket.close();
      }
      set({ socket: null, roomId: null });
    },

    syncState: (state) => set((_state) => ({ ...state })),

    // -- Game Actions --
    addPlayer: (name) =>
      setAndBroadcast((state) => {
        const newPlayerId = crypto.randomUUID();
        // Automatically make the user who just typed their name the owner of that tab
        if (!state.localPlayerId && !state.isOffline) {
           set({ localPlayerId: newPlayerId });
        }
        
        return {
          players: [
            ...state.players,
            { id: newPlayerId, name, role: null, isAlive: true },
          ],
        };
      }),

    removePlayer: (id) =>
      setAndBroadcast((state) => ({
        players: state.players.filter((p) => p.id !== id),
      })),

    updateSettings: (newSettings) =>
      setAndBroadcast((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),

    setPhase: (phase) => setAndBroadcast(() => ({ phase })),

    startGame: (category, secretWord, roles, mrWhiteWord = null, orderedPlayers = null) =>
      setAndBroadcast((state) => {
        const basePlayers = orderedPlayers ? orderedPlayers : state.players;
        const updatedPlayers = basePlayers.map((p: any) => ({
          ...p,
          role: roles[p.id],
          isAlive: true,
          votedFor: null,
        }));

        return {
          phase: 'reveal',
          players: updatedPlayers,
          category,
          secretWord,
          mrWhiteWord,
          currentTurnIndex: 0,
          clues: {},
          round: 1,
          eliminatedPlayerId: null,
          mrWhiteGuess: null,
          winner: null,
        };
      }),

    submitClue: (playerId, clue) =>
      setAndBroadcast((state) => {
        const newClues = { ...state.clues, [playerId]: clue };
        
        let nextIndex = state.currentTurnIndex + 1;
        while (nextIndex < state.players.length && !state.players[nextIndex].isAlive) {
          nextIndex++;
        }
        
        return {
          clues: newClues,
          currentTurnIndex: nextIndex,
        };
      }),

    submitVote: (voterId, targetId) =>
      setAndBroadcast((state) => {
        const updatedPlayers = state.players.map((p) =>
          p.id === voterId ? { ...p, votedFor: targetId } : p
        );
        return { players: updatedPlayers };
      }),

    tallyVotesAndEliminate: () =>
      setAndBroadcast((state) => {
        const eliminatedId = calculateElimination(state.players);
        
        if (!eliminatedId) {
          return {
            eliminatedPlayerId: null,
            phase: 'elimination',
          };
        }
        const updatedPlayers = state.players.map((p) =>
          p.id === eliminatedId ? { ...p, isAlive: false } : p
        );
        return {
          players: updatedPlayers,
          eliminatedPlayerId: eliminatedId,
          phase: 'elimination',
        };
      }),

    eliminatePlayer: (playerId) =>
      setAndBroadcast((state) => {
        if (!playerId) {
          return {
            eliminatedPlayerId: null,
            phase: 'elimination',
          };
        }
        const updatedPlayers = state.players.map((p) =>
          p.id === playerId ? { ...p, isAlive: false } : p
        );
        return {
          players: updatedPlayers,
          eliminatedPlayerId: playerId,
          phase: 'elimination',
        };
      }),

    mrWhiteSubmitGuess: (guess) =>
      setAndBroadcast(() => ({ mrWhiteGuess: guess })),

    setWinner: (winner) =>
      setAndBroadcast(() => ({ winner, phase: 'result' })),

    startNextRound: () =>
      setAndBroadcast((state) => {
        const firstAliveIndex = state.players.findIndex(p => p.isAlive);
        
        if (firstAliveIndex === -1) {
          return {
             winner: 'mr_white',
             phase: 'result'
          };
        }

        return {
          phase: 'clue',
          currentTurnIndex: firstAliveIndex,
          clues: {},
          round: state.round + 1,
          players: state.players.map(p => ({ ...p, votedFor: null })),
          eliminatedPlayerId: null
        };
      }),

    resetGame: () =>
      setAndBroadcast(() => ({
        phase: 'setup',
        category: '',
        secretWord: '',
        mrWhiteWord: null,
        currentTurnIndex: 0,
        clues: {},
        round: 1,
        eliminatedPlayerId: null,
        mrWhiteGuess: null,
        winner: null,
      })),
  };
});
