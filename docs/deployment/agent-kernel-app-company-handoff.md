# agent-kernel-app 公司交付与部署准备文档

本文档用于把 `agent-kernel-app` 按公司项目交付规范整理成可部署、可接入自动化、可长期维护的形态。格式参考“深大学位日语”项目交付要求。

## 1. 产品名

产品名：

```text
agent-kernel-app
```

命名规则确认：

- 全部使用英文小写。
- 单词之间只用 `-` 连接。
- 以 `-app` 结尾，便于在产品列表、域名、CI、服务器进程中识别。

建议域名：

```text
agent-kernel-app.tranfu.com
```

## 2. 源代码交付

### GitHub 仓库

当前仓库：

```text
https://github.com/tranfu-labs/AgentKernel.git
```

公司规范建议的新仓库名：

```text
agent-kernel-app
```

建议 GitHub 仓库地址：

```text
https://github.com/tranfu-labs/agent-kernel-app
```

公开与私有：

```text
默认私有
```

说明：

- 现有远端仓库名 `AgentKernel` 不符合“全部英文小写、单词用 `-`、结尾 `-app`”的项目交付命名规范。
- 交付到公司自动化部署链路前，建议新建私有仓库 `tranfu-labs/agent-kernel-app`，或将现有仓库迁移/重命名到该规范名称。

### ZIP 文件

如果需要以 zip 文件交付，可在仓库根目录执行：

```bash
git archive --format=zip --output agent-kernel-app-source.zip HEAD
```

输出文件：

```text
agent-kernel-app-source.zip
```

注意：

- zip 应从干净 Git 提交生成，避免带入 `node_modules/`、`.next/`、`.env*`、本地日志和缓存。
- 真实私钥不得进入 zip。

## 3. README 部署入口

根目录 `README.md` 必须保留部署入口。当前部署入口为：

```text
README.md -> Deployment
```

部署细节文档：

```text
docs/deployment/agent-kernel-app-company-handoff.md
```

## 4. 技术框架约定

当前实现：

- 前端与服务端路由：Next.js `15.3.9`
- UI：React `19.1.0`
- Agent UI 协议：AG-UI / CopilotKit
- Agent runtime：Pi Agent runtime through `@agentkernel/agent-kernel`
- Monorepo：npm workspaces
- 类型系统：TypeScript

公司约定：

- 数据库：优先本地 SQLite。
- 数据库版本控制：必须有迁移文件或 schema 版本记录。
- 登录验证：基于 SQLite 的邮箱密码登录即可。
- 服务器端反向代理：项目代码不处理，服务器端统一处理。
- 端口维护：项目可先指定默认端口；部署冲突时由 @Wing 调整。
- AI 服务：暂时使用项目 `.env`/服务器 secrets 自行访问。
- JS 代码质量：使用项目内 TypeScript、测试、构建与 smoke 命令维护。

当前差距：

- 当前 `agent-kernel-app` 还没有引入 SQLite、数据库迁移和邮箱密码登录。
- 当前产品形态是 agent-native workspace/runtime foundation，主要依赖服务端内存 warm session。
- 如果公司部署要求必须有用户系统，需要新增 SQLite schema、迁移脚本、登录 API、session/cookie 策略和对应 E2E。

## 5. 私钥格式

真实私钥只允许放在：

- 本地开发：`.env.smoke`，该文件已被 `.gitignore` 忽略。
- CI：GitHub Actions repository secrets。
- 服务器：部署系统的环境变量或 secret 管理器。

提交到仓库的模板文件：

```text
.env.example
```

本项目当前需要的 AI 配置：

```bash
CLOUDAIKEY_API_KEY=
CLOUDAIKEY_BASE_URL=https://api.cloudaikey.com/v1
DATABASE_URL=file:../data/agent-kernel-dev.db
```

公司图像模型示例格式：

```bash
# Example models: image-01, image-01-live
IMAGE_MINIMAX_BASE_URL=https://api.minimaxi.com
IMAGE_GROK_API_KEY=
IMAGE_GROK_BASE_URL=
```

格式要求：

- `#` 开头的是注释。
- 等号前使用全大写和下划线。
- 等号后直接粘贴对应 API Key 或 URL。
- 非注释行整行不要有空格。
- 不要把真实 key 写入 README、docs、代码、截图或 issue。

## 6. 本地运行

安装依赖：

```bash
npm ci
```

准备本地密钥：

```bash
cp .env.example .env.smoke
```

然后填写：

```bash
CLOUDAIKEY_API_KEY=
CLOUDAIKEY_BASE_URL=https://api.cloudaikey.com/v1
```

把实际 key 直接粘贴到 `CLOUDAIKEY_API_KEY=` 后面，不要在等号两侧加空格。

启动网页：

```bash
npm run dev -w @agentkernel/web
```

默认地址：

```text
http://localhost:3000
```

## 7. 构建与验证

提交前至少运行：

```bash
npm run typecheck
npm run web:build
npm run smoke:generic
```

连通性检查：

```bash
curl -I http://localhost:3000
```

预期：

```text
HTTP/1.1 200 OK
```

## 8. GitHub 与 CI 准备

推荐仓库设置：

- 仓库：`tranfu-labs/agent-kernel-app`
- 可见性：private
- 默认分支：`main`
- 分支保护：要求 typecheck/build/smoke 通过后合并

建议 CI secrets：

```bash
CLOUDAIKEY_API_KEY=
CLOUDAIKEY_BASE_URL=https://api.cloudaikey.com/v1
DATABASE_URL=file:../data/agent-kernel-dev.db
IMAGE_MINIMAX_BASE_URL=https://api.minimaxi.com
IMAGE_GROK_API_KEY=
IMAGE_GROK_BASE_URL=
```

建议 CI 检查：

```bash
npm ci
npm run typecheck
npm run web:build
npm run smoke:generic
```

说明：

- `smoke:generic` 会创建 agent session 并做最小通路验证。
- 如果 CI 环境没有可用 AI key，应将 live smoke 标记为手动或条件执行，避免阻塞纯代码检查。

## 9. 服务器部署约定

服务器端职责：

1. 自动检测新项目仓库创建。
2. 添加域名和解析。
3. 确认 CI 已对接。
4. 在服务器本地启动项目。
5. 做简单连通性测试。
6. 添加到官网首页产品列表。

项目端职责：

1. 保持 README 和部署文档完整。
2. 提供 `.env.example`。
3. 不在代码中处理反向代理。
4. 不把真实 secrets 写进仓库。
5. 提供可重复运行的构建和验证命令。

建议生产启动方式：

```bash
npm ci
npm run build
npm run web:build
npm --workspace @agentkernel/web start
```

当前注意：

- `apps/web/package.json` 目前没有 `start` 脚本；正式部署前需要补充 `next start`。
- `apps/web/lib/agent-runtime.ts` 使用 warm session，全量生产部署应使用持久 Node 进程，不建议放到无状态 serverless。

## 10. 部署成功后的交付结果

部署完成后应得到：

1. 可访问域名，例如：

```text
agent-kernel-app.tranfu.com
```

2. 公司首页产品列表中展示：

```text
agent-kernel-app
```

3. GitHub 私有仓库完成 CI 对接。

4. 服务器上有可识别的进程名、端口、日志路径和重启方式。

## 11. 自动化环节

### 当前 Agent 侧工作流

1. 编写并验证项目。
2. 准备 GitHub 仓库与 CI。
3. 准备 README 部署入口和部署文档。
4. 准备 `.env.example` 和 GitHub secrets 名称清单。
5. 通过 `gh secret set` 配置相关 secret。

### 服务器侧工作流

1. 自动检测新项目创建。
2. 添加域名与 DNS 解析。
3. 确保 CI 已对接。
4. 拉取代码并启动本地服务。
5. 做连通性和可访问性测试。
6. 添加到官网产品列表。

### 自动优化

初次部署时建议自动产出：

1. 代码库优化建议。
2. 产品体验建议，仅限网页端。
3. 自动 E2E 测试截图和视频。

### 长期维护

1. CI 失败自动响应。
2. 添加服务器 status 告警。
3. 参考：

```text
https://www.githubstatus.com/
```

## 12. 后续 TODO List

- [ ] 新建或迁移 GitHub 私有仓库到 `tranfu-labs/agent-kernel-app`。
- [ ] 为 `apps/web/package.json` 增加生产 `start` 脚本。
- [ ] 增加 GitHub Actions CI。
- [ ] 使用 `gh secret set` 配置生产 secrets。
- [ ] 明确生产端口，默认可先使用 `3000`，冲突时由 @Wing 修改。
- [ ] 如果需要用户系统，在现有 SQLite/Prisma 基础上新增邮箱密码登录和 session 管理。
- [x] 增加数据库版本控制目录：`apps/web/prisma/migrations/`。
- [ ] 增加 E2E smoke，产出截图和视频。
- [ ] 增加部署后健康检查文档。
- [ ] 接入公司首页产品列表。

## 13. 相关开发文档

- 根 README：

```text
README.md
```

- 公司部署交付文档：

```text
docs/deployment/agent-kernel-app-company-handoff.md
```

- Web workspace 文档：

```text
apps/web/README.md
```

- CopilotKit / Agent runtime / SQL 会话集成：

```text
docs/architecture/copilotkit-pi-agent-sql-session-plan.md
```
