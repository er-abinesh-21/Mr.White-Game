import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  beginCluePhase: () => void;
  resetGame: () => void;
  startNextRound: () => void;
}

const defaultSettings: GameSettings = {
  mrWhiteHint: 'none',
  mrWhiteGuessEnabled: true,
  typedClueMode: false,
  timerMode: false,
  timerSeconds: 10,
  noRepeatWords: true,
  multipleMrWhites: false,
  activeCategories: ['animals', 'movies', 'fruits', 'professions', 'countries'],
  customWords: [],
  wordSource: 'preset',
};

const initialState: Omit<GameState, 'roomId'> = {
  hostPlayerId: null,
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

function shufflePlayers(players: Player[]): Player[] {
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function shuffleClueOrder(players: Player[], round: number): Player[] {
  const shuffled = shufflePlayers(players);

  if (shuffled[0]?.role === 'mr_white') {
    const [firstPlayer] = shuffled.splice(0, 1);
    const targetIndex = 1 + Math.floor(Math.random() * Math.min(2, shuffled.length));
    shuffled.splice(targetIndex, 0, firstPlayer);
  }

  return shuffled;
}

function getNextClueEligibleIndex(players: Player[], fromIndex: number): number {
  for (let i = fromIndex + 1; i < players.length; i++) {
    const player = players[i];
    if (!player.isAlive) continue;
    return i;
  }
  return -1;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => {
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

      const configuredHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
      const isLocalBrowser =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      const partyhost = isLocalBrowser
        ? (configuredHost && (configuredHost.includes('localhost') || configuredHost.includes('127.0.0.1'))
            ? configuredHost
            : '127.0.0.1:1999')
        : (configuredHost || '127.0.0.1:1999');
      
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

      socket.addEventListener("error", (err) => {
        console.error("PartySocket connection error", err);
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
    addPlayer: (name) => {
      const state = get();
      const newPlayerId = crypto.randomUUID();
      const trimmedName = name.trim();

      if (!trimmedName) return;

      // Automatically make the user who just typed their name the owner of that tab
      if (!state.localPlayerId && !state.isOffline) {
        set({ localPlayerId: newPlayerId });
      }

      if (!state.isOffline && state.socket) {
        const payload = JSON.stringify({
          type: 'ADD_PLAYER',
          player: { id: newPlayerId, name: trimmedName, role: null, isAlive: true },
          settings: state.settings,
        });

        if (state.socket.readyState === WebSocket.OPEN) {
          state.socket.send(payload);
        } else {
          const sendWhenOpen = () => {
            state.socket?.send(payload);
            state.socket?.removeEventListener('open', sendWhenOpen);
          };
          state.socket.addEventListener('open', sendWhenOpen);
        }
        return;
      }

      setAndBroadcast((currentState) => ({
        hostPlayerId: currentState.hostPlayerId ?? (currentState.players.length === 0 ? newPlayerId : null),
        players: [
          ...currentState.players,
          { id: newPlayerId, name: trimmedName, role: null, isAlive: true },
        ],
      }));
    },

    removePlayer: (id) => {
      const state = get();

      if (!state.isOffline && state.socket) {
        state.socket.send(JSON.stringify({ type: 'REMOVE_PLAYER', playerId: id }));
        return;
      }

      setAndBroadcast((currentState) => ({
        hostPlayerId:
          currentState.hostPlayerId === id
            ? (currentState.players.find((p) => p.id !== id)?.id ?? null)
            : currentState.hostPlayerId,
        players: currentState.players.filter((p) => p.id !== id),
      }));
    },

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
        const nextIndex = getNextClueEligibleIndex(state.players, state.currentTurnIndex);

        if (nextIndex === -1) {
          return {
            clues: newClues,
            phase: 'discussion',
          };
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

    beginCluePhase: () => 
      setAndBroadcast((state) => {
        const shuffled = shuffleClueOrder(state.players, state.round);
        const firstEligibleIndex = getNextClueEligibleIndex(shuffled, -1);

        if (firstEligibleIndex === -1) {
          return {
            phase: 'discussion',
            players: shuffled,
          };
        }

        return {
          phase: 'clue',
          players: shuffled,
          clues: {},
          currentTurnIndex: firstEligibleIndex,
        };
      }),

    startNextRound: () =>
      setAndBroadcast((state) => {
        const nextRound = state.round + 1;
        const shuffled = shuffleClueOrder(state.players, nextRound).map(p => ({ ...p, votedFor: null }));
        const firstEligibleIndex = getNextClueEligibleIndex(shuffled, -1);
        
        if (firstEligibleIndex === -1) {
          return {
             winner: 'mr_white',
             phase: 'result'
          };
        }

        return {
          phase: 'clue',
          currentTurnIndex: firstEligibleIndex,
          clues: {},
          round: nextRound,
          players: shuffled,
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
},
{
  name: 'mrwhite-store',
  partialize: (state) => ({ 
    settings: state.settings 
  }), // Only persist rules/settings
  merge: (persistedState, currentState) => {
    const persisted = persistedState as Partial<GameStore>;
    return {
      ...currentState,
      ...persisted,
      settings: {
        ...currentState.settings,
        ...(persisted?.settings || {}),
      },
    };
  },
}
));
