import { PrismaClient } from '@prisma/client';
import { seedArticles, seedFriendLinks } from './content';
import { additionalArticles, additionalFriendLinks, seedMoments } from './additional-content';

const prisma = new PrismaClient();

async function main() {
  // 正式文章内容
  for (const article of [...seedArticles, ...additionalArticles]) {
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
      await prisma.post.update({
        where: { slug: article.slug },
        data: {
          ...article,
          type: 'ARTICLE',
          status: 'PUBLISHED',
          media: {},
        },
      });
      console.log(`文章 [${article.title}] 已更新`);
    }
  }

  // 短动态
  for (const moment of seedMoments) {
    const exists = await prisma.post.findUnique({
      where: { slug: moment.slug },
    });
    if (!exists) {
      await prisma.post.create({
        data: {
          ...moment,
          type: 'MOMENT',
          status: 'PUBLISHED',
          content: '',
          excerpt: null,
          media: moment.media ?? {},
          tags: [],
        },
      });
      console.log(`动态 [${moment.title}] 已创建`);
    } else {
      console.log(`动态 [${moment.title}] 已存在，跳过创建`);
    }
  }

  // 友情链接
  for (const friendLink of [...seedFriendLinks, ...additionalFriendLinks]) {
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
      type: 'DATE_CARD' as const,
      area: 'LEFT' as const,
      verticalPosition: 'TOP' as const,
      horizontalOffset: 24,
      verticalOffset: 500,
      rotation: 0,
      title: '时光',
      sortOrder: 1,
      config: {
        showTime: true,
      },
    },
    {
      type: 'HITOKOTO' as const,
      area: 'LEFT' as const,
      verticalPosition: 'TOP' as const,
      horizontalOffset: 24,
      verticalOffset: 340,
      rotation: 0,
      title: '一言',
      sortOrder: 2,
      config: {},
    },
    {
      type: 'PROJECT_TREE' as const,
      area: 'LEFT' as const,
      verticalPosition: 'TOP' as const,
      horizontalOffset: 24,
      verticalOffset: 22,
      rotation: -3,
      title: '项目目录',
      sortOrder: 0,
      config: {},
    },
    {
      type: 'KEYBOARD' as const,
      area: 'LEFT' as const,
      verticalPosition: 'BOTTOM' as const,
      horizontalOffset: 24,
      verticalOffset: 16,
      rotation: 0,
      title: '键盘',
      sortOrder: 0,
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
