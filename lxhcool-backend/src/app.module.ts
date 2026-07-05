import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { FriendLinksModule } from './friend-links/friend-links.module';
import { PostsModule } from './posts/posts.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { UploadsModule } from './uploads/uploads.module';
import { CategoriesModule } from './categories/categories.module';
import { WidgetsModule } from './widgets/widgets.module';
import { MusicModule } from './music/music.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PostsModule,
    ProjectsModule,
    FriendLinksModule,
    UploadsModule,
    CategoriesModule,
    WidgetsModule,
    MusicModule,
  ],
})
export class AppModule {}
