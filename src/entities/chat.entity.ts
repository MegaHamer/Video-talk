import { Exclude, Expose, plainToInstance, Transform, Type } from 'class-transformer';
import { UserResponseDto } from './user.entity';
import { UserStatus } from 'prisma/src/generated/prisma/client';

@Exclude()
export class ChatResponseDto {
  @Expose()
  id: number;

  @Expose()
  type: string;

  @Expose()
  name: string;

  @Expose()
  @Transform(({ value }) => {
    return value.map(member => plainToInstance(UserResponseDto, member.user));
  })
  members: UserResponseDto[];

  @Expose()
  @Transform(({obj})=>{
    // console.log(obj)
    return obj.chatStatus
  })
  chatStatus:UserStatus
}