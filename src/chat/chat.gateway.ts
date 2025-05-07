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
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private users: Map<string, string> = new Map();

  constructor(private configService: ConfigService,private socketSessionMiddleware: SocketSessionMiddleware) {
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
      
      client.data.userId = client.request.session.userId;
      console.log(`User ${client.data.userId} connected`);
    } catch (error) {
      console.error('Connection error:', error.message);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    if (this.users.has(client.id)) {
      const username = this.users.get(client.id);
      this.users.delete(client.id);
      this.server.emit('userLeft', username);
    }
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }
}
