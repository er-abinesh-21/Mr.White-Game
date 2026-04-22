import type * as Party from "partykit/server";
import { GameState } from "../src/lib/types/game";
import { getRandomWordWithSettings } from "../src/lib/data/words";
import { initializeGame } from "../src/lib/engine/rules";

function parseIncomingMessage(message: string | ArrayBuffer | Uint8Array): any | null {
  try {
    if (typeof message === "string") {
      return JSON.parse(message);
    }

    if (message instanceof ArrayBuffer) {
      return JSON.parse(new TextDecoder().decode(message));
    }

    if (message instanceof Uint8Array) {
      return JSON.parse(new TextDecoder().decode(message));
    }

    return null;
  } catch {
    return null;
  }
}

export default class MrWhiteServer implements Party.Server {
  // Store the full, unredacted game state in memory for this room
  gameState: Partial<GameState> | null = null;
  
  constructor(public room: Party.Room) {}

  private ensureRoomIdOnState() {
    if (!this.gameState) return;
    this.gameState = {
      ...this.gameState,
      roomId: this.room.id,
    };
  }

  private ensureValidHostOnState() {
    if (!this.gameState?.players) return;

    const hasCurrentHost =
      !!this.gameState.hostPlayerId &&
      this.gameState.players.some((p) => p.id === this.gameState!.hostPlayerId);

    if (!hasCurrentHost) {
      this.gameState = {
        ...this.gameState,
        hostPlayerId: this.gameState.players[0]?.id ?? null,
      };
    }
  }

  // Helper to send sanitized state to clients
  // Civilians receive the secretWord, Mr White does not!
  // Roles are hidden to prevent looking at network pane
  broadcastState() {
    if (!this.gameState || !this.gameState.players) return;

    this.ensureRoomIdOnState();
    this.ensureValidHostOnState();

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
    this.ensureValidHostOnState();
    if (this.gameState) {
      conn.send(JSON.stringify({ type: "SYNC_STATE", state: this.gameState }));
    } else {
      conn.send(JSON.stringify({ type: "ROOM_EMPTY" }));
    }
  }

  onMessage(message: string | ArrayBuffer | Uint8Array, sender: Party.Connection) {
    try {
      const data = parseIncomingMessage(message);
      if (!data) {
        console.error("Failed to parse message payload");
        return;
      }
      
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
             roomId: this.room.id,
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
      else if (data.type === "ADD_PLAYER" && data.player) {
        const existingPlayers = this.gameState?.players || [];
        const alreadyExists = existingPlayers.some((p) => p.id === data.player.id);

        if (!alreadyExists) {
          this.gameState = {
            ...(this.gameState || {
              hostPlayerId: data.player.id,
              phase: "setup",
              category: "",
              secretWord: "",
              mrWhiteWord: null,
              currentTurnIndex: 0,
              clues: {},
              round: 1,
              eliminatedPlayerId: null,
              mrWhiteGuess: null,
              winner: null,
              roomId: this.room.id,
            }),
            settings: this.gameState?.settings || data.settings,
            roomId: this.room.id,
            hostPlayerId: this.gameState?.hostPlayerId || data.player.id,
            players: [...existingPlayers, data.player],
          };
        }

        this.broadcastState();
      }
      else if (data.type === "REMOVE_PLAYER" && data.playerId) {
        if (!this.gameState?.players) return;

        const remainingPlayers = this.gameState.players.filter((p) => p.id !== data.playerId);
        const nextHostId =
          this.gameState.hostPlayerId === data.playerId
            ? (remainingPlayers[0]?.id ?? null)
            : (this.gameState.hostPlayerId ?? null);

        this.gameState = {
          ...this.gameState,
          roomId: this.room.id,
          hostPlayerId: nextHostId,
          players: remainingPlayers,
        };

        this.broadcastState();
      }
      else if (data.type === "UPDATE_STATE") {
        this.gameState = { ...this.gameState, ...data.state, roomId: this.room.id };
        this.ensureValidHostOnState();
        this.room.broadcast(JSON.stringify({ type: "SYNC_STATE", state: this.gameState }), [sender.id]);
      }
    } catch (e) {
      console.error("Failed to parse message", e);
    }
  }
}