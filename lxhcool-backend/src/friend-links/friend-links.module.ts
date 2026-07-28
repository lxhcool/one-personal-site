import { Module } from '@nestjs/common';
import { AdminFriendLinksController } from './admin-friend-links.controller';
import { FriendLinksService } from './friend-links.service';
import { PublicFriendLinksController } from './public-friend-links.controller';

@Module({
  controllers: [PublicFriendLinksController, AdminFriendLinksController],
  providers: [FriendLinksService],
})
export class FriendLinksModule {}
