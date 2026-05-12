# Voltix · 伏特前行 官网

> Voltix 品牌官方网站，展示智能充电桩、自动挪车机器人、自动充电机械臂等产品线。

**🌐 在线访问**：[voltix-prod-d9gpbrzsm7e719fc5-1321448014.tcloudbaseapp.com](https://voltix-prod-d9gpbrzsm7e719fc5-1321448014.tcloudbaseapp.com)

---

## 项目结构

```
voltix-final/
├── index.html          # 首页
├── products.html       # 产品中心
├── about.html          # 关于我们
├── partnership.html    # 合作申请
├── contact.html        # 联系我们
├── login.html          # 登录 / 注册
├── profile.html        # 个人中心
├── purchase.html       # 购买 / 报价
├── admin.html         # 管理后台
├── changelog.html      # 变更日志
├── style.css           # 全局样式
├── sw.js               # Service Worker（PWA 缓存）
├── cloudbase-init.js   # CloudBase SDK 初始化
├── nav-user.js        # 导航栏用户态
├── logo.svg            # 品牌 Logo
├── cloudbaserc.json    # CloudBase CLI 配置
└── cloudfunctions/
    └── sendSmsNotify/  # 短信通知云函数
```

---

## 技术栈

- **前端**：纯 HTML5 + CSS3 + JavaScript（ES6+），无框架依赖
- **后端**：腾讯云 CloudBase（云函数 + 数据库）
- **短信**：腾讯云 SMS
- **部署**：腾讯云 CloudBase 静态托管

---

## 本地运行

```bash
# 任意静态服务器均可，例如：
cd voltix-final
npx serve .

# 或 Python：
python3 -m http.server 8080
```

> 注：本项目依赖腾讯云 CloudBase CDN 加载 SDK，**无需安装 npm 依赖**即可在浏览器中正常运行。

---

## 部署说明

### 静态文件部署（CloudBase）

```bash
# 安装 CloudBase CLI
npm i -g @cloudbase/cli

# 登录
tcb login

# 部署静态文件
tcb hosting deploy . -e voltix-prod-d9gpbrzsm7e719fc5
```

### 云函数部署（sendSmsNotify）

需要在 CloudBase 控制台手动配置以下**环境变量**（不要写入代码）：

| 环境变量 | 说明 |
|---------|------|
| `SECRET_ID` | 腾讯云 API SecretId |
| `SECRET_KEY` | 腾讯云 API SecretKey |
| `SMS_SDK_APP_ID` | 腾讯云 SMS SdkAppId |
| `NOTIFY_PHONE` | 接收通知的手机号 |
| `APP_TPL_ID` | 合作申请短信模板 ID |
| `CONTACT_TPL_ID` | 联系我们短信模板 ID |

---

## 页面说明

| 页面 | 说明 |
|------|------|
| `index.html` | 首页，主品牌展示 + 产品入口 |
| `products.html` | 产品中心，含充电桩/机器人/机械臂 |
| `about.html` | 品牌故事与核心价值观 |
| `partnership.html` | 物业/停车场合作申请表单 |
| `contact.html` | 商务合作联系表单 |
| `purchase.html` | 产品购买与报价入口 |
| `login.html` | 用户注册 / 登录 |
| `profile.html` | 个人中心（需登录） |
| `admin.html` | 管理后台（管理员密码：`0000`，提示：`Origin0`） |
| `changelog.html` | 版本更新记录 |

---

## 管理后台

- **访问路径**：/`admin.html`
- **默认密码**：`0000`
- **功能**：查看/管理合作申请、用户留言、用户数据

---

## 版本历史

详见 [changelog.html](./changelog.html)

---

## License

Copyright © 2026 Voltix. All rights reserved.
