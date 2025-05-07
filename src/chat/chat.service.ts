import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { $Enums, Chat, User } from 'prisma/src/generated/prisma/client';
import {
  ChangeChatDTO,
  CreateGroupChatDto,
  CreatePrivateChatDto,
  ParamsChatDTO,
  ParamsDTO,
} from './chat.dto';
import { PrismaService } from 'src/prisma.service';
import { UsersService } from 'src/users/users.service';
import { UpdateChatDto } from './dto/update.dto';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class ChatService {
  constructor(
    private userService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  async getAllChats(userId: number) {
    const chats = await this.prisma.chat.findMany({
      where: {
        members: { some: { userId: userId } },
        type: {
          not: 'SERVER',
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        icon: true,
        ownerId: true,
        members: {
          select: {
            user: {
              select: {
                id: true,
                avatar_url: true,
                username: true,
              },
            },
            isActive: true,
          },
        },
      },
    });
    const formattedChats = chats.map((chat) => {
      const standartProps = {
        id: chat.id,
        type: chat.type,
        // last_message_id: ,
        recipients: chat.members
          .filter((member) => member.user.id != userId)
          .map((member) => {
            const { id, username, avatar_url } = member.user;
            return {
              id,
              username,
              avatar_url,
            };
          }),
      };
      if (chat.type === 'GROUP') {
        return {
          ...standartProps,
          owner_id: chat.ownerId,
          icon: chat.icon,
          name: chat.name,
        };
      }
      return {
        ...standartProps,
        hidden: !chat.members.find((member) => member.user.id == userId)
          ?.isActive,
      };
    });
    return formattedChats;
  }

  async getActiveChats(userId: number) {
    const chats = await this.prisma.chat.findMany({
      where: {
        members: { some: { userId: userId, isActive: true } },
        type: {
          not: 'SERVER',
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        icon: true,
        ownerId: true,
        members: {
          select: {
            user: {
              select: {
                id: true,
                avatar_url: true,
                username: true,
              },
            },
          },
        },
      },
    });
    const formattedChats = chats.map((chat) => {
      const standartProps = {
        id: chat.id,
        type: chat.type,
        // last_message_id: ,
        recipients: chat.members
          .filter((member) => member.user.id != userId)
          .map((member) => {
            const { id, username, avatar_url } = member.user;
            return {
              id,
              username,
              avatar_url,
            };
          }),
      };
      if (chat.type === 'GROUP') {
        return {
          ...standartProps,
          owner_id: chat.ownerId,
          icon: chat.icon,
          name: chat.name,
        };
      }
      return { ...standartProps };
    });
    return formattedChats;
  }

  async leaveChat(userId: number, chatId: number) {
    const chatMember = await this.prisma.chatMember.findUnique({
      where: {
        chatId_userId: { chatId, userId },
      },
      include: { chat: true },
    });
    if (!chatMember) {
      throw new NotFoundException(
        'Not a member',
        'You are not a member of this chat',
      );
    }
    const isPrivate = chatMember.chat.type == 'PRIVATE';
    if (isPrivate) {
      await this.prisma.chatMember.update({
        where: { chatId_userId: { chatId, userId } },
        data: { isActive: false },
      });
      return;
    }

    await this.prisma.chatMember.delete({
      where: { chatId_userId: { chatId, userId } },
    });
    const remainingMembers = await this.prisma.chatMember.count({
      where: { chatId },
    });
    if (remainingMembers === 0) {
      await this.prisma.chat.delete({
        where: { id: chatId },
      });
      if (chatMember.chat.icon) {
        this.deleteIconFile(chatMember.chat.icon);
      }
    }

    await this.prisma.chat.delete({
      where: { id: chatId, members: { some: {} } },
    });

    return;
  }

  async createChat(userId: number, recipientsIds: number[]) {
    const usersInDB = await this.prisma.user.count({
      where: { id: { in: recipientsIds } },
    });
    if (usersInDB != recipientsIds.length) {
      throw new NotFoundException(`Users not found`);
    }

    const isPrivate = recipientsIds.filter((id) => id != userId).length == 1;
    const memberIds = [userId, ...recipientsIds];
    //121
    if (isPrivate) {
      const existedChat = await this.prisma.chat.findFirst({
        where: {
          type: 'PRIVATE',
          members: {
            every: {
              userId: { in: memberIds },
            },
          },
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });
      if (existedChat) {
        await this.prisma.chatMember.update({
          where: { chatId_userId: { chatId: existedChat.id, userId: userId } },
          data: { isActive: true },
        });
        return {
          id: existedChat.id,
          type: existedChat.type,
          // last_message_id: ,
          recipients: existedChat.members
            .filter((member) => member.user.id != userId)
            .map((member) => {
              const { id, username, avatar_url } = member.user;
              return {
                id,
                username,
                avatar_url,
              };
            }),
        };
      }
    }

    const chat = await this.prisma.chat.create({
      data: {
        type: isPrivate ? 'PRIVATE' : 'GROUP',
        ownerId: isPrivate ? null : userId,
        members: {
          createMany: {
            data: memberIds.map((id) => ({
              isActive: !isPrivate || id == userId,
              userId: id,
            })),
            skipDuplicates: true,
          },
        },
      },
      include: {
        members: {
          select: {
            user: true,
          },
        },
      },
    });

    let formattedChat = {
      id: chat.id,
      type: chat.type,
      // last_message_id: ,
      recipients: chat.members
        .filter((member) => member.user.id != userId)
        .map((member) => {
          const { id, username, avatar_url } = member.user;
          return {
            id,
            username,
            avatar_url,
          };
        }),
    };
    if (chat.type === 'GROUP') {
      return {
        ...formattedChat,
        owner_id: chat.ownerId,
        icon: chat.icon,
        name: chat.name,
      };
    }
    return formattedChat;
  }

  async updateChat(userId: number, chatId: number, UpdateDto: UpdateChatDto) {
    const membership = await this.prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    if (chat.type == 'PRIVATE') {
      throw new BadRequestException('This chat cannot be updated');
    }
    if (chat.ownerId != userId) {
      throw new ForbiddenException('You are not the owner of this chat');
    }
    if (
      UpdateDto.owner &&
      !chat.members.some((m) => m.userId === UpdateDto.owner)
    ) {
      throw new ForbiddenException('New owner must be a chat member');
    }

    let iconPath = chat.icon;
    
    if (UpdateDto.icon !== undefined) {
      // Удаляем старую иконку, если она есть
      if (chat.icon) {
        iconPath = null
        this.deleteIconFile(chat.icon);
      }
      if (UpdateDto.icon) {
        iconPath = this.getIconPath(UpdateDto.icon);
      }
    }
    
    return await this.prisma.chat.update({
      where: { id: chatId },
      data: {
        name: !!UpdateDto.name ? UpdateDto.name : null,
        icon: iconPath ?? null,
        ownerId: UpdateDto.owner ?? undefined,
        updatedAt: new Date(),
      },
      include: {
        members: true,
      },
    });
  }
  private getIconPath(file: Express.Multer.File): string {
    return `/uploads/chat-icons/${file.filename}`;
  }

  private deleteIconFile(path: string): void {
    const fullPath = join(process.cwd(), path);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
    }
  }

  //   async hideChat(user: User, chatDTO: ParamsChatDTO) {
  //     const { chatId } = chatDTO;
  //     const { id: userId } = user;

  //     const existedChat = await this.prisma.chatMember.findUnique({
  //       where: { chatId_userId: { chatId, userId: userId } },
  //     });
  //     if (!existedChat) {
  //       throw new NotFoundException('Chat not found');
  //     }
  //     if (existedChat.isActive == false) {
  //       return { success: 'chat is hidden' };
  //     }

  //     const chat = await this.prisma.chatMember.update({
  //       where: {
  //         chatId_userId: { chatId, userId: userId },
  //       },
  //       data: {
  //         isActive: false,
  //       },
  //     });
  //     return { success: 'chat is hidden' };
  //   }

  //   async createPrivateChat(user: User, DTO: CreatePrivateChatDto) {
  //     // const statusOfChat = (chat) => {
  //     //     const statuses = $Enums.UserStatus
  //     //     for (let status in statuses) {
  //     //         const hasStatus = chat.members.find(member => {
  //     //             return member.user.status == status && member.user.id != user.id
  //     //         })
  //     //         if (hasStatus) return status
  //     //     };
  //     // }
  //     if (DTO.memberId == user.id) {
  //       throw new BadRequestException(
  //         "You can't create private messages with yourself.",
  //       );
  //     }
  //     const existUser = await this.userService.findById(DTO.memberId);
  //     if (!existUser) throw new NotFoundException('User not found');
  //     const existedChat = await this.prisma.chat.findFirst({
  //       where: {
  //         AND: [
  //           { members: { some: { userId: user.id } } },
  //           { members: { some: { userId: DTO.memberId } } },
  //         ],
  //         type: 'PRIVATE',
  //       },
  //       include: {
  //         members: {
  //           include: {
  //             user: true,
  //           },
  //         },
  //       },
  //     });
  //     if (existedChat) {
  //       await this.prisma.chatMember.update({
  //         where: {
  //           chatId_userId: {
  //             chatId: existedChat.id,
  //             userId: user.id,
  //           },
  //         },
  //         data: {
  //           isActive: true,
  //         },
  //       });
  //       return existedChat;
  //     }
  //     const newChat = await this.prisma.chat.create({
  //       data: {
  //         type: 'PRIVATE',
  //         members: {
  //           create: [
  //             {
  //               userId: user.id,
  //               isActive: true,
  //             },
  //             {
  //               userId: DTO.memberId,
  //               isActive: false,
  //             },
  //           ],
  //         },
  //         name: '',
  //       },
  //       include: {
  //         members: {
  //           include: {
  //             user: true,
  //           },
  //         },
  //       },
  //     });

  //     return newChat;
  //   }

  //   async createGroupChat(user: User, DTO: CreateGroupChatDto) {
  //     if (DTO.memberIds.length < 2) {
  //       throw new BadRequestException();
  //     }

  //     //определить что все пользователи из массива - друзья, один из них не отправитель и существуют
  //     const friendsInList = await this.prisma.user.findMany({
  //       where: {
  //         AND: [
  //           { id: { in: DTO.memberIds } },
  //           {
  //             OR: [
  //               {
  //                 sentRelationship: {
  //                   some: {
  //                     recipientId: user.id,
  //                     type: 'FRIEND',
  //                   },
  //                 },
  //               },
  //               {
  //                 receivedRelationship: {
  //                   some: {
  //                     requesterId: user.id,
  //                     type: 'FRIEND',
  //                   },
  //                 },
  //               },
  //             ],
  //           },
  //         ],
  //       },
  //     });

  //     //если количество не соответствует - выдать ошибку
  //     if (friendsInList.length != DTO.memberIds.length) {
  //       throw new BadRequestException();
  //     }
  //     //создать группу и добавить людей
  //     const createdGroup = await this.prisma.chat.create({
  //       data: {
  //         name: friendsInList
  //           .concat(user)
  //           .map((friend) => {
  //             return friend.username;
  //           })
  //           .join(', '),
  //         type: 'GROUP',
  //         members: {
  //           createMany: {
  //             data: friendsInList.map((friend) => ({
  //               userId: friend.id,
  //               isActive: true,
  //               role: 'MEMBER',
  //             })),
  //           },
  //           create: {
  //             userId: user.id,
  //             isActive: true,
  //           },
  //         },
  //       },
  //       include: {
  //         members: {
  //           include: {
  //             user: {
  //               select: {
  //                 id: true,
  //                 username: true,
  //                 avatar_url: true,
  //                 status: true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //     });
  //     return createdGroup;
  //   }

  //   async leaveGroup(user: User, chatDTO: ParamsChatDTO) {
  //     const { chatId } = chatDTO;
  //     const { id: userId } = user;
  //     //проверить что чат - группа и пользователь в нем состоит
  //     const chat = await this.prisma.chat.findUnique({
  //       where: {
  //         id: chatId,
  //         members: {
  //           some: {
  //             userId,
  //           },
  //         },
  //       },
  //       select: {
  //         id: true,
  //         name: true,
  //         type: true,
  //         members: {
  //           select: {
  //             userId: true,
  //             role: true,
  //           },
  //         },
  //       },
  //     });
  //     if (!chat) throw new NotFoundException('Chat not found');
  //     if (chat.type != 'GROUP')
  //       throw new BadRequestException('Chat is not group');
  //     //если последний - удалить чат
  //     if (chat.members.length == 1) {
  //       await this.prisma.chat.delete({
  //         where: { id: chat.id },
  //       });
  //       return 'Chat is deleted';
  //     }
  //     //если нет владелец - передать права
  //     const remainingUsers = chat.members
  //       .filter((member) => member.userId != userId)
  //       .map((member) => ({
  //         userId: member.userId,
  //         role: member.role,
  //       }));
  //     const hasOwher = !!remainingUsers.find((member) => member.role == 'OWNER');
  //     if (!hasOwher) {
  //       const randomUserForOwnerPlace =
  //         remainingUsers[Math.floor(Math.random() * remainingUsers.length)];
  //       await this.prisma.chatMember.update({
  //         where: {
  //           chatId_userId: {
  //             chatId: chat.id,
  //             userId: randomUserForOwnerPlace.userId,
  //           },
  //         },
  //         data: { role: 'OWNER' },
  //       });
  //     }
  //     //выйти
  //     await this.prisma.chatMember.delete({
  //       where: { chatId_userId: { chatId: chat.id, userId: userId } },
  //     });
  //   }

  //   async changeChat(user: User, DTO: ChangeChatDTO, image: Express.Multer.File) {
  //     const { chatId } = DTO.params;
  //     const { name: chatName } = DTO.body;
  //     const { id: userId } = user;

  //     const owner = await this.prisma.chatMember.findUnique({
  //       where: { chatId_userId: { chatId: chatId, userId: userId } },
  //     });
  //     if (!owner) throw new NotFoundException('Chat not found');
  //     if (owner.role != 'OWNER')
  //       throw new ForbiddenException('only the chat owner can change it.');
  //     await this.prisma.chat.update({
  //       where: { id: chatId },
  //       data: { name: chatName },
  //     });
  //     return { success: 'Chat updated' };
  //   }

  //   async showChat(user: User, DTO: ParamsChatDTO) {
  //     const { id: userId } = user;
  //     const { chatId } = DTO;

  //     const existedChat = await this.prisma.chatMember.findUnique({
  //       where: { chatId_userId: { chatId: chatId, userId: userId } },
  //     });
  //     if (!existedChat) {
  //       throw new NotFoundException('Chat not found');
  //     }

  //     if (existedChat.isActive == true) {
  //       return { success: 'chat is shown' };
  //     }

  //     const chat = await this.prisma.chatMember.update({
  //       where: {
  //         chatId_userId: { chatId: chatId, userId: userId },
  //       },
  //       data: {
  //         isActive: true,
  //       },
  //     });
  //     return { success: 'chat is shown' };
  //   }

  //   async addUserToChat(
  //     user: User,
  //     DTO: { memberIds: number[]; chatId: number },
  //   ) {
  //     const { id: userId } = user;
  //     const { chatId, memberIds } = DTO;
  //     //пользователи есть?
  //     const usersInList = await this.prisma.user.findMany({
  //       where: {
  //         id: { in: memberIds },
  //       },
  //     });
  //     if (usersInList.length != memberIds.length) {
  //       const NotFoundUsers = memberIds.filter(
  //         (memberId) =>
  //           !usersInList.map((member) => member.id).includes(memberId),
  //       );
  //       if (NotFoundUsers.includes(userId))
  //         throw new BadRequestException("User can't join yourself");
  //       throw new NotFoundException(
  //         `No users with IDs ${NotFoundUsers.join(', ')} were found.`,
  //       );
  //     }
  //     //друзья ?
  //     const friendsInList = await this.prisma.user.findMany({
  //       where: {
  //         AND: [
  //           { id: { in: memberIds } },
  //           {
  //             OR: [
  //               {
  //                 sentRelationship: {
  //                   some: {
  //                     recipientId: user.id,
  //                     type: 'FRIEND',
  //                   },
  //                 },
  //               },
  //               {
  //                 receivedRelationship: {
  //                   some: {
  //                     requesterId: user.id,
  //                     type: 'FRIEND',
  //                   },
  //                 },
  //               },
  //             ],
  //           },
  //         ],
  //       },
  //     });
  //     if (friendsInList.length != memberIds.length) {
  //       const notUsers = memberIds.filter(
  //         (memberId) =>
  //           !friendsInList.map((member) => member.id).includes(memberId),
  //       );
  //       throw new BadRequestException(
  //         `Users with IDs ${notUsers.join(', ')} are not friends`,
  //       );
  //     }
  //     //чат есть?
  //     const existedChat = await this.prisma.chat.findUnique({
  //       where: {
  //         id: chatId,
  //         members: {
  //           some: {
  //             userId: userId,
  //           },
  //         },
  //       },
  //       select: {
  //         id: true,
  //         type: true,
  //         members: {
  //           select: {
  //             userId: true,
  //             role: true,
  //           },
  //         },
  //       },
  //     });
  //     if (!existedChat) throw new NotFoundException('Chat not found');
  //     //груповой?
  //     if (existedChat.type != 'GROUP')
  //       throw new BadRequestException('Chat must be type group');
  //     // пользователи которых нет
  //     const notMembers = existedChat.members.filter(
  //       (member) => !memberIds.includes(member.userId),
  //     );

  //     //добавить пользователей
  //     await this.prisma.chatMember.createMany({
  //       data: notMembers.map((user) => ({
  //         isActive: true,
  //         chatId: chatId,
  //         userId: user.userId,
  //       })),
  //     });
  //     return { success: 'User successfuly added' };
  //   }

  //   async sendMessage(user: User, sendMessageDto) {
  //     return 'message is sended';
  //   }

  //   async getMessagesOfChat(user: User, getMessagesOfChatDto) {
  //     return 'messages';
  //   }
}
