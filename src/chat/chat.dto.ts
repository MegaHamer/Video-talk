import { Expose, Transform, Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNotEmpty, isNumber, IsNumber, IsString } from "class-validator";


export class ParamsDTO {
    @IsNumber()
    id: string;
}

export class BodyDTO {
    @IsString()
    hello: string;
}
export class QueryDTO {
    @IsNumber()
    size: number
    @IsNumber()
    offset: number
}

export class MixedDTO {
    @Type(() => ParamsDTO)
    params: ParamsDTO;

    @Type(() => BodyDTO)
    body: BodyDTO;
}


//send Message
export class ParamsChatDTO {
    @IsNumber()
    @Transform(({ value }) => parseInt(value, 10))
    id: number;
}
export class BodySendMessageDto {
    @IsString()
    content: string;
}
export class SendMessageDto {
    @Type(() => ParamsChatDTO)
    params: ParamsChatDTO;
    @Type(() => BodySendMessageDto)
    body: BodySendMessageDto;
}
//get messages
// export class QueryGetMessagesDto {
//     @IsNumber()
//     size: number
//     @IsNumber()
//     offset: number
// }
// export class GetMessagesDto {
//     @Type(() => ParamsChatDTO)
//     params: ParamsChatDTO;
//     @Type(() => QueryGetMessagesDto)
//     query: QueryGetMessagesDto;
// }
//create private chat
export class CreatePrivateChatDto {
    @IsNumber()
    @Transform(({ value }) => parseInt(value, 10))
    memberId: number
}
//create group chat
export class CreateGroupChatDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'Chat must have at least 1 member' })
    @IsNumber({}, { each: true, message: 'Each member ID must be a number' })
    @Transform(({ value }) => {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    })
    memberIds: number[];

    @IsString()
    @IsNotEmpty()
    name: string;
}

//change chat
export class BodyChangeChatDTO{
    @IsString()
    name: string;
}
export class ChangeChatDTO {
    @Type(() => ParamsChatDTO)
    params: ParamsChatDTO;
    @Type(() => BodyChangeChatDTO)
    body: BodyChangeChatDTO;
}