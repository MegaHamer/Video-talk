import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { $Enums, Chat, User } from 'prisma/src/generated/prisma/client';
import { ChangeChatDTO, CreateGroupChatDto, CreatePrivateChatDto, ParamsChatDTO, ParamsDTO } from './chat.dto';
import { PrismaService } from 'src/prisma.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ChatService {
    constructor(
        private userService: UsersService,
        private readonly prisma: PrismaService
    ) { }

    async getAllChats(user: User) {
        const chats = await this.prisma.chat.findMany({
            where: {
                members: {
                    some: {
                        userId: user.id
                    }
                },
                type: {
                    not: 'SERVER'
                }
            },
            select: {
                id: true,
                name: true,
                type: true,
                members: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                avatar_url: true,
                                status: true,
                                username: true
                            }
                        },
                        role: true
                    }
                }
            }
        })
        const formattedChats = chats.map(chat => {
            let displayName = chat.name;

            if (chat.type === 'PRIVATE') {
                // Находим участника, который не является текущим пользователем
                const otherMember = chat.members.find(m => m.user.id !== user.id);
                displayName = otherMember?.user.username || 'Deleted User';
            }

            return {
                id: chat.id,
                type: chat.type,
                name: displayName,
                members: chat.members.map(m => ({
                    id: m.user.id,
                    avatar_url: m.user.avatar_url,
                    status: m.user.status,
                    username: m.user.username,
                    role: m.role
                }))
            };
        });
        return formattedChats
    }

    async getVisibleChats(user: User) {
        const { id: userId } = user
        const chats = await this.prisma.chat.findMany({
            where: {
                members: { some: { userId: userId, visibleChat: true } },
                type: {
                    not: 'SERVER'
                }
            },
            select: {
                id: true,
                name: true,
                type: true,
                members: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                avatar_url: true,
                                status: true,
                                username: true
                            }
                        },
                        role: true
                    }
                }
            }
        })
        const formattedChats = chats.map(chat => {
            let displayName = chat.name;

            if (chat.type === 'PRIVATE') {
                const otherMember = chat.members.find(m => m.user.id !== user.id);
                displayName = otherMember?.user.username || 'Deleted User';
            }

            return {
                id: chat.id,
                type: chat.type,
                name: displayName,
                members: chat.members.map(m => ({
                    id: m.user.id,
                    avatar_url: m.user.avatar_url,
                    status: m.user.status,
                    username: m.user.username,
                    role: m.role
                }))
            };
        });
        return formattedChats
    }

    async hideChat(user: User, chatDTO: ParamsChatDTO) {
        const { id } = chatDTO
        const { id: userId } = user

        const existedChat = await this.prisma.chatMember.findUnique({
            where: { chatId_userId: { chatId: id, userId: userId } }
        })
        if (!existedChat) {
            throw new NotFoundException("Chat not found")
        }
        if (existedChat.visibleChat == false) {
            return { success: "chat is hidden" }
        }

        const chat = await this.prisma.chatMember.update({
            where: {
                chatId_userId: { chatId: id, userId: userId }
            },
            data: {
                visibleChat: false
            }
        })
        return { success: "chat is hidden" }
    }

    async createPrivateChat(user: User, DTO: CreatePrivateChatDto) {
        // const statusOfChat = (chat) => {
        //     const statuses = $Enums.UserStatus
        //     for (let status in statuses) {
        //         const hasStatus = chat.members.find(member => {
        //             return member.user.status == status && member.user.id != user.id
        //         })
        //         if (hasStatus) return status
        //     };
        // }
        if (DTO.memberId == user.id) {
            throw new BadRequestException("You can't create private messages with yourself.")
        }
        const existUser = await this.userService.findById(DTO.memberId)
        if (!existUser) throw new NotFoundException("User not found")
        const existedChat = await this.prisma.chat.findFirst({
            where: {
                AND: [
                    { members: { some: { userId: user.id } } },
                    { members: { some: { userId: DTO.memberId } } },
                ]
            },
            include: {
                members: {
                    include: {
                        user: true
                    }
                }
            }
        })
        if (existedChat) {
            await this.prisma.chatMember.update({
                where: {
                    chatId_userId: {
                        chatId: existedChat.id,
                        userId: user.id
                    }
                },
                data: {
                    visibleChat: true
                }
            })
            return existedChat
        }
        const newChat = await this.prisma.chat.create({
            data: {
                type: 'PRIVATE',
                members: {
                    create: [
                        {
                            userId: user.id,
                            visibleChat: true
                        },
                        {
                            userId: DTO.memberId,
                            visibleChat: false
                        }
                    ]
                },
                name: ""
            },
            include: {
                members: {
                    include: {
                        user: true
                    }
                }
            }
        })

        return newChat
    }

    async createGroupChat(user: User, DTO: CreateGroupChatDto) {
        if (DTO.memberIds.length < 2) {
            throw new BadRequestException()
        }

        //определить что все пользователи из массива - друзья, один из них не отправитель и существуют
        const friendsInList = await this.prisma.user.findMany({
            where: {
                AND: [
                    { id: { in: DTO.memberIds } },
                    {
                        OR: [
                            {
                                sentFriendships: {
                                    some: {
                                        recipientId: user.id,
                                        status: 'ACCEPTED'
                                    }
                                }
                            },
                            {
                                receivedFriendships: {
                                    some: {
                                        requesterId: user.id,
                                        status: 'ACCEPTED'
                                    }
                                }
                            },
                        ]
                    }
                ]
            }
        })

        //если количество не соответствует - выдать ошибку
        if (friendsInList.length != DTO.memberIds.length) {
            throw new BadRequestException()
        }
        //создать группу и добавить людей
        const createdGroup = await this.prisma.chat.create({
            data: {
                name: friendsInList.concat(user).map(friend => { return friend.username }).join(', '),
                type: 'GROUP',
                members: {
                    createMany: {
                        data: friendsInList.map(friend => ({
                            userId: friend.id,
                            visibleChat: true,
                            role: 'MEMBER'
                        }))
                    },
                    create: {
                        userId: user.id,
                        visibleChat: true,
                        role: 'OWNER'
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar_url: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        })
        return createdGroup
    }

    async leaveGroup(user: User, chatDTO: ParamsChatDTO) {
        const { id } = chatDTO
        const { id: userId } = user
        //проверить что чат - группа и пользователь в нем состоит
        const chat = await this.prisma.chat.findUnique({
            where: {
                id,
                members: {
                    some: {
                        userId
                    }
                }
            },
            select: {
                id: true,
                name: true,
                type: true,
                members: {
                    select: {
                        userId: true,
                        role: true
                    }
                }
            }
        })
        if (!chat) throw new NotFoundException("Chat not found")
        if (chat.type != 'GROUP') throw new BadRequestException("Chat is not group")
        //если последний - удалить чат
        if (chat.members.length == 1) {
            await this.prisma.chat.delete({
                where: { id: chat.id }
            })
            return "Chat is deleted"
        }
        //если нет владелец - передать права
        const remainingUsers = chat.members
            .filter(member => member.userId != userId)
            .map(member => ({
                userId: member.userId,
                role: member.role
            }))
        const hasOwher = !!remainingUsers.find(member => member.role == 'OWNER')
        if (!hasOwher) {
            const randomUserForOwnerPlace = remainingUsers[Math.floor(Math.random() * remainingUsers.length)]
            await this.prisma.chatMember.update({
                where: {
                    chatId_userId: {
                        chatId: chat.id,
                        userId: randomUserForOwnerPlace.userId
                    }
                },
                data: { role: 'OWNER' }
            })
        }
        //выйти
        await this.prisma.chatMember.delete({
            where: { chatId_userId: { chatId: chat.id, userId: userId } }
        })
    }

    async changeChat(user: User, DTO: ChangeChatDTO, image: Express.Multer.File) {
        const { id: chatId } = DTO.params
        const { name: chatName } = DTO.body
        const { id: userId } = user

        const owner = await this.prisma.chatMember.findUnique({
            where: { chatId_userId: { chatId: chatId, userId: userId } }
        })
        if (!owner) throw new NotFoundException("Chat not found")
        if (owner.role != 'OWNER') throw new ForbiddenException("only the chat owner can change it.")
        await this.prisma.chat.update({
            where: { id: chatId },
            data: { name: chatName }
        })
        return { success: "Chat updated" }
    }


    async sendMessage(user: User, sendMessageDto) {
        return "message is sended"
    }

    async getMessagesOfChat(user: User, getMessagesOfChatDto) {
        return "messages"
    }
}
