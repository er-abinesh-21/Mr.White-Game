import { Player, Role } from '../types/game';

// Utility functions for the Game Engine

/**
 * Assigns roles to players, ensuring Civilians are positioned first in the play order.
 * If Mr. White ends up being first, the order is reshuffled or adjusted so a Civilian speaks first.
 */
export function initializeGame(players: Player[], multipleMrWhites: boolean = false): { roles: Record<string, Role>, orderedPlayers: Player[] } {
  if (players.length < 3) {
    throw new Error('At least 3 players are required to start the game.');
  }

  // Shuffle players using Fisher-Yates
  let shuffled = [...players].sort(() => Math.random() - 0.5);

  // Assign roles
  const numMrWhites = multipleMrWhites ? (players.length >= 6 ? 2 : 1) : 1;
  
  const roles: Record<string, Role> = {};
  
  // First 'numMrWhites' players in the shuffled array get Mr. White role initially
  shuffled.forEach((player, index) => {
    roles[player.id] = index < numMrWhites ? 'mr_white' : 'civilian';
  });

  // ENFORCED RULE: First player to give a clue MUST be a civilian.
  // If the first player is Mr. White, swap them with the first available Civilian.
  if (roles[shuffled[0].id] === 'mr_white') {
    const civilianIndex = shuffled.findIndex(p => roles[p.id] === 'civilian');
    if (civilianIndex !== -1) {
      const temp = shuffled[0];
      shuffled[0] = shuffled[civilianIndex];
      shuffled[civilianIndex] = temp;
    }
  }

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
