# iList - 采购清单管理系统

一个现代化的采购清单管理应用，支持商品管理、图片上传、数据导入导出等功能。

## 功能特性

- ✅ 商品信息管理（名称、分类、价格、数量、日期、渠道、备注）
- ✅ 多图片上传（最多9张，自动压缩）
- ✅ 状态管理（待发货、已发货、已收货、已完成）
- ✅ 搜索和筛选功能
- ✅ 数据导入导出（JSON格式）
- ✅ 现代化UI设计
- ✅ 响应式布局
- ✅ 数据持久化存储（Neon PostgreSQL数据库）

## 技术栈

- **前端**: HTML, CSS, JavaScript
- **后端**: Vercel Serverless Functions
- **数据库**: Neon PostgreSQL
- **部署**: Vercel

## 项目结构

```
iList/
├── api/                  # 后端API
│   ├── db.js            # 数据库连接配置
│   ├── items.js         # 商品列表API (GET/POST)
│   ├── items/[id].js    # 单个商品API (PUT/DELETE)
│   └── import.js        # 数据导入API
├── index.html            # 主页面
├── add.html              # 添加商品页面
├── app.js                # 前端JavaScript
├── styles.css            # 样式文件
├── package.json          # 项目配置
├── vercel.json           # Vercel配置
└── .env.example         # 环境变量示例
```

## 快速部署

### 1. 准备工作

1. 注册 [Vercel](https://vercel.com) 账号
2. 注册 [Neon](https://neon.tech) 数据库账号（免费）
3. 安装 Vercel CLI:
   ```bash
   npm install -g vercel
   ```

### 2. 创建 Neon 数据库

1. 登录 [Neon 控制台](https://neon.tech)
2. 点击 "New Project" 创建项目
3. 填写项目信息：
   - Project name: `ilist`
   - Database name: `neondb`（Neon 默认名称）
   - Region: 选择离您最近的区域（推荐：ap-southeast-1）
4. 创建项目后，在 Dashboard 中找到连接字符串：

**推荐使用带连接池的 URL（适合 Serverless）：**
```
postgresql://username:password@ep-xxx-pooler.region.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

**不带连接池的 URL（用于需要直接连接的场景）：**
```
postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### 3. 配置环境变量

在 Vercel 项目设置中添加环境变量：

- **Name**: `DATABASE_URL`
- **Value**: 您的 Neon 连接字符串（带连接池版本）

格式示例：
```
postgresql://neondb_owner:your_password@ep-sweet-fire-xxxxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

### 4. 部署项目

#### 方法一：使用 Vercel CLI（推荐）

```bash
# 登录 Vercel
vercel login

# 进入项目目录
cd c:\Users\shenhq\Documents\GitHub\iList

# 部署到生产环境
vercel --prod
```

#### 方法二：通过 GitHub

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入 GitHub 项目
3. 在 Vercel 项目设置中添加 `DATABASE_URL` 环境变量
4. Vercel 会自动检测配置并部署

### 5. 本地开发

```bash
# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，填入您的 DATABASE_URL
# DATABASE_URL=postgresql://username:password@host/neondb?sslmode=require

# 启动本地开发服务器
vercel dev
```

访问 `http://localhost:3000` 查看应用。

## API 接口说明

### 获取商品列表
- **URL**: `/api/items`
- **方法**: `GET`
- **返回**: 商品列表数组

### 添加商品
- **URL**: `/api/items`
- **方法**: `POST`
- **参数**: 商品对象
- **返回**: 新创建的商品对象

### 更新商品
- **URL**: `/api/items/[id]`
- **方法**: `PUT`
- **参数**: 商品ID和更新数据
- **返回**: 更新后的商品对象

### 删除商品
- **URL**: `/api/items/[id]`
- **方法**: `DELETE`
- **参数**: 商品ID
- **返回**: 成功消息

### 导入数据
- **URL**: `/api/import`
- **方法**: `POST`
- **参数**: 商品列表数组
- **返回**: 导入结果消息

## 数据库表结构

应用会自动创建以下表结构（首次访问时自动创建）：

```sql
CREATE TABLE items (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT '其他',
  status VARCHAR(50) DEFAULT '待发货',
  price DECIMAL(10, 2) DEFAULT 0,
  qty INTEGER DEFAULT 1,
  date DATE,
  shop VARCHAR(255),
  note TEXT,
  images JSONB DEFAULT '[]',
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);
```

## 数据结构

每个商品对象包含以下字段：

```javascript
{
  id: String,          // 唯一标识符
  name: String,        // 商品名称
  category: String,    // 分类（家具、家电、灯具、建材、软装、厨房、卫浴、其他）
  status: String,      // 状态（待发货、已发货、已收货、已完成）
  price: Number,       // 单价
  qty: Number,         // 数量
  date: String,        // 购买日期 (YYYY-MM-DD)
  shop: String,        // 购买渠道/店铺
  note: String,        // 备注
  images: Array,       // 图片数组（Base64格式）
  created_at: Number    // 创建时间戳
}
```

## Neon 数据库优势

- ✅ **完全免费**: 永久免费额度，无需信用卡
- ✅ **无限分支**: 可以创建多个数据库分支
- ✅ **Serverless**: 自动扩缩容，无需管理服务器
- ✅ **PostgreSQL 兼容**: 支持完整 SQL 功能
- ✅ **3GB 存储**: 免费版提供 3GB 存储空间
- ✅ **自动备份**: 数据自动备份，无需担心丢失
- ✅ **连接池**: 内置连接池，提升 Serverless 性能

## 环境变量配置示例

`.env.example` 文件内容：

```bash
# 使用带连接池的 URL（推荐）
DATABASE_URL=postgresql://neondb_owner:your_password@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require

# 或者使用不带连接池的 URL
# DATABASE_URL=postgresql://neondb_owner:your_password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

## 常见问题

### Q: 部署后页面显示空白或报错？
A: 请检查：
1. Vercel 环境变量是否正确配置
2. Neon 数据库是否已创建
3. 连接字符串是否正确（注意 sslmode=require）

### Q: 添加商品后数据不显示？
A: 可能是数据库连接问题，请查看 Vercel 日志：
```bash
vercel logs --prod
```

### Q: 图片上传失败？
A: 检查图片大小（最大 2MB），图片会自动压缩。

### Q: 如何备份数据？
A: 使用导出功能（导出为 JSON 文件），或者在 Neon 控制台创建数据库分支。

### Q: Neon 连接字符串有什么区别？
A: 
- **Pooler URL**: 带 `-pooler` 后缀，使用连接池，适合 Serverless 应用
- **Unpooled URL**: 直接连接数据库，适合需要长连接的场景

## 注意事项

1. **图片存储**: 图片以 Base64 格式存储在数据库中，建议控制图片大小（已自动压缩至最大 900px）
2. **数据限制**: Neon 免费版提供 3GB 存储，大量图片可能导致存储溢出
3. **环境变量**: 生产环境必须配置 `DATABASE_URL` 环境变量
4. **SSL连接**: Neon 要求使用 SSL 连接，连接字符串已包含 `?sslmode=require`
5. **安全**: 请勿将 `.env` 文件提交到版本控制，`.gitignore` 已配置排除

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！