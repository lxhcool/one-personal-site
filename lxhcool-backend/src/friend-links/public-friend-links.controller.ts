import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ok } from '../common/api-response';
import { ApiDataResponse } from '../common/openapi-response.decorator';
import { FriendLinkResponseDto } from './dto/friend-link-response.dto';
import { FriendLinksService } from './friend-links.service';

@Controller('public/friend-links')
@ApiTags('Public Friend Links')
export class PublicFriendLinksController {
  constructor(private readonly friendLinks: FriendLinksService) {}

  @Get()
  @ApiDataResponse(FriendLinkResponseDto, { isArray: true })
  async list() {
    return ok(FriendLinkResponseDto.fromMany(await this.friendLinks.listPublic()));
  }
}
