# 这是一套nodejs+mongodb实现的电影网站管理系统
> 技术栈 vue + vue-router + nodejs + koa2 + mongodb + nginx
>
> 整个系统需要环境 nginx（分发请求给nodejs，http2，ssl），nodejs（数据处理），mongodb（数据存储)


## 其他开源项目

* [Dart-Cms-Manage](https://github.com/abcd498936590/Dart-Cms-Manage)  =>> Dart-Cms后台管理系统页面部分
* [Dart-Cms-Flutter](https://github.com/abcd498936590/Dart-Cms-Flutter)  =>> Dart-Cms的安卓客户端，使用flutter开发
* [Dart-Cms-Script](https://github.com/abcd498936590/Dart-Cms-Script)  =>> Dart-Cms插件教程，插件使用，插件开发
* [flutter fijkplayer](https://github.com/abcd498936590/fijkplayer_skin)  =>> Flutter fijkplayer的一款皮肤
* [electron-audio-create](https://github.com/abcd498936590/electron-audio-create)  =>> 使用 React + Electron 开发的 AI 配音软件


## 免责申明
> 本项目仅供学习参考，请勿用于任何商业、非法用途。由此带来的法律责任，本人概不承担！


## 预览
<p align="center">
    <img width="380" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/dart-cms-1.png" />
    <img width="380" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/dart-cms-2.png" />
    <img width="380" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/dart-cms-3.png" />
    <img width="380" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/dart-cms-4.png" />
    <img width="380" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/dart-cms-10.png" />
    <img width="380" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/dart-cms-11.png" />
    <img width="380" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/dart-cms-12.png" />
    <img width="380" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/dart-cms-13.png" />
    <img width="380" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/dart-cms-7.png" />
    <img width="380" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/dart-cms-6.png" />
    <img width="380" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/dart-cms-flutter-1.png" />
    <img width="380" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/dart-cms-flutter-2.png" />
    <img width="380" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/dart-cms-flutter-3.png" />
    <img width="380" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/dart-cms-flutter-4.png" />
    <img src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/fijkplayer_skin-1.png" />
</p>


## 插件

Cms默认只有 封面上传七牛cdn、静态资源生成、播放源url替换 三个插件
采集插件请点击下面 ↓ 的链接，下载更多采集插件。或者自己开发采集插件
开发插件，使用插件，下载插件 => [插件教程，插件开发，安装插件](https://github.com/abcd498936590/Dart-Cms-Script)

## 懒人部署

[手拉手开发nodejs电影cms系统③：宝塔面板懒人部署](https://segmentfault.com/a/1190000022219771)

## 说明
> 要求：nodejs >=7.6 mongodb >=3.4

## 安装

``` bash
# 安装依赖
npm install

# 初始化数据（创建默认数据）
npm run build

# 全局安装 pm2 forever
npm install pm2 forever -g

# 主程序启动
pm2 start app.js -i max --name app

# 定时任务程序启动
forever start cron.js
```
## nginx 配置文件中部分配置

``` bash
server {
    listen       80;
    # http 强制跳转 https
    rewrite ^(.*)$ https://$host$1 permanent;
}
server {
    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-NginX-Proxy true;
        # 这里因为nodejs只是开了http，所以nginx转发给nodejs的请求，nodejs自己也只能识别自己开启的http，而不是https
        # 所以需要在header手动加入一个字段，告诉nodejs，当前的协议是http 或者 https
        proxy_set_header X-Proxy-Protocol "https";
        # 要代理的本地后台 代理给nodejs
        proxy_pass  http://127.0.0.1:9999;
    }
    # 监听 ssl 443 端口
    listen 443 ssl http2;
    # 这里填网站域名，开启域名验证，只允许域名访问
    server_name xxx.com;

    # 开启 ssl
    # 指定 ssl 证书路径
    ssl_certificate /etc/ssl/xxx.com_chain.crt;
    # 指定私钥文件路径
    ssl_certificate_key /etc/ssl/xxx.com_key.key;
}
```

## 系统登录

管理系统地址 http://localhost:9999/manage/index.html
用户名: root      密码: 123456

## 项目结构

``` bash
├─backup                 // 数据备份存储文件夹
│
├─build                  // 初始化数据库
│   │
│   └──initBase.js      // 数据库初始化操作
│
├─static                 // 静态文件 -- 前后端页面
│
├─script                 // 脚本目录 -- 采集脚本
│
├─methods                // 前后端逻辑处理的方法，遵循mvc模式
│   │
│   ├──manage           // 后台管理系统目录 -- 方法
│   │
│   ├──public.js        // 前端页面公共方法 -- 方法
│   │
│   └──web.js           // 前端页面方法 -- 方法
│
├─router                 // 全局路由目录 -- 接口汇总
│   │
│   ├──manage           // 后台管理系统目录 -- 路由
│   │
│   ├──manage.js        // use管理系统目录 -- 路由
│   │
│   └──web.js           // use前端展示路由 -- 路由
│
├─middleware             // 中间件目录
│   │
│   ├─router.js          // 用于验证各种路径
│   │
│   ├─service.js         // 用于验证网站开启/关闭 （前台部分）
│   │
│   └─userIp.js          // 用于处理用户ip （nginx代理或者nodejs ipv4）
│
├─utils                  // 工具方法，配置文件
│   │
│   ├─cookie             // cookie <=> session 存储中间件 > 挂载到ctx.sessin1
│   │
│   ├─token              // token <=> session 存储中间件 > 挂载到ctx.session2
│   │
│   ├─pipeline           // mongodb管道查询模型
│   │
│   ├─authToken.js       // 验证token是否有效
│   │
│   ├─baseConnect.js     // mongodb连接文件
│   │
│   ├─config.js          // 初始化数据库配置参数
│   │
│   └─tools.js           // 工具函数
│
├─app.js                 // 项目主文件 （使用pm2守护）
│
├─cron.js                // 定时任务文件 （单独使用forever守护）
```

## 捐助一下失业的我
<p align="center">
    <img width="300" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/alipay.jpg" />
    <img width="300" src="https://cdn.jsdelivr.net/gh/abcd498936590/pic@master/img/tenpay.jpg" />
</p>
