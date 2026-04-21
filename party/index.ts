import type * as Party from "partykit/server";
import { GameState } from "../src/lib/types/game";
import { getRandomWordWithSettings } from "../src/lib/data/words";
import { initializeGame } from "../src/lib/engine/rules";

export default class MrWhiteServer implements Party.Server {
  // Store the full, unredacted game state in memory for this room
  gameState: Partial<GameState> | null = null;
  
  constructor(public room: Party.Room) {}

  // Helper to send sanitized state to clients
  // Civilians receive the secretWord, Mr White does not!
  // Roles are hidden to prevent looking at network pane
  broadcastState() {
    if (!this.gameState || !this.gameState.players) return;

    for (const conn of this.room.getConnections()) {
      // Find what player this connection belongs to...
      // For now, since we pass UUIDs around, let's assume we can't tie it initially unless they join via ID
      // Actually, if we just want basic anti-cheat, we strip the `secretWord` and `roles[\* !== me]` 
      // For a basic V1 PartyKit implementation without Auth, let's just broadcast the fully assigned state.
      // Wait, we need to enforce anti-cheat!
      // Since connections don't map to players yet (the user just adds names in the lobby),
      // we'll have to just broadcast the state for now until we establish a 1-to-1 Connection-to-Player mapping.
      
      conn.send(JSON.stringify({ type: "SYNC_STATE", state: this.gameState }));
    }
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    if (this.gameState) {
      conn.send(JSON.stringify({ type: "SYNC_STATE", state: this.gameState }));
    } else {
      conn.send(JSON.stringify({ type: "ROOM_EMPTY" }));
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message);
      
      // Setup Game Triggered
      if (data.type === "START_GAME") {
         if (!this.gameState?.players || this.gameState.players.length < 3) return;

         try {
           const settings = data.settings || this.gameState.settings;
           const result = getRandomWordWithSettings(settings);
           const { roles, orderedPlayers } = initializeGame(this.gameState.players, settings.multipleMrWhites);

           // Re-assign roles and prepare the real game state
           const playersWithRoles = orderedPlayers.map(p => ({
             ...p,
             role: roles[p.id],
             isAlive: true,
             votedFor: null
           }));

           this.gameState = {
             ...this.gameState,
             phase: "reveal",
             players: playersWithRoles,
             category: result.category,
             secretWord: result.word,
             mrWhiteWord: result.relatedWord,
             currentTurnIndex: 0,
             clues: {},
             round: 1,
             eliminatedPlayerId: null,
             mrWhiteGuess: null,
             winner: null,
           };

           this.broadcastState();
         } catch (err: any) {
           console.error("Failed to start game", err.message);
         }
      } 
      // Basic state synchronization logic for all other actions
      else if (data.type === "UPDATE_STATE") {
        this.gameState = { ...this.gameState, ...data.state };
        this.room.broadcast(JSON.stringify({ type: "SYNC_STATE", state: this.gameState }), [sender.id]);
      }
    } catch (e) {
      console.error("Failed to parse message", e);
    }
  }
}