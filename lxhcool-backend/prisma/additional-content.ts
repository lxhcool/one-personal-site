import type { SeedArticle, SeedFriendLink } from './content';

export type SeedMoment = {
  title: string;
  slug: string;
  publishedAt: Date;
  media?: Record<string, unknown>;
};

export const additionalArticles: SeedArticle[] = [
  {
    title: '让桌面小工具在不同屏幕上保持秩序',
    slug: 'responsive-desktop-widgets',
    category: '工程实践',
    excerpt: '自由布局不等于固定像素，位置、缩放与安全区域需要一套共同规则。',
    tags: ['响应式设计', '小工具', '前端开发'],
    publishedAt: new Date('2026-07-22T09:30:00+08:00'),
    seoTitle: '让桌面小工具在不同屏幕上保持秩序',
    seoDescription: '记录桌面式个人网站中，小工具如何根据视口缩放、聚拢并避让正文。',
    content: `## 自由布局不是保存绝对坐标

桌面式页面允许小工具出现在正文四周。最直接的实现是把拖动后的 \`left\` 和 \`top\` 保存到数据库，但这组坐标只对当前窗口有效：从 2560 像素屏幕切换到 1440 像素，右侧组件可能压住正文；窗口继续缩小时，它甚至会落到可视区域之外。

更稳定的模型是保存“归属的角落”和“到对应边缘的距离”。左上组件保存左边距与上边距，右下组件保存右边距与下边距。数据结构可以明确表达这层关系：

\`\`\`ts
type WidgetArea = 'LEFT' | 'RIGHT'
type VerticalPosition = 'TOP' | 'BOTTOM'

type WidgetPlacement = {
  area: WidgetArea
  verticalPosition: VerticalPosition
  horizontalOffset: number
  verticalOffset: number
  rotation: number
}
\`\`\`

位置不再描述“屏幕上的一个点”，而是在描述“小工具与页面边缘的关系”。这也是响应式布局能够成立的基础。

## 拖动时先判断归属

拖动结束后，可以用组件中心点判断它属于左侧还是右侧、顶部还是底部。随后再把可见坐标换算为边缘偏移：

\`\`\`ts
function resolvePlacement(
  rect: DOMRect,
  viewport: { width: number; height: number },
  scale: number,
): WidgetPlacement {
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const area = centerX < viewport.width / 2 ? 'LEFT' : 'RIGHT'
  const verticalPosition = centerY < viewport.height / 2 ? 'TOP' : 'BOTTOM'

  return {
    area,
    verticalPosition,
    horizontalOffset: Math.round(
      (area === 'LEFT' ? rect.left : viewport.width - rect.right) / scale,
    ),
    verticalOffset: Math.round(
      (verticalPosition === 'TOP' ? rect.top : viewport.height - rect.bottom) / scale,
    ),
    rotation: 0,
  }
}
\`\`\`

这里除以 \`scale\` 很重要。后台画布为了容纳 1440 或 2560 像素的预览，通常会把 iframe 缩小显示；如果直接保存缩小后的像素，前台恢复到 100% 时位置会完全不同。

## 把正文当作不可侵犯的安全区

中央内容是页面唯一不能被遮挡的区域。与其等组件放下后再做碰撞检测，不如在拖动过程中直接限制左右边界：

\`\`\`ts
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

const left = area === 'LEFT'
  ? clamp(desiredLeft, margin, safeArea.left - widgetWidth)
  : clamp(desiredLeft, safeArea.right, viewportWidth - widgetWidth - margin)
\`\`\`

安全区可以由中央内容元素的 \`getBoundingClientRect()\` 动态得到，而不是写死为某个宽度。这样以后正文从 680 像素改成 720 像素，拖动规则不需要同步修改。

> 自由布局的核心不是让任何东西出现在任何地方，而是让可自由的区域与不可打扰的区域都足够明确。

## 用统一比例缩放所有外围物件

如果每个组件各自写媒体查询，键盘、音乐播放器与照片墙会在不同断点产生不一致的大小。更简单的方式是给外围层统一设置缩放变量：

\`\`\`css
.desktop-widget {
  position: fixed;
  transform:
    translateZ(0)
    scale(var(--widget-scale))
    rotate(var(--widget-rotation));
  transform-origin: var(--widget-origin);
}

@media (max-width: 767px) {
  .desktop-widget {
    display: none;
  }
}
\`\`\`

缩放比例同时受视口宽度和正文两侧剩余空间约束：

\`\`\`ts
const viewportScale = window.innerWidth / 2560
const sideSpace = (window.innerWidth - contentWidth) / 2
const safeAreaScale = (sideSpace - 12) / 620
const widgetScale = Math.min(1, viewportScale, safeAreaScale)
\`\`\`

## 后台预览也必须同时受宽高约束

只按宽度缩放预览时，矮屏幕会裁掉画布底部。后台工作台应该取宽度比例和高度比例中的较小值：

\`\`\`ts
const canvasScale = Math.min(
  1,
  (stageWidth - padding * 2) / previewWidth,
  (stageHeight - padding * 2) / previewHeight,
)
\`\`\`

实际实现中可以使用 \`ResizeObserver\` 监听舞台尺寸，这比只监听 window 的 resize 更可靠，因为后台侧边栏开合也会改变可用宽度。

## 完成前的检查清单

- [x] 保存的是设计坐标，而不是缩小后画布坐标
- [x] 左右组件分别依附对应边缘
- [x] 拖动过程不会进入正文安全区
- [x] 预览缩放同时考虑可用宽度与高度
- [x] 小于 768 像素时隐藏外围组件
- [ ] 后续加入碰撞吸附和键盘精细移动

当坐标模型、缩放规则和安全区使用同一套设计基准时，自由布局才不会成为只在开发者屏幕上成立的效果。`,
  },
  {
    title: '浅色与深色主题不只是颜色取反',
    slug: 'light-dark-theme-is-not-inversion',
    category: '设计思考',
    excerpt: '好的双主题需要分别处理表面、边缘、阴影和信息层级。',
    tags: ['主题设计', '暗色模式', '视觉系统'],
    publishedAt: new Date('2026-07-20T18:10:00+08:00'),
    seoTitle: '浅色与深色主题不只是颜色取反',
    seoDescription: '从页面背景、卡片表面、边框和阴影出发，整理双主题设计的基本方法。',
    content: `## 表面关系比单个色值更重要

浅色主题依赖白色表面与浅灰背景之间的距离，深色主题则更依赖亮度差、边缘透明度与局部高光。把 \`#ffffff\` 简单替换成 \`#000000\`，通常会得到过重的阴影、发灰的正文和失去层次的卡片。

主题设计更像是在定义一组材质关系：

| 角色 | 浅色模式 | 深色模式 |
| --- | --- | --- |
| 页面背景 | 冷灰、低对比 | 接近黑色但保留色相 |
| 主内容表面 | 纯白 | 比背景略亮 |
| 边框 | 低透明度深色 | 低透明度浅色 |
| 阴影 | 向外扩散 | 更短、更暗 |
| 强调色 | 中等饱和度 | 提高亮度 |

## 从语义变量开始

不要在组件中散落具体颜色。先为稳定角色建立变量，再让主题负责提供值：

\`\`\`css
:root {
  color-scheme: light;
  --page-bg: #f0f2f4;
  --surface: #ffffff;
  --text: #1f2933;
  --text-muted: #74808a;
  --border: rgba(11, 15, 19, 0.07);
  --hover: rgba(11, 15, 19, 0.035);
}

:root[data-theme='dark'] {
  color-scheme: dark;
  --page-bg: #0c0f12;
  --surface: #182126;
  --text: #d9dcda;
  --text-muted: #909b9f;
  --border: rgba(210, 225, 230, 0.1);
  --hover: rgba(145, 167, 172, 0.1);
}
\`\`\`

组件只消费语义变量：

\`\`\`css
.content-window {
  color: var(--text);
  border: 1px solid var(--border);
  background: var(--surface);
}

.content-window a:hover {
  background: var(--hover);
}
\`\`\`

## 避免主题初始化闪烁

如果主题只在 Vue 挂载后读取，服务端先输出浅色页面，客户端再切换深色，就会产生一次明显闪烁。一个轻量方案是在文档解析前读取本地存储：

\`\`\`ts
const savedTheme = localStorage.getItem('site-theme')
const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches
const theme = savedTheme ?? (prefersDark ? 'dark' : 'light')

document.documentElement.dataset.theme = theme
document.documentElement.style.colorScheme = theme
\`\`\`

真正的项目还要考虑 CSP nonce、SSR cookie 与 hydration 一致性，但原则不变：**主题属性越早出现在 html 元素上，首屏越稳定。**

## 阴影不能原样搬到深色模式

浅色页面常用大范围柔和阴影说明高度：

\`\`\`css
box-shadow:
  rgba(11, 15, 19, 0.035) 0 8px 24px,
  rgba(11, 15, 19, 0.04) 0 1px 2px;
\`\`\`

深色背景本身已经很暗，继续使用同样的远距离阴影几乎不可见。此时可以缩短阴影，并增加非常轻的内高光：

\`\`\`css
:root[data-theme='dark'] .content-window {
  box-shadow:
    0 14px 34px rgba(0, 0, 0, 0.34),
    inset 0 1px rgba(210, 225, 230, 0.04);
}
\`\`\`

## 交付前逐项检查

1. 正文和弱化文字是否都达到可读对比度。
2. 输入框、卡片、弹层能否与页面背景区分。
3. Hover、Focus 与 Disabled 是否各自可辨认。
4. 图片透明区域在两个主题中是否都自然。
5. 浏览器原生控件是否跟随 \`color-scheme\`。

两个主题可以拥有不同光线，但字体角色、间距、圆角和交互节奏应该一致。切换主题是在改变房间里的光，而不是把用户带到另一套网站。`,
  },
  {
    title: '错误信息应该帮助下一步行动',
    slug: 'errors-should-guide-the-next-action',
    category: '工程实践',
    excerpt: '“Internal server error”只说明失败，好的错误状态还需要告诉人如何继续。',
    tags: ['错误处理', '用户体验', '全栈开发'],
    publishedAt: new Date('2026-07-17T14:00:00+08:00'),
    seoTitle: '错误信息应该帮助下一步行动',
    seoDescription: '讨论接口错误、表单反馈和空状态如何提供明确、可执行的下一步。',
    content: `## 不要把失败伪装成空数据

请求失败后返回空数组，会让页面看起来正常，却把排查变成猜测。“没有文章”和“数据库不可用”是两个完全不同的状态，接口必须保留这种差异。

一个清楚的响应结构可以同时服务日志和界面：

\`\`\`ts
type ApiResult<T> =
  | { success: true; data: T }
  | {
      success: false
      error: {
        code: string
        message: string
        requestId: string
      }
    }
\`\`\`

错误码用于程序判断，message 用于展示，requestId 则帮助后端从日志中定位同一次请求。不要让前端通过匹配英文错误句子决定下一步操作。

## 在服务端建立一致边界

以 NestJS 为例，可以用全局异常过滤器统一不可预期错误，同时保留框架异常的 HTTP 状态：

\`\`\`ts
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>()
    const request = host.switchToHttp().getRequest<Request>()
    const status = error instanceof HttpException
      ? error.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR

    const requestId = request.headers['x-request-id']?.toString()
      ?? crypto.randomUUID()

    response.status(status).json({
      success: false,
      error: {
        code: status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED',
        message: getSafeMessage(error, status),
        requestId,
      },
    })
  }
}
\`\`\`

这里的重点不是把所有异常压成同一句话，而是确保响应外壳一致、敏感堆栈不会发送给浏览器、服务器日志仍保留完整上下文。

## Fetch 必须主动检查 HTTP 状态

\`fetch\` 在 404 或 500 时不会自动 reject。如果忘记检查 \`response.ok\`，错误响应很可能继续进入正常解析流程：

\`\`\`ts
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, init)
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message = body?.error?.message
      ?? \`请求失败（\${response.status}）\`
    throw new Error(message)
  }

  if (!body?.success) {
    throw new Error(body?.error?.message ?? '响应格式错误')
  }

  return body.data as T
}
\`\`\`

## 不同失败需要不同界面

| 失败类型 | 界面反馈 | 是否保留用户输入 | 建议操作 |
| --- | --- | --- | --- |
| 字段校验 | 字段附近提示 | 是 | 修改后重试 |
| 未登录 | 顶部或弹窗提示 | 是 | 重新登录 |
| 无权限 | 页面级说明 | 不涉及 | 返回可访问页面 |
| 网络中断 | Toast + 状态标记 | 是 | 检查网络并重试 |
| 服务端错误 | 页面或操作区提示 | 是 | 稍后重试并提供 requestId |

> 错误文案的任务不是表达歉意，而是减少用户判断下一步的成本。

## 乐观更新必须能够回滚

开关类操作适合乐观更新：点击后立刻改变视觉状态，再发送请求。但必须在请求失败时恢复原值：

\`\`\`ts
const previous = queryClient.getQueryData<Widget[]>(['widgets'])

queryClient.setQueryData<Widget[]>(['widgets'], current =>
  current?.map(widget =>
    widget.id === id ? { ...widget, enabled } : widget,
  ),
)

try {
  await updateWidget(id, { enabled })
} catch (error) {
  queryClient.setQueryData(['widgets'], previous)
  toast.error(toErrorMessage(error))
}
\`\`\`

如果请求进行中直接把开关设为 disabled，还要防止请求挂起后控件永久不可用。很多时候更好的方式是允许继续操作，用状态文字表达“正在同步”，并对同一资源的请求进行合并或排序。

## 开发环境要尽早失败

- 必需环境变量缺失时停止启动
- 数据库迁移未执行时打印明确命令
- CORS 来源不匹配时记录实际 Origin
- 第三方服务不可用时保留上游状态
- 前端错误边界展示可重试入口

清楚失败比带着错误状态继续运行更节省时间。一个好的错误系统不会让错误消失，而是让它更快抵达能够处理它的人。`,
  },
  {
    title: '照片墙如何从装饰变成记忆索引',
    slug: 'photo-wall-as-memory-index',
    category: '设计思考',
    excerpt: '照片不必只是随机背景，也可以用位置、留白和说明构成可回看的生活索引。',
    tags: ['照片墙', '内容设计', '个人网站'],
    publishedAt: new Date('2026-07-12T16:40:00+08:00'),
    seoTitle: '照片墙如何从装饰变成记忆索引',
    seoDescription: '记录个人网站照片墙的网格、说明文字与空间布局设计。',
    content: `## 给照片一个稳定位置

随机瀑布流适合浏览大量图片，却很难形成稳定记忆。固定网格允许一张照片长期停留在同一个位置，空白格也能成为构图的一部分。

> 照片墙不是要一次填满的作品，而是一张会随着生活逐渐变化的索引。

## 三种布局方式

| 布局 | 优点 | 适合内容 |
| --- | --- | --- |
| 时间流 | 更新顺序明确 | 日常记录 |
| 瀑布流 | 空间利用率高 | 大量不同尺寸图片 |
| 固定网格 | 位置稳定、可留白 | 少量精选照片 |

我的选择是固定网格，因为它允许手动安排节奏：

1. 先放最重要的照片，建立视觉重心。
2. 用相邻照片的明暗和方向形成呼应。
3. 主动保留几个空格，不急着补齐。
4. 最后再添加地点、日期或一句说明。

## 一条实用的内容约束

- 每张照片只写一个主要说明
- 避免重复描述画面中已经能看到的内容
- 地点与日期使用统一格式
- 上传时准备缩略图，点击后再加载原图
- 为图片填写有意义的替代文本

---

空白不是缺少内容，它让已经出现的照片拥有停留的位置。`,
  },
  {
    title: '给网页音乐播放器保留安静的存在感',
    slug: 'a-quiet-web-music-player',
    category: '设计思考',
    excerpt: '音乐控件可以有性格，但不应该抢走阅读页面的主导权。',
    tags: ['音乐播放器', '交互设计', '网页设计'],
    publishedAt: new Date('2026-07-06T21:15:00+08:00'),
    seoTitle: '给网页音乐播放器保留安静的存在感',
    seoDescription: '从默认状态、播放反馈和列表层级讨论个人网站音乐播放器的设计。',
    content: `## 默认状态应该安静

自动播放既容易被浏览器阻止，也会打断阅读。播放器应该先展示当前歌曲与明确的播放按钮，把决定权留给访问者。真正开始播放后，再让唱片旋转、进度条移动。

## 用一个音频元素管理播放状态

Vue 组件不需要把每个原生事件都复制成复杂状态机，但当前时间、总时长与播放状态值得显式保存：

\`\`\`vue
<script setup lang="ts">
const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

async function togglePlayback() {
  const audio = audioRef.value
  if (!audio) return

  if (audio.paused) {
    await audio.play()
    isPlaying.value = true
  } else {
    audio.pause()
    isPlaying.value = false
  }
}

function syncProgress() {
  const audio = audioRef.value
  if (!audio) return
  currentTime.value = audio.currentTime
  duration.value = Number.isFinite(audio.duration) ? audio.duration : 0
}
</script>

<template>
  <audio
    ref="audioRef"
    :src="track.audioUrl"
    preload="metadata"
    @timeupdate="syncProgress"
    @loadedmetadata="syncProgress"
    @ended="playNext"
  />
</template>
\`\`\`

## 进度不是一个可以随便除的数字

音频元数据尚未加载时，duration 可能是 \`NaN\` 或 \`Infinity\`。计算进度前需要保护边界：

\`\`\`ts
const progress = computed(() => {
  if (!duration.value || !Number.isFinite(duration.value)) return 0
  return Math.min(1, currentTime.value / duration.value)
})

function seek(ratio: number) {
  const audio = audioRef.value
  if (!audio || !duration.value) return
  audio.currentTime = Math.max(0, Math.min(1, ratio)) * duration.value
}
\`\`\`

## 播放列表按需出现

播放列表属于第二层操作。平时只保留以下控制：

- 当前歌曲与作者
- 播放或暂停
- 上一首与下一首
- 当前进度与时间

需要选歌时再展开完整列表。列表关闭不应该停止音乐，路由变化是否继续播放则取决于播放器放在页面组件还是全局布局中。

## 浏览器限制必须被尊重

1. 不依赖自动播放成功。
2. 捕获 \`audio.play()\` 返回 Promise 的错误。
3. 没有音频地址时禁用播放操作，但仍允许打开外部来源。
4. 为所有图标按钮提供 aria-label。
5. 在 reduced motion 模式下停止装饰性旋转。

装饰性的唱片动画可以强化状态，但不能替代按钮文字、进度反馈和可访问语义。一个好的网页播放器应该有存在感，却不会要求每个访问者都先处理它。`,
  },
  {
    title: '减少界面信息密度的三个判断',
    slug: 'three-decisions-for-lower-ui-density',
    category: '设计思考',
    excerpt: '界面显得拥挤时，优先删除重复解释、长期状态和低频控制。',
    tags: ['界面设计', '信息密度', '体验优化'],
    publishedAt: new Date('2026-06-29T11:20:00+08:00'),
    seoTitle: '减少界面信息密度的三个判断',
    seoDescription: '用重复解释、状态持续时间和使用频率三个判断，整理拥挤的管理界面。',
    content: `## 删除重复解释

标题已经说清楚的事情，不需要再用副标题重复。按钮文字明确时，也不必在旁边长期展示操作说明。

### 一个简单判断

如果删除一句说明后，用户仍然知道：

- 这里是什么；
- 当前是什么状态；
- 下一步可以做什么；

那么这句说明大概率可以删除。

## 区分状态与反馈

| 内容 | 持续时间 | 推荐位置 |
| --- | --- | --- |
| 正在保存 | 请求期间 | 操作按钮附近 |
| 保存成功 | 2～3 秒 | Toast |
| 保存失败 | 直到处理 | 操作区域或 Toast |
| 当前发布状态 | 长期 | 内容列表与编辑页 |

“已保存”适合短暂出现，而不是永久占据页面。只有会影响下一步决策的状态，才值得持续保留。

## 整理清单

- [x] 标题移动到公共头部
- [x] 删除重复页面说明
- [x] 低频角度设置保持紧凑
- [x] 保存成功使用短暂反馈
- [ ] 后续继续检查移动端密度

## 让低频设置退后

常用操作留在第一层，旋转角度等调整可以放在条目内部。信息减少后，真正重要的内容反而更容易被看见。

---

**减少信息不是减少能力。** 它是在决定哪些能力值得一直站在用户面前。`,
  },
  {
    title: '一周一次，整理自己的数字空间',
    slug: 'weekly-digital-space-maintenance',
    category: '写作思考',
    excerpt: '维护个人网站像整理房间：不是追求永远整齐，而是建立愿意重复的小习惯。',
    tags: ['数字花园', '维护', '写作'],
    publishedAt: new Date('2026-06-21T10:10:00+08:00'),
    seoTitle: '一周一次，整理自己的数字空间',
    seoDescription: '用轻量的每周整理习惯，让个人网站持续更新而不过度消耗。',
    content: `## 更新不必很大

一次整理可以只是修正错字、补一条动态或替换一张照片。把每次更新都想成正式版本发布，会让维护变得沉重。

> 个人网站真正需要的不是持续产出，而是持续可返回。

## 我的每周整理顺序

1. 打开前台，像普通访问者一样浏览一次。
2. 处理一个最影响使用的问题。
3. 补充一条最近值得记住的动态。
4. 检查草稿中有没有可以继续写的文章。
5. 在结束前记下一件下周可以做的小事。

## 可以很快完成的小任务

- 修正一个链接或错别字
- 给旧文章补充小标题
- 删除不再使用的组件
- 压缩一张体积过大的图片
- 更新依赖前先阅读变更说明
- 为一个失败状态补充明确反馈

## 用普通文本留下入口

\`\`\`md
## 下次继续

- [ ] 给代码块加入语法高亮
- [ ] 整理移动端文章目录
- [ ] 为照片补充替代文本
\`\`\`

这份清单不需要复杂项目管理工具。它只负责降低下一次重新进入项目时的启动成本。

## 一些值得长期保留的参考

遇到不确定的 Web 行为时，我通常先查看 [MDN Web Docs](https://developer.mozilla.org/)；框架相关问题则回到 [Vue](https://vuejs.org/) 与 [Nuxt](https://nuxt.com/) 官方文档。

---

删除不再需要的组件、调整页面背景、修改一段旧文章，都是网站成长的一部分。版本记录让这些微小变化拥有连续性，而固定的整理习惯让网站始终是一个愿意再次回来的地方。`,
  },
];

export const seedMoments: SeedMoment[] = [
  {
    title: '把《鸣潮》巡回演唱会「致予新世界」的官方录播留在这里，适合戴上耳机慢慢看。',
    slug: 'moment-wuthering-waves-concert',
    publishedAt: new Date('2026-07-23T14:05:00+08:00'),
    media: {
      video: {
        source: 'bilibili',
        title: '《鸣潮》巡回演唱会「致予新世界」官方录播',
        externalUrl: 'https://www.bilibili.com/video/BV1XhKr69EDd/',
        embedUrl: 'https://player.bilibili.com/player.html?isOutside=true&bvid=BV1XhKr69EDd&p=1&autoplay=0',
      },
    },
  },
  {
    title: '今天的单曲循环，先放在这里。',
    slug: 'moment-netease-song-2749410311',
    publishedAt: new Date('2026-07-23T13:10:00+08:00'),
    media: {
      music: {
        source: 'netease',
        externalUrl: 'https://music.163.com/#/song?id=2749410311',
        embedUrl: 'https://music.163.com/outchain/player?type=2&id=2749410311&auto=0&height=66',
      },
    },
  },
  {
    title: '桌面收拾干净之后，连写字都变得轻松了一点。',
    slug: 'moment-photo-clean-desk',
    publishedAt: new Date('2026-07-23T12:25:00+08:00'),
    media: {
      photos: ['/images/moments/desk-coffee.jpg'],
    },
  },
  {
    title: '夜里走路的时候，城市的光会变成另一种界面。',
    slug: 'moment-photo-night-street',
    publishedAt: new Date('2026-07-23T11:40:00+08:00'),
    media: {
      photos: ['/images/moments/night-street.jpg'],
    },
  },
  {
    title: '咖啡、纸张和一支笔，今天先从一小页开始。',
    slug: 'moment-photo-coffee-notebook',
    publishedAt: new Date('2026-07-23T10:55:00+08:00'),
    media: {
      photos: ['/images/moments/coffee-notebook.jpg'],
    },
  },
  { title: '把前台浅色背景换成了更安静的冷灰色。', slug: 'moment-cool-gray-background', publishedAt: new Date('2026-07-23T09:20:00+08:00') },
  { title: '重新整理了顶部菜单，少一点色块，多一点呼吸感。', slug: 'moment-refined-top-navigation', publishedAt: new Date('2026-07-22T20:10:00+08:00') },
  { title: '今天把小工具的位置改成了可以直接拖动保存。', slug: 'moment-draggable-widgets', publishedAt: new Date('2026-07-21T15:40:00+08:00') },
  { title: '听着旧歌整理照片，发现空白格也很好看。', slug: 'moment-music-and-photos', publishedAt: new Date('2026-07-19T22:05:00+08:00') },
  { title: '修掉一个看起来像按钮失效、其实是 disabled 状态没有释放的问题。', slug: 'moment-disabled-switch-bug', publishedAt: new Date('2026-07-16T17:30:00+08:00') },
  { title: '写页面时越来越喜欢先删掉不必要的说明。', slug: 'moment-remove-extra-copy', publishedAt: new Date('2026-07-13T12:15:00+08:00') },
  { title: '雨停后的窗边很亮，适合慢慢写一点东西。', slug: 'moment-after-the-rain', publishedAt: new Date('2026-07-10T08:45:00+08:00') },
  { title: '给深色模式重新调了边缘亮度，终于不再像纯黑色块。', slug: 'moment-dark-theme-edges', publishedAt: new Date('2026-07-05T19:25:00+08:00') },
  { title: '个人网站最大的好处，是可以保留一些没有用途的小东西。', slug: 'moment-useless-lovely-things', publishedAt: new Date('2026-06-28T14:50:00+08:00') },
  { title: '六月结束前，给这个小站留下一条新的更新记录。', slug: 'moment-end-of-june', publishedAt: new Date('2026-06-30T23:10:00+08:00') },
];

export const additionalFriendLinks: SeedFriendLink[] = [
  {
    name: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/',
    category: '阅读',
    description: '可靠而完整的 Web 平台技术文档。',
    sortOrder: 33,
  },
  {
    name: 'Vue.js',
    url: 'https://vuejs.org/',
    category: '开发者',
    description: '渐进式 JavaScript 框架与官方文档。',
    sortOrder: 34,
  },
  {
    name: 'Nuxt',
    url: 'https://nuxt.com/',
    category: '开发者',
    description: 'Vue 全栈框架、模块生态与实践文档。',
    sortOrder: 35,
  },
  {
    name: 'TypeScript',
    url: 'https://www.typescriptlang.org/',
    category: '开发者',
    description: '为 JavaScript 提供类型系统的语言与工具链。',
    sortOrder: 36,
  },
  {
    name: 'Vite',
    url: 'https://vite.dev/',
    category: '开发者',
    description: '快速的现代前端构建工具与开发服务器。',
    sortOrder: 37,
  },
];
