export type Role = 'civilian' | 'mr_white';
export type GamePhase = 'setup' | 'reveal' | 'clue' | 'discussion' | 'voting' | 'elimination' | 'result';

export interface Player {
  id: string;
  name: string;
  role: Role | null;
  isAlive: boolean;
  votedFor?: string | null;
}

export interface GameSettings {
  mrWhiteHint: 'none' | 'category' | 'hard';
  mrWhiteGuessEnabled: boolean;
  typedClueMode: boolean;
  timerMode: boolean;
  timerSeconds: number;
  noRepeatWords: boolean;
  multipleMrWhites: boolean;
  activeCategories: string[];
  customWords: string[];
  wordSource: 'preset' | 'custom' | 'both';
}

export interface GameState {
  roomId: string | null;
  hostPlayerId: string | null;
  phase: GamePhase;
  players: Player[];
  settings: GameSettings;
  category: string;
  secretWord: string;
  mrWhiteWord: string | null;
  currentTurnIndex: number; // Index in the players array for clue phase
  clues: Record<string, string>; // playerId -> clue given
  round: number;
  eliminatedPlayerId: string | null;
  mrWhiteGuess: string | null;
  winner: 'civilians' | 'mr_white' | null;
}

export interface WordCategory {
  id: string;
  name: string;
  words: string[];
}
