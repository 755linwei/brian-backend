# =========构建阶段 build-stage 安装依赖、编译TS=========
FROM node:22 AS build-stage
WORKDIR /app

# 全局安装pnpm
RUN npm install -g pnpm@11.5.2

# 优先复制依赖文件，利用docker缓存
COPY package.json pnpm-lock.yaml ./

# 安装全部依赖 dev+prod，放行argon2脚本
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds --registry=https://registry.npmmirror.com

# 复制全部业务源码
COPY . .

# 执行nest build，生成dist产物
RUN pnpm run build

# =========生产运行阶段 production-stage =========
FROM node:22 AS production-stage
WORKDIR /app

VOLUME [ "/app/logs" ]
EXPOSE 13000

# 从构建阶段拷贝编译产物dist
COPY --from=build-stage /app/dist ./dist
# 拷贝构建阶段已经装好的生产依赖node_modules
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/package.json ./

# 运行，注意：start:prod脚本是node直接执行dist，不需要npm/pnpm
CMD ["node", "dist/src/main.js"]
