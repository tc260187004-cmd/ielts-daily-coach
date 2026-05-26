# ielts-daily-coach

个人使用的雅思每日学习教练网页。前端使用 React + Vite + TypeScript + Tailwind CSS，可部署到 GitHub Pages；登录和学习记录使用 Supabase；Gemini API 通过 Cloudflare Worker 中转，API Key 不会出现在前端代码里。

## 功能

- 邮箱登录，跨设备同步学习设置和记录
- Dashboard 显示今日任务、进度、连续学习天数、本周完成率和自动调整建议
- 每日计划按 30 / 60 / 90 / 120 分钟自动生成
- 听力：30 条本地 JSON 示例任务，每日轮换
- 词汇：100 个雅思高频词，每日 10 个，可标记掌握 / 不熟 / 错词本
- 口语：每日题目，提交英文回答后请求 Gemini 生成 AI 参考反馈
- 阅读/写作：按星期切换阅读、写作和周日复盘
- 每日总结：整理当天数据后请求 Gemini 生成总结
- 阶段复盘：支持 7 天、30 天、60 天复盘

## 本地运行

```bash
npm install
cp .env.example .env
npm run dev
```

打开本地地址后，先完成 Supabase 和 Worker 配置。

## 创建 Supabase 项目

1. 打开 [Supabase](https://supabase.com/) 并创建新项目。
2. 在 Project Settings -> API 中复制：
   - Project URL
   - anon public key
3. 在 `.env` 中填写：

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_AI_WORKER_URL=http://localhost:8787
VITE_BASE_PATH=/ielts-daily-coach/
```

## 执行 SQL

1. 进入 Supabase 项目。
2. 打开 SQL Editor。
3. 粘贴并运行 [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql)。
4. 该 migration 会创建表、索引、更新时间触发器，并开启 Row Level Security。

RLS 策略会保证每个用户只能访问自己的 `profiles` 和各类学习记录。

## 配置 Supabase Auth

1. 在 Authentication -> Providers 中启用 Email。
2. 如果你本地开发，Site URL 可先设置为 `http://localhost:5173`。
3. 部署 GitHub Pages 后，把 Site URL 或 Redirect URLs 加上：

```text
https://YOUR_GITHUB_USERNAME.github.io/ielts-daily-coach/
```

本项目使用 magic link 邮箱登录。

## 创建 Cloudflare Worker

```bash
cd worker
npm install
npx wrangler login
npx wrangler dev
```

开发阶段 Worker 默认在 `http://localhost:8787`。

## 设置 GEMINI_API_KEY Secret

在 `worker` 目录执行：

```bash
npx wrangler secret put GEMINI_API_KEY
```

然后粘贴你的 Gemini API Key。

## 设置允许访问的前端域名

编辑 [worker/wrangler.toml](worker/wrangler.toml)：

```toml
[vars]
ALLOWED_ORIGINS = "http://localhost:5173,https://YOUR_GITHUB_USERNAME.github.io"
```

如果你的 GitHub Pages 地址是项目页，来源通常仍是：

```text
https://YOUR_GITHUB_USERNAME.github.io
```

部署 Worker：

```bash
cd worker
npx wrangler deploy
```

部署后，把前端 `.env` 的 `VITE_AI_WORKER_URL` 改为 Worker 地址。

## 部署到 GitHub Pages

1. 创建 GitHub 仓库，仓库名建议使用 `ielts-daily-coach`。
2. 确认 `.env` 中：

```bash
VITE_BASE_PATH=/ielts-daily-coach/
```

3. 构建：

```bash
npm run build
```

4. 可以使用 `gh-pages` 部署：

```bash
npm run deploy
```

也可以把 `dist` 目录交给你自己的 GitHub Actions 流程发布。

## 补充听力题库

听力数据在 [src/data/listening.ts](src/data/listening.ts)。

每条任务包含：

- `id`
- `dayIndex`
- `title`
- `sourceName`
- `url`
- `topic`
- `difficulty`
- `sectionType`
- `tasks`

第一版使用占位链接。后续你只需要把 `url` 和标题替换为真实材料即可，页面会按日期自动轮换。

## 补充词汇题库

词汇数据在 [src/data/vocabulary.ts](src/data/vocabulary.ts)。

每个词包含：

- `word`
- `meaning_cn`
- `example_en`
- `example_cn`
- `tag`

当前按每天 10 个词轮换。后续添加更多词时，尽量保持总数能被 10 整除。

## Gemini 接口

前端只请求 Cloudflare Worker：

- `POST /api/speaking-feedback`
- `POST /api/daily-summary`
- `POST /api/stage-review`

Worker 使用 `env.GEMINI_API_KEY` 调用 `gemini-2.5-flash`，并要求 Gemini 返回严格 JSON，不返回 Markdown。

## 注意

- 口语反馈页面明确显示：AI 反馈仅供学习参考，不等同于真实雅思考官评分。
- 第一版不包含付费、社区、排行榜、录音识别、自动爬虫、音频上传、复杂后台或移动端 App。
