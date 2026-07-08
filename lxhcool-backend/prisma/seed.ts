import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 默认动态
  const existingPost = await prisma.post.findFirst({
    where: { slug: 'default-moment' },
  });

  if (!existingPost) {
    await prisma.post.create({
      data: {
        type: 'MOMENT',
        title: '这是一条示例动态',
        slug: 'default-moment',
        content: '这是一条示例动态，可以在后台管理页面中删除或编辑。',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    console.log('默认动态已创建');
  } else {
    console.log('默认动态已存在，跳过创建');
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
