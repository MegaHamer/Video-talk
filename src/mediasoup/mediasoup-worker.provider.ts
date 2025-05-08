import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mediasoup from 'mediasoup';

export const mediasoupProviders = [
  {
    provide: 'MEDIASOUP_WORKER',
    useFactory: async () =>
      await mediasoup.createWorker({
        logLevel: 'warn',
        rtcMinPort: 40000,
        rtcMaxPort: 49999,
      }),
  },
];

@Injectable()
export class MediasoupWorkerProvider implements OnModuleInit {
  private worker: mediasoup.types.Worker;

  async onModuleInit() {
    this.worker = await mediasoup.createWorker({
      logLevel: 'warn',
      rtcMinPort: 10000,
      rtcMaxPort: 10020,
    });
    console.log(`Mediasoup worker created with pid ${this.worker.pid}`);
  }

  getWoker() {
    return this.worker;
  }
}
