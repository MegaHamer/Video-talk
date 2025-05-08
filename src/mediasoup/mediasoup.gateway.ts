import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketSessionMiddleware } from 'src/chat/middleware/socket.middleware';
import * as mediasoup from 'mediasoup';
import { OnModuleInit } from '@nestjs/common';
import { ChatService } from 'src/chat/chat.service';

@WebSocketGateway(4002, {
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket'],
  namespace: '/media',
})
export class MediasoupGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  // private worker: mediasoup.types.Worker;

  constructor(
    private socketSessionMiddleware: SocketSessionMiddleware,
    private readonly chatService: ChatService,
  ) {}

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

      const { chat:chatId } = client.handshake.auth;
      if (!chatId) throw new Error('Chat is required');
      const chat = await this.chatService.fetchChat(Number(chatId))
      if (!chat) throw new Error('Chat not found');

      this.server.in(userId).disconnectSockets(true);
      client.join(userId);

      console.log(`soup User ${client.data.userId} connected ${client.id}`);
    } catch (error) {
      console.error('Connection error:', error.message);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    console.log('soup user dissconnect ' + client.id);
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any): string {
    console.log(client.rooms);
    return 'Hello world!';
  }
}
