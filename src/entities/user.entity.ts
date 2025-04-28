import { Expose, Exclude } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose({ name: 'avatar_url' })
  avatarUrl: string;

  @Expose()
  status: string;
}