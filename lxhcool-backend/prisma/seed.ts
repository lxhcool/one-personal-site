import { PrismaClient } from '@prisma/client';
import { seedArticles, seedFriendLinks } from './content';

const prisma = new PrismaClient();

async function main() {
  // 正式文章内容
  for (const article of seedArticles) {
    const exists = await prisma.post.findUnique({
      where: { slug: article.slug },
    });
    if (!exists) {
      await prisma.post.create({
        data: {
          ...article,
          type: 'ARTICLE',
          status: 'PUBLISHED',
          media: {},
        },
      });
      console.log(`文章 [${article.title}] 已创建`);
    } else {
      console.log(`文章 [${article.title}] 已存在，跳过创建`);
    }
  }

  // 友情链接
  for (const friendLink of seedFriendLinks) {
    const exists = await prisma.friendLink.findFirst({
      where: { url: friendLink.url },
    });
    if (!exists) {
      await prisma.friendLink.create({
        data: {
          ...friendLink,
          isVisible: true,
        },
      });
      console.log(`友情链接 [${friendLink.name}] 已创建`);
    } else {
      console.log(`友情链接 [${friendLink.name}] 已存在，跳过创建`);
    }
  }

  // 内容分类，确保后台编辑时可继续选择这些分类
  const categories = [
    { type: 'POST' as const, name: '设计思考', sortOrder: 20 },
    { type: 'POST' as const, name: '工程实践', sortOrder: 21 },
    { type: 'POST' as const, name: '写作思考', sortOrder: 22 },
    { type: 'FRIEND_LINK' as const, name: '开发者', sortOrder: 20 },
    { type: 'FRIEND_LINK' as const, name: '阅读', sortOrder: 21 },
  ];

  for (const category of categories) {
    await prisma.contentCategory.upsert({
      where: { type_name: { type: category.type, name: category.name } },
      update: { sortOrder: category.sortOrder },
      create: category,
    });
  }

  // 默认小工具
  const widgets = [
    {
      type: 'PROFILE' as const,
      area: 'RIGHT' as const,
      title: '个人信息',
      sortOrder: 1,
      config: {
        name: '哈基米',
        bio: '这个人很懒，什么都没写~',
      },
    },
    {
      type: 'DATE_CARD' as const,
      area: 'LEFT' as const,
      title: '时光',
      sortOrder: 1,
      config: {
        showTime: true,
      },
    },
    {
      type: 'HITOKOTO' as const,
      area: 'LEFT' as const,
      title: '一言',
      sortOrder: 2,
      config: {},
    },
  ];

  for (const widget of widgets) {
    const exists = await prisma.siteWidget.findUnique({
      where: { type: widget.type },
    });
    if (!exists) {
      await prisma.siteWidget.create({
        data: widget,
      });
      console.log(`小工具 [${widget.type}] 已创建`);
    } else {
      console.log(`小工具 [${widget.type}] 已存在，跳过创建`);
    }
  }
}

main()
  .catch((e) => {
    console.error('Seed 失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
