import { emitEvent, onEvent, Room } from '@bandeirantes/events';
import type { Namespace, Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { GameTable } from './gameTable';
import { Player } from './player';

interface RoomSocketConstructor extends Omit<Room, 'gameId' | 'hasPassword'> {
  password: string | null;
  size: number;
}

export class RoomSocket extends Room {
  private socketRoom: Namespace;
  readonly size: number;
  game: GameTable;
  password: string | null;
  availableColors: Array<string>

  constructor(data: RoomSocketConstructor, io: Server) {
    super();

    this.id = data.id;
    this.name = data.name;
    this.password = data.password;
    this.maxPlayers = data.maxPlayers;
    this.playerCount = 0;
    this.size = data.size;
    this.socketRoom = io.of(`/room/${this.id}`);
    this.availableColors = [
      "green",
      "yellow",
      "red",
      "purple",
      "blue",
      "orange",
      "cyan"
    ]

    const game = new GameTable({
      id: '0',
      size: this.size,
      gameOverTime: new Date(Date.now() + 1000 * 60 * 3),
      socketRoom: this.socketRoom,
    });

    this.game = game;

    this.listenEvents();
  }

  private onPlayerLeave(socket: Socket){
    socket._cleanup();
    if(!socket.disconnected){
      socket.disconnect(true)
    }

    const playerIndex = this.game.players.findIndex(
      (p) => p.id === socket.id
    );

    this.availableColors.unshift(this.game.players[playerIndex].color)
    this.game.players.splice(playerIndex, 1);
  }

  private getRandomColor(){
    const colorIndex = Math.trunc(Math.random() * this.availableColors.length)
    const color = this.availableColors[colorIndex]
    this.availableColors.splice(colorIndex)

    return color
  }

  listenEvents() {
    this.socketRoom.on('connection', (socket) => {
      const { password, name } = socket.handshake.auth;

      if (this.game.players.length >= this.maxPlayers) {
        emitEvent('join_room_response', socket, {
          message: 'Room have reached the maximum amount of players',
          succeeded: false,
        });

        return socket.disconnect(true);
      }

      if (this.password && this.password !== password) {
        emitEvent('join_room_response', socket, {
          message: 'Invalid password',
          succeeded: false,
        });

        return socket.disconnect(true);
      }

      if (!name || name.length < 1) {
        emitEvent('join_room_response', socket, {
          message: 'Name must have at least one character',
          succeeded: false,
        });

        return socket.disconnect(true);
      } else {
        emitEvent('join_room_response', socket, {
          message: `You entered room:"${this.name}"`,
          succeeded: true,
        });
      }


      socket.on('disconnect', () => this.onPlayerLeave(socket));

      onEvent('player_movement', socket, (playerMovement) =>
        this.game.onPlayerMovement(socket, playerMovement)
      );

      const newPlayer = new Player({
        id: socket.id,
        name,
        color: this.getRandomColor(),
        direction: 'south',
        conqueredPercentage: 0,
        position: {
          x: Math.trunc(Math.random() * (this.size - 1)),
          y: Math.trunc(Math.random() * (this.size - 1)),
        },
      });

      this.game.players.push(newPlayer);

      this.game.changeGameStatus('running');

      emitEvent('update_game', this.socketRoom as any, {
        gameOverTime: this.game.gameOverTime,
        id: this.game.id,
        lands: this.game.lands,
        players: this.game.players.map(({ isMoving: _, ...rest }) => rest),
        status: this.game.status,
      });

      logger.info(`Room ${this.name}: User ${socket.id} entered into room.`);
    });
  }
}
