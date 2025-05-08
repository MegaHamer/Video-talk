import { Inject, Injectable } from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import { MediasoupModule } from './mediasoup.module';
import { mediaCodecs } from './config/routerOptions';
import { MediasoupWorkerProvider } from './mediasoup-worker.provider';
import { ChatService } from 'src/chat/chat.service';

@Injectable()
export class MediasoupService {
  private routers = new Map<string, mediasoup.types.Router>();

  constructor(
    private MSWorkerProvider: MediasoupWorkerProvider,
    
  ) {}

  async createRouter() {
    const worker = this.MSWorkerProvider.getWoker();
    const router = await worker.createRouter({ mediaCodecs: mediaCodecs });

    const routerId = router.id;
    this.routers.set(routerId, router);

    return router;
  }

  async createWebRtcTransport(routerId: string) {
    const router = this.routers.get(routerId);
    if (!router) throw new Error('Router not found');

    const transport = await router.createWebRtcTransport({
      listenIps: [
        {
          ip: '127.0.0.1',
          // announcedIp: null
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    return {
      transport,
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    };
  }
}
