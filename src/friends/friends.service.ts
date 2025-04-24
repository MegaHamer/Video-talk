import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { FriendRequestDto, UserFriendDto } from './friends.dto';
import { UsersService } from 'src/users/users.service';
import { Prisma, User } from 'prisma/src/generated/prisma/client';

@Injectable()
export class FriendsService {
    constructor(
        private userService: UsersService,
        private readonly prisma: PrismaService,
    ) { }

    async sendRequest(sender: User, ToUserDto: UserFriendDto) {
        //check receiver is has
        const receiver = await this.prisma.user.findFirst({
            where: {
                id: ToUserDto.userId
            }
        }
        )
        if (!receiver) {
            throw new NotFoundException("User not found")
        }
        //check is self request
        if (sender.id == receiver.id) {
            throw new BadRequestException("You can't send a friendship request to yourself");
        }
        //check request is already sent
        const existingRequest = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    {
                        requesterId: sender.id,
                        recipientId: receiver.id,
                    },
                    {
                        requesterId: receiver.id,
                        recipientId: sender.id,
                    },

                ]
            }
        })
        if (!existingRequest) {
            //create friendship
            await this.prisma.friendship.create({
                data: {
                    status: 'PENDING',
                    requesterId: sender.id,
                    recipientId: receiver.id
                }
            })
            //send an event to the socket about receiving a friendship request
            return { success: "The friendship request has been sent." }
        }
        if (existingRequest.requesterId == sender.id) {
            //current user is sender
            throw new ConflictException('The request has already been sent');
        } else {
            //current user already has request 
            await this.prisma.friendship.update({
                where: {
                    id: existingRequest.id
                },
                data: {
                    status: 'ACCEPTED'
                }
            })
            //send an event to the socket about receiving a friendship request
            return { success: "The friendship request has been accepted" }
        }

    }

    async listOfFriends(user: User) {
        const requests = await this.prisma.friendship.findMany({
            where: {
                OR: [
                    { recipientId: user.id },
                    { requesterId: user.id }
                ]
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true,
                    }
                },
                recipient: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true,
                    }
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return requests.map(friendship => {
            const otherUser = friendship.recipientId === user.id
                ? friendship.requester
                : friendship.recipient

            return {
                id: friendship.id,
                status: friendship.status,
                createAt: friendship.createdAt,
                user: otherUser,
                role: friendship.requesterId === user.id ? 'requester' : 'recipient',
            }
        })
    }

    async acceptRequest(user: User, requestToAcceptDto: FriendRequestDto) {

        const request = await this.prisma.friendship.findFirst({
            where: {
                id: requestToAcceptDto.requestId,
            }
        })
        if (!request) {
            throw new NotFoundException("Friendship request not found")
        }
        if (request.recipientId !== user.id) { throw new ForbiddenException("The user is not the recipient of the request") }

        if (request.status === 'ACCEPTED') {
            throw new ConflictException('The friendship request has already been accepted');
        }

        const result = await this.prisma.friendship.update({
            where: {
                id: request.id
            },
            data: {
                status: 'ACCEPTED'
            }
        })

        return result
    }

    async denyRequest(user: User, requestToDenyDto: FriendRequestDto) {
        const requestToDeny = await this.prisma.friendship.findFirst({
            where: {
                id: requestToDenyDto.requestId,
            }
        })
        if (!requestToDeny) { throw new NotFoundException("Friendship request not found") }
        if (requestToDeny.requesterId == user.id) {
            await this.prisma.friendship.delete({
                where: {
                    id: requestToDenyDto.requestId
                }
            })
            return;
        }

        if (requestToDeny.status === 'REJECTED') { throw new ConflictException('The friendship request has already been rejected'); }

        const result = await this.prisma.friendship.update({
            where: {
                id: requestToDeny.id
            },
            data: {
                status: 'REJECTED'
            }
        })

        return result
    }
}
