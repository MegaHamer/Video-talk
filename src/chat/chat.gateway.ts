import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketSessionMiddleware } from './middleware/socket.middleware';

@WebSocketGateway(4002, {
  cors: {
    origin: true,
    credentials: true,
  },
  namespace:"/chat",
  transports:["websocket"]
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private userConnections: Map<string, Set<string>> = new Map();
  private socketToUserMap: Map<string, string> = new Map();

  constructor(
    private configService: ConfigService,
    private socketSessionMiddleware: SocketSessionMiddleware,
  ) {
    // Получаем порт из .env или используем по умолчанию
    const port = this.configService.get<number>('SOCKET_PORT') || 4002;
  }
  afterInit(server: Server) {
    server.use((client: any, next) => {
      this.socketSessionMiddleware.use(client, next);
    });
  }

  async handleConnection(client: Socket & { request: { session?: any } }) {
    try {
      if (!client.request.session?.userId) {
        throw new Error('Unauthorized');
      }

      const userId = client.request.session.userId;
      client.data.userId = userId;

      this.addUserConnection(userId, client.id);

      console.log(`User ${client.data.userId} connected`);
    } catch (error) {
      console.error('Connection error:', error.message);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketToUserMap.get(client.id);
    if (userId) {
      this.removeUserConnection(userId, client.id);
      console.log(`User ${userId} disconnected from socket ${client.id}`);
      console.log(
        `Remaining connections for user ${userId}: ${this.getUserConnectionsCount(userId)}`,
      );

      // Если это было последнее соединение пользователя
      if (this.getUserConnectionsCount(userId) === 0) {
        this.server.emit('userOffline', userId);
      }
    }
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, data: string) {
    console.log('Received:', data); 
    this.server.emit('message', data); 
  }

  @SubscribeMessage('start_call')
  handleStartCall(client: any, payload: any): string {
    return 'start_call!';
  }

  /**
   * Добавляем соединение пользователя
   */
  private addUserConnection(userId: string, socketId: string) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(socketId);
    this.socketToUserMap.set(socketId, userId);
  }
  /**
   Удаляем соединение пользователя
  */
  private removeUserConnection(userId: string, socketId: string) {
    if (this.userConnections.has(userId)) {
      this.userConnections.get(userId)!.delete(socketId);
      if (this.userConnections.get(userId)!.size === 0) {
        this.userConnections.delete(userId);
      }
    }
    this.socketToUserMap.delete(socketId);
  }
  /**
   * Получаем количество соединений пользователя
   */
  private getUserConnectionsCount(userId: string): number {
    return this.userConnections.get(userId)?.size || 0;
  }
  /**
   * Отправляем сообщение всем соединениям пользователя
   */
  private sendToUser(userId: string, event: string, payload: any) {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.forEach((socketId) => {
        this.server.to(socketId).emit(event, payload);
      });
    }
  }
  /**
   * Отправляем сообщение всем соединениям пользователя кроме выбранных
   */
  private sendToSockets(
    userId: string,
    exceptedSockets: string[],
    event: string,
    payload: any,
  ) {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.forEach((socketId) => {
        if (!exceptedSockets.includes(socketId))
          this.server.to(socketId).emit(event, payload);
      });
    }
  }
}
