import { Module } from "@nestjs/common";
import { ChatService } from "src/chat/chat.service";

@Module({
  providers: [ChatService],
  exports: [ChatService],
})
export class SharedServicesModule {}