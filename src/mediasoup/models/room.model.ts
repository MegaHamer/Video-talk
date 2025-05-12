import { types } from 'mediasoup';
import { mediaCodecs } from '../config/routerOptions';
import { Socket } from 'socket.io';

type ProducerInfo = {
  audio: types.Producer | null;
  video: types.Producer | null;
};

export class Room {
  private _roomId: string;
  private _mediasoupRouter: types.Router<types.AppData>;
  private _members: Map<
    string,
    {
      id: string;
      data: {
        transports: Map<string, types.Transport>;
        producers: { display: ProducerInfo; user: ProducerInfo };
        consumers: Map<string, types.Consumer>;
        rtpCapabilities;
        socket: Socket;
      };
    }
  >;
  static async create({
    mediasoupWorker,
    roomId,
  }: {
    mediasoupWorker: types.Worker;
    roomId: string;
  }) {
    console.log(`create room`, roomId);
    const mediasoupRouter = await mediasoupWorker.createRouter({
      mediaCodecs: mediaCodecs,
    });

    return new Room({ roomId, mediasoupRouter });
  }

  constructor({
    roomId,
    mediasoupRouter,
  }: {
    roomId: string;
    mediasoupRouter: types.Router;
  }) {
    this._roomId = roomId;
    this._mediasoupRouter = mediasoupRouter;
    this._members = new Map();
  }

  getRouterRtpCapabilities() {
    return this._mediasoupRouter.rtpCapabilities;
  }

  close() {
    this._mediasoupRouter.close();
  }

  async createMember(id: string, rtpCapabilities, socket) {
    const member = {
      id,
      data: {
        transports: new Map(),
        producers: {
          display: { audio: null, video: null },
          user: { audio: null, video: null },
        },
        consumers: new Map(),
        rtpCapabilities,
        socket,
      },
    };
    this._members.set(member.id, member);
    console.log(`64 create member ${member.id} in room ${this._roomId}`);
    return member;
  }
  deleteMember(memberId: string) {
    const member = this._members.get(memberId);
    if (!member) throw new Error(`member with id "${memberId}" does not exist`);
    for (const transport of member.data.transports.values()) {
      transport.close();
    }
    this._members.delete(memberId);
    console.log(`73 delete member ${member.id} from room ${this._roomId}`);
  }
  async createMemberTransport(memberId: string) {
    const member = this._members.get(memberId);
    // console.log([...this._members.values()])
    if (!member) throw new Error(`member with id "${memberId}" does not exist`);
    const webRtcTransportOptions: types.WebRtcTransportOptions = {
      listenInfos: [
        {
          protocol: 'udp',
          ip: '127.0.0.1',
        },
        {
          protocol: 'tcp',
          ip: '127.0.0.1',
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    };
    const transport = await this._mediasoupRouter.createWebRtcTransport(
      webRtcTransportOptions,
    );
    member.data.transports.set(transport.id, transport);
    console.log(`95 create transport ${transport.id} of user ${member.id}`);
    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters,
    };
  }
  async connectMemberTransport(
    memberId: string,
    transportId: string,
    dtlsParameters,
  ) {
    const member = this._members.get(memberId);
    if (!member) throw new Error(`member with id "${memberId}" does not exist`);

    const transport = member.data.transports.get(transportId);
    if (!transport)
      throw new Error(`transport with id "${transportId}" does not exist`);

    await transport.connect({ dtlsParameters });

    console.log(`118 connect transport ${transport.id} of user ${member.id}`);
  }

  async createMemberProducer(
    memberId,
    transportId,
    kind: types.MediaKind,
    rtpParameters,
    type: 'UserMedia' | 'DisplayMedia',
  ) {
    const member = this._members.get(memberId);
    if (!member) throw new Error(`member with id "${memberId}" does not exist`);

    const transport = member.data.transports.get(transportId);
    if (!transport)
      throw new Error(`transport with id "${transportId}" does not exist`);
    const producer = await transport.produce({ kind, rtpParameters });
    producer.on('transportclose', () => {
      console.log(`149 producer ${producer.id} closed by transportclose`);
      producer.close();
    });
    producer.on('@close', () => {
      console.log('156 producer closed');
    });

    const oldProducer = () => {
      if (type == 'UserMedia') {
        if (kind == 'audio') return member.data.producers.user.audio;
        if (kind == 'video') return member.data.producers.user.video;
      }
      if (type == 'DisplayMedia') {
        if (kind == 'audio') return member.data.producers.display.audio;
        if (kind == 'video') return member.data.producers.display.video;
      }
    };
    oldProducer()?.close();

    if (type == 'UserMedia') {
      if (kind == 'audio') member.data.producers.user.audio = producer;
      if (kind == 'video') member.data.producers.user.video = producer;
    }
    if (type == 'DisplayMedia') {
      if (kind == 'audio') member.data.producers.display.audio = producer;
      if (kind == 'video') member.data.producers.display.video = producer;
    }

    console.log(
      `132 create producer ${producer.id} of user ${member.id} of transport ${transport.id}`,
    );

    return producer;
  }

  async deleteMemberProducer(memberId: string, producerId: string) {
    const member = this._members.get(memberId);
    if (!member) throw new Error(`member with id "${memberId}" does not exist`);

    const oldProducer = () => {
      if (member.data.producers.user.audio?.id == producerId) {
        return member.data.producers.user.audio;
      }
      if (member.data.producers.user.video?.id == producerId) {
        return member.data.producers.user.video;
      }
      if (member.data.producers.display.audio?.id == producerId) {
        return member.data.producers.display.audio;
      }
      if (member.data.producers.display.video?.id == producerId) {
        return member.data.producers.display.video;
      }
    };
    oldProducer()?.close();
  }

  async createMemberConsumer(memberId, transportId, producerId) {
    const member = this._members.get(memberId);
    if (!member) throw new Error(`member with id "${memberId}" does not exist`);

    if (!member.data.rtpCapabilities)
      throw new Error('broadcaster does not have rtpCapabilities');

    const transport = member.data.transports.get(transportId);
    if (!transport)
      throw new Error(`transport with id "${transportId}" does not exist`);

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities: member.data.rtpCapabilities,
      paused: true,
    });

    member.data.consumers.set(consumer.id, consumer);

    consumer.on('transportclose', () => {
      // Remove from its map.
      member.data.socket.emit('consumer-close', { consumerId: consumer.id });
      consumer.close();
      member.data.consumers.delete(consumer.id);
    });

    consumer.on('producerclose', () => {
      // Remove from its map.
      console.log('213 producer od consumer closed', consumer.id);
      member.data.socket.emit('consumer-close', { consumerId: consumer.id });
      consumer.close();
      member.data.consumers.delete(consumer.id);
    });

    console.log(
      `170 create Consumer ${consumer.id} of user ${member.id} of transport ${transport.id}`,
    );
    0;
    const params = {
      id: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
    };

    return params;
  }

  async resumeMemberConsumer(memberId, consumerId) {
    const member = this._members.get(memberId);
    if (!member) throw new Error(`member with id "${memberId}" does not exist`);

    const consumer = member.data.consumers.get(consumerId);

    if (!consumer)
      throw new Error(`consumer with id "${consumerId}" does not exist`);

    console.log(`194 resume consumer ${consumer.id}`);
    await consumer.resume();
  }

  async getMembersInfo(forMemberId) {
    const forMember = this._members.get(forMemberId);
    if (!forMember)
      throw new Error(`member with id "${forMember}" does not exist`);

    const membersArray = [...this._members.values()];
    const filteredMembers = membersArray.filter(
      (member) => member.id != forMember.id,
    );

    const mappedMembers = filteredMembers.map((member) => {
      const producers = member.data.producers;
      return {
        id: member.id,
        producers: {
          display: {
            audio: producers.display.audio?.id,
            video: producers.display.video?.id,
          },
          user: {
            audio: producers.user.audio?.id,
            video: producers.user.video?.id,
          },
        },
      };
    });

    return mappedMembers;
  }

  async getInfo() {
    const out = [...this._members.values()].map((member) => ({
      memberId: member.id,
      consumers: [...member.data.consumers.values()],
    }));
    console.log(this._members.values());
    return {
      roomId: this._roomId,
      // members: [...this._members.values()],
      consumers: out,
    };
  }
}
