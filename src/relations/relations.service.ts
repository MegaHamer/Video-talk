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

  // async createRelationByUsername(senderId: number, receiverUsername: string) {
  //   //check receiver is has
  //   const receiver = await this.userService.findByUsername(receiverUsername);
  //   if (!receiver) {
  //     throw new NotFoundException('User not found');
  //   }

  //   return await this.createRelationById(senderId, receiver.id);
  // }

  // async createRelationById(senderId, receiverId) {
  //   if (senderId == receiverId) {
  //     throw new BadRequestException(
  //       "You can't send a relationship request to yourself",
  //     );
  //   }
  //   const existingRelation = await this.prisma.relationship.findFirst({
  //     where: {
  //       OR: [
  //         {
  //           requesterId: senderId,
  //           recipientId: receiverId,
  //         },
  //         {
  //           requesterId: receiverId,
  //           recipientId: senderId,
  //         },
  //       ],
  //     },
  //   });
  //   if (!existingRelation) {
  //     await this.prisma.relationship.create({
  //       data: {
  //         type: 'REQUEST',
  //         requesterId: senderId,
  //         recipientId: receiverId,
  //       },
  //     });
  //     return '';
  //   }
  //   if (existingRelation.type == 'FRIEND') {
  //     throw new BadRequestException('You are already friends');
  //   }
  //   if (existingRelation.type == 'BLOCK') {
  //     if (existingRelation.requesterId == senderId) {
  //       await this.prisma.relationship.update({
  //         where: { id: existingRelation.id },
  //         data: {
  //           type: 'REQUEST',
  //         },
  //       });
  //       return '';
  //     }
  //     throw new ForbiddenException('It is impossible to send a request');
  //   }
  //   if (existingRelation.type == 'REQUEST') {
  //     if (existingRelation.recipientId == senderId) {
  //       await this.prisma.relationship.update({
  //         where: { id: existingRelation.id },
  //         data: {
  //           type: 'FRIEND',
  //         },
  //       });
  //     }
  //     return '';
  //   }
  //   return '';
  // }

  // async changeRelation(
  //   senderId: number,
  //   receiverId: number,
  //   type: 'block' | 'send/accept' = 'send/accept',
  // ) {
  //   await this.userService.findById(receiverId);

  //   if (type == 'send/accept') {
  //     return await this.createRelationById(senderId, receiverId);
  //   }
  //   if (type == 'block') {
  //     await this.prisma.relationship.upsert({
  //       where: {
  //         requesterId_recipientId: {
  //           recipientId: receiverId,
  //           requesterId: senderId,
  //         },
  //       },
  //       create: {
  //         type: 'BLOCK',
  //         recipientId: receiverId,
  //         requesterId: senderId,
  //       },
  //       update: { type: 'BLOCK' },
  //     });
  //     return '';
  //   }
  //   return '';
  // }

  // async getRelationships(userId: number, type: $Enums.RelationType) {
  //   const relations = await this.prisma.relationship.findMany({
  //     where: {
  //       OR: [{ recipientId: userId }, { requesterId: userId }],
  //       type,
  //     },
  //     select: {
  //       createdAt: true,
  //       recipient: {
  //         select: { id: true, status: true, username: true, avatar_url: true },
  //       },
  //       requester: {
  //         select: { id: true, status: true, username: true, avatar_url: true },
  //       },
  //     },
  //   });

  //   return relations.map((relation) => {
  //     const otherUser =
  //       relation.recipient.id === userId
  //         ? relation.requester
  //         : relation.recipient;

  //     return {
  //       ...otherUser,
  //       role: relation.requester.id === userId ? 'requester' : 'recipient',
  //     };
  //   });
  // }

  // async getBlocked(userId) {
  //   const relations = await this.getRelationships(userId, 'BLOCK');
  //   return relations;
  // }
  // async getFriends(userId) {
  //   const relations = await this.getRelationships(userId, 'FRIEND');
  //   return relations.map((relation) => {
  //     const { role, ...props } = relation;
  //     return props;
  //   });
  // }
  // async getRequests(userId) {
  //   const relations = await this.getRelationships(userId, 'REQUEST');
  //   return relations;
  // }

  // async deleteRelation(senderId, receiverId) {
  //   await this.userService.findById(receiverId);

  //   const relation = await this.prisma.relationship.findFirst({
  //     where: {
  //       OR: [
  //         {
  //           requesterId: senderId,
  //           recipientId: receiverId,
  //         },
  //         {
  //           requesterId: receiverId,
  //           recipientId: senderId,
  //         },
  //       ],
  //     },
  //   });

  //   if (!relation) return '';

  //   if (relation.type == 'BLOCK' && relation.requesterId != senderId) {
  //     return '';
  //   }

  //   await this.prisma.relationship.delete({
  //     where: { id: relation.id },
  //   });

  //   return '';
  // }
}