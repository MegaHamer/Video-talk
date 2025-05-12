import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mediasoup from 'mediasoup';

@Injectable()
export class MediasoupWorkerProvider implements OnModuleInit {
  private worker: mediasoup.types.Worker;
  public isReady = false;

  async onModuleInit() {
    this.worker = await mediasoup.createWorker({
      logLevel: 'warn',
      rtcMinPort: 10000,
      rtcMaxPort: 10020,
    });
    console.log(`Mediasoup worker created with pid ${this.worker.pid}`);
    this.isReady = true;
  }

  getWoker() {
    return this.worker;
  }
}
