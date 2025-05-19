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
import { MediasoupService } from './mediasoup.service';
import { subscribe } from 'diagnostics_channel';
import { MediasoupWorkerProvider } from './mediasoup-worker.provider';

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

  constructor(
    private socketSessionMiddleware: SocketSessionMiddleware,
    private readonly chatService: ChatService,
    private readonly mediasoupService: MediasoupService,
    private MSWorkerProvider: MediasoupWorkerProvider,
  ) {}

  afterInit(server: Server) {
    server.use((client: any, next) => {
      this.socketSessionMiddleware.use(client, next);
    });
  }

  async handleConnection(client: Socket & { request: { session?: any } }) {
    try {
      //проверка сессии
      if (!client.request.session?.userId) {
        throw new Error('Unauthorized');
      }
      if (!this.MSWorkerProvider.isReady) {
        console.log('не готово');
        client.disconnect(true);
        return;
      }
      const userId = client.request.session.userId;
      client.data.userId = userId;
      //проверка существования чата
      const { chat: chatId } = client.handshake.auth;
      if (!chatId) throw new Error('Chat is required');
      const chat = await this.chatService.fetchChat(Number(chatId));
      if (!chat) throw new Error('Chat not found');

      //отключаем остальные устройства из с однаковым id
      this.server.in(`user ${userId}`).disconnectSockets(true);
      client.join(`user ${userId}`);
      //подключаем к чату
      client.data.chatId = String(chatId);
      client.join(`chat ${chat.id}`);

      //создаем/получаем роутер
      // const router = this.mediasoupService.getOrCreateRouter(chatId)

      const room = await this.mediasoupService.getOrCreateRoom(`${chat.id}`);
      //отправляем router.rtpCapabilities
      client.emit(
        'rtpCapabilities',
        { rtp: room.getRouterRtpCapabilities() },
        async ({ rtpCapabilities }) => {
          // console.log('вернулось', rtpCapabilities);
          const member = await room.createMember(
            `${userId}`,
            rtpCapabilities,
            client,
          );
          
          client.emit('member-created');
          client.broadcast
            .to(`chat ${chat.id}`)
            .emit('new-member', { memberId: member.id });
        },
      );

      console.log(`soup User ${client.data.userId} connected ${client.id}`);
    } catch (error) {
      console.error('Connection error:', error.message);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    // if (this.server.sockets.adapter.rooms[`chat ${chatId}`])
    // this.mediasoupService.
    try {
      const chatId = String(client.data.chatId);
      const userId = String(client.data.userId);

      const room = await this.mediasoupService.getOrCreateRoom(String(chatId));
      client.broadcast
        .to(`chat ${chatId}`)
        .emit('member-disconnect', { memberId: userId });
      room.deleteMember(userId);

      console.log('soup user dissconnect', client.id);
    } catch (error) {
      console.error('Disconnection error:', error.message);
    }
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any): string {
    console.log(client.data);
    return 'Hello world!';
  }

  @SubscribeMessage('create-transport')
  async handleCreateTransport(client: Socket, payload: any) {
    const chatId = String(client.data.chatId);
    const userId = String(client.data.userId);

    const room = await this.mediasoupService.getOrCreateRoom(String(chatId));

    const transport = await room.createMemberTransport(String(userId));
    return transport;
  }

  @SubscribeMessage('transport-connect')
  async handleTransportConnect(
    client: Socket,
    { transportId, dtlsParameters }: any,
  ) {
    const chatId: string = String(client.data.chatId);
    const userId: string = String(client.data.userId);

    const room = await this.mediasoupService.getOrCreateRoom(String(chatId));

    room.connectMemberTransport(userId, transportId, dtlsParameters);
  }

  @SubscribeMessage('transport-produce')
  async handleTransportProduce(
    client: Socket,
    { transportId, kind, rtpParameters, type }: any,
  ) {
    const chatId: string = String(client.data.chatId);
    const userId: string = String(client.data.userId);
    const room = await this.mediasoupService.getOrCreateRoom(String(chatId));
    const producer = await room.createMemberProducer(
      userId,
      transportId,
      kind,
      rtpParameters,
      type,
    );
    console.log("transport-produce",chatId)
    client.broadcast.to(`chat ${chatId}`).emit('new-producer', {
      id: userId,
      producer: {
        id: producer.id,
        // kind: producer.kind,
        type: type,
        kind: producer.kind,
      },
    });

    return { id: producer.id };
  }

  @SubscribeMessage('transport-consume')
  async handleTransportConsume(
    client: Socket,
    { transportId, producerId }: any,
  ) {
    const chatId: string = String(client.data.chatId);
    const userId: string = String(client.data.userId);
    const room = await this.mediasoupService.getOrCreateRoom(String(chatId));

    const consumerParams = await room.createMemberConsumer(
      userId,
      transportId,
      producerId,
    );

    return { consumerParams };
  }
  @SubscribeMessage('consumer-resume')
  async handleConsumerResume(client: Socket, { consumerId }: any) {
    const chatId: string = String(client.data.chatId);
    const userId: string = String(client.data.userId);
    const room = await this.mediasoupService.getOrCreateRoom(String(chatId));

    await room.resumeMemberConsumer(userId, consumerId);
  }
  // @SubscribeMessage("close-producer")
  // async handleCloseProducer(client: Socket, { producerId }: any) {
  //   const chatId: string = String(client.data.chatId);
  //   const userId: string = String(client.data.userId);
  //   const room = await this.mediasoupService.getOrCreateRoom(String(chatId));

  //   await room.resumeMemberConsumer(userId, consumerId);
  // }

  @SubscribeMessage('members-info')
  async handleMembersInfo(client: Socket, payload: any) {
    const chatId: string = String(client.data.chatId);
    const userId: string = String(client.data.userId);
    const room = await this.mediasoupService.getOrCreateRoom(String(chatId));
    const membersInfo = await room.getMembersInfo(userId);
    return { membersInfo };
  }

  @SubscribeMessage('check')
  async handleCheck(client: Socket, payload: any) {
    const chatId: string = String(client.data.chatId);
    const userId: string = String(client.data.userId);
    const room = await this.mediasoupService.getOrCreateRoom(String(chatId));
    return room.getInfo();
  }
  @SubscribeMessage('producer_closed')
  async handleProducerClosed(client: Socket, { producerId }: any) {
    const chatId: string = String(client.data.chatId);
    const userId: string = String(client.data.userId);
    const room = await this.mediasoupService.getOrCreateRoom(String(chatId));
    room.deleteMemberProducer(userId, String(producerId));

    // return room.getInfo();
  }
  @SubscribeMessage('user_muted')
  async handleUserMuted(client: Socket, { producerId }: any) {
    const chatId: string = String(client.data.chatId);
    const userId: string = String(client.data.userId);
    client.broadcast.to(`chat ${chatId}`).emit('user-muted', {
      id: userId,
    });
  }
  @SubscribeMessage('user_unmuted')
  async handleUserUnmuted(client: Socket, { producerId }: any) {
    const chatId: string = String(client.data.chatId);
    const userId: string = String(client.data.userId);
    client.broadcast.to(`chat ${chatId}`).emit('user-unmuted', {
      id: userId,
    });
  }
}
