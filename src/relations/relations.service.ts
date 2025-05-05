import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UsersService } from 'src/users/users.service';
import { $Enums, Prisma, User } from 'prisma/src/generated/prisma/client';
import { UsernameDto } from './dto/username.dto';

@Injectable()
export class RelationsService {
  constructor(
    private userService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  async createRelationByUsername(senderId: number, receiverUsername: string) {
    //check receiver is has
    const receiver = await this.userService.findByUsername(receiverUsername);
    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    return await this.createRelationById(senderId, receiver.id);
  }

  async createRelationById(senderId, receiverId) {
    if (senderId == receiverId) {
      throw new BadRequestException(
        "You can't send a relationship request to yourself",
      );
    }
    const existingRelation = await this.prisma.relationship.findFirst({
      where: {
        OR: [
          {
            requesterId: senderId,
            recipientId: receiverId,
          },
          {
            requesterId: receiverId,
            recipientId: senderId,
          },
        ],
      },
    });
    if (!existingRelation) {
      await this.prisma.relationship.create({
        data: {
          type: 'REQUEST',
          requesterId: senderId,
          recipientId: receiverId,
        },
      });
      return '';
    }
    if (existingRelation.type == 'FRIEND') {
      throw new BadRequestException('You are already friends');
    }
    if (existingRelation.type == 'BLOCK') {
      if (existingRelation.requesterId == senderId) {
        await this.prisma.relationship.update({
          where: { id: existingRelation.id },
          data: {
            type: 'REQUEST',
          },
        });
        return '';
      }
      throw new ForbiddenException('It is impossible to send a request');
    }
    if (existingRelation.type == 'REQUEST') {
      if (existingRelation.recipientId == senderId) {
        await this.prisma.relationship.update({
          where: { id: existingRelation.id },
          data: {
            type: 'FRIEND',
          },
        });
      }
      return '';
    }
    return '';
  }

  async changeRelation(
    senderId: number,
    receiverId: number,
    type: 'block' | 'send/accept' = 'send/accept',
  ) {
    await this.userService.findById(receiverId);

    if (type == 'send/accept') {
      return await this.createRelationById(senderId, receiverId);
    }
    if (type == 'block') {
      await this.prisma.relationship.upsert({
        where: {
          requesterId_recipientId: {
            recipientId: receiverId,
            requesterId: senderId,
          },
        },
        create: {
          type: 'BLOCK',
          recipientId: receiverId,
          requesterId: senderId,
        },
        update: { type: 'BLOCK' },
      });
      return '';
    }
    return '';
  }

  async getRelationships(userId: number, type: $Enums.RelationType) {
    const relations = await this.prisma.relationship.findMany({
      where: {
        OR: [{ recipientId: userId }, { requesterId: userId }],
        type,
      },
      select: {
        createdAt: true,
        recipient: {
          select: { id: true, status: true, username: true, avatar_url: true },
        },
        requester: {
          select: { id: true, status: true, username: true, avatar_url: true },
        },
      },
    });

    return relations.map((relation) => {
      const otherUser =
        relation.recipient.id === userId
          ? relation.requester
          : relation.recipient;

      return {
        ...otherUser,
        role: relation.requester.id === userId ? 'requester' : 'recipient',
      };
    });
  }

  async getBlocked(userId) {
    const relations = await this.getRelationships(userId, 'BLOCK');
    return relations;
  }
  async getFriends(userId) {
    const relations = await this.getRelationships(userId, 'FRIEND');
    return relations.map((relation) => {
      const { role, ...props } = relation;
      return props;
    });
  }
  async getRequests(userId) {
    const relations = await this.getRelationships(userId, 'REQUEST');
    return relations;
  }

  async deleteRelation(senderId, receiverId) {
    await this.userService.findById(receiverId);

    const relation = await this.prisma.relationship.findFirst({
      where: {
        OR: [
          {
            requesterId: senderId,
            recipientId: receiverId,
          },
          {
            requesterId: receiverId,
            recipientId: senderId,
          },
        ],
      },
    });

    if (!relation) return '';

    if (relation.type == 'BLOCK' && relation.requesterId != senderId) {
      return '';
    }

    await this.prisma.relationship.delete({
      where: { id: relation.id },
    });

    return '';
  }
}

/*
  async listOfFriends(user: User) {
    const requests = await this.prisma.relationship.findMany({
      where: {
        AND: [
          { OR: [{ recipientId: user.id }, { requesterId: user.id }] },
          { status: 'ACCEPTED' },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            status: true,
          },
        },
        recipient: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map((relationship) => {
      const otherUser =
        relationship.recipientId === user.id
          ? relationship.requester
          : relationship.recipient;

      return {
        ...otherUser,
        relationshipId: relationship.id,
        role: relationship.requesterId === user.id ? 'requester' : 'recipient',
      };
    });
  }

  async listOfRequests(user: User) {
    const requests = await this.prisma.relationship.findMany({
      where: {
        AND: [
          { OR: [{ recipientId: user.id }, { requesterId: user.id }] },
          { status: 'PENDING' },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            status: true,
          },
        },
        recipient: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map((relationship) => {
      const otherUser =
        relationship.recipientId === user.id
          ? relationship.requester
          : relationship.recipient;

      return {
        ...otherUser,
        relationshipId: relationship.id,
        role: relationship.requesterId === user.id ? 'requester' : 'recipient',
      };
    });
  }

  async acceptRequest(user: User, requestToAcceptDto: FriendRequestDto) {
    const request = await this.prisma.relationship.findFirst({
      where: {
        id: requestToAcceptDto.requestId,
      },
    });
    if (!request) {
      throw new NotFoundException('relationship request not found');
    }
    if (request.recipientId !== user.id) {
      throw new ForbiddenException(
        'The user is not the recipient of the request',
      );
    }

    if (request.status === 'ACCEPTED') {
      throw new ConflictException(
        'The relationship request has already been accepted',
      );
    }

    const result = await this.prisma.relationship.update({
      where: {
        id: request.id,
      },
      data: {
        status: 'ACCEPTED',
      },
    });

    return result;
  }

  async denyRequest(user: User, requestToDenyDto: FriendRequestDto) {
    const requestToDeny = await this.prisma.relationship.findFirst({
      where: {
        id: requestToDenyDto.requestId,
      },
    });
    if (!requestToDeny) {
      throw new NotFoundException('relationship request not found');
    }
    if (requestToDeny.requesterId == user.id) {
      await this.prisma.relationship.delete({
        where: {
          id: requestToDenyDto.requestId,
        },
      });
      return;
    }

    if (requestToDeny.status === 'REJECTED') {
      throw new ConflictException(
        'The relationship request has already been rejected',
      );
    }

    const result = await this.prisma.relationship.update({
      where: {
        id: requestToDeny.id,
      },
      data: {
        status: 'REJECTED',
      },
    });

    return result;
  }
}
*/
