import { Player, Role } from '../types/game';

// Utility functions for the Game Engine

/**
 * Assigns roles randomly to players.
 */
export function initializeGame(players: Player[], multipleMrWhites: boolean = false): { roles: Record<string, Role>, orderedPlayers: Player[] } {
  if (players.length < 3) {
    throw new Error('At least 3 players are required to start the game.');
  }

  // Proper Fisher-Yates shuffle
  let shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const numMrWhites = multipleMrWhites ? (players.length >= 6 ? 2 : 1) : 1;
  const roles: Record<string, Role> = {};
  const allIndices = Array.from({ length: shuffled.length }, (_, i) => i);

  for (let i = allIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
  }

  const mrWhiteIndices = new Set(allIndices.slice(0, numMrWhites));

  shuffled.forEach((player, index) => {
    roles[player.id] = mrWhiteIndices.has(index) ? 'mr_white' : 'civilian';
  });

  return { roles, orderedPlayers: shuffled };
}

/**
 * Process votes and returns the player ID with the absolute majority.
 * If there is a tie, returns null.
 */
export function calculateElimination(players: Player[]): string | null {
  const votes: Record<string, number> = {};
  let totalVotes = 0;

  players.filter(p => p.isAlive).forEach(p => {
    if (p.votedFor) {
      votes[p.votedFor] = (votes[p.votedFor] || 0) + 1;
      totalVotes++;
    }
  });

  if (totalVotes === 0) return null;

  let maxVotes = 0;
  let eliminatedId: string | null = null;
  let isTie = false;

  for (const [id, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedId = id;
      isTie = false;
    } else if (count === maxVotes) {
      isTie = true;
    }
  }

  // Determine if it was an absolute majority or just the highest votes.
  // For basic game logic, the highest votes is eliminated, but ties result in a re-vote (or no elimination).
  return isTie ? null : eliminatedId;
}

/**
 * Validates a word guess for Mr. White against the secret word.
 * Basic implementation converts to lowercase and trims.
 */
export function validateMrWhiteGuess(guess: string, secretWord: string): boolean {
  return guess.trim().toLowerCase() === secretWord.trim().toLowerCase();
}
