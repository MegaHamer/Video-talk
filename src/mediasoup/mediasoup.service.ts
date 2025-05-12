import { Inject, Injectable } from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import { MediasoupModule } from './mediasoup.module';
import { mediaCodecs } from './config/routerOptions';
import { MediasoupWorkerProvider } from './mediasoup-worker.provider';
import { ChatService } from 'src/chat/chat.service';
import { Room } from './models/room.model';

@Injectable()
export class MediasoupService {
  private rooms: Map<string, Room> = new Map();

  constructor(private MSWorkerProvider: MediasoupWorkerProvider) {}

 

  async getOrCreateRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      return room;
    }
    const worker = this.MSWorkerProvider.getWoker();
    const newRoom = await Room.create({ roomId, mediasoupWorker: worker });
    this.rooms.set(roomId, newRoom);
    return newRoom;
  }

}
