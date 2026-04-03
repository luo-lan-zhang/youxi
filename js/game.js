🎮 跳一跳 - 温暖治愈版

一个基于原生 JavaScript + Canvas 开发的 3D 视角跳跃类休闲游戏。

🎯 游戏玩法

蓄力：点击或触摸屏幕并按住，角色会压缩蓄力
跳跃：松开后角色跳跃，蓄力时间越长跳得越远
得分：成功跳到方块上得 1 分，跳到中心区域得 2 分（完美跳跃）
连击：连续完美跳跃可获得连击加分和特效

✨ 特色功能

🎨 温暖治愈配色：柔和的马卡龙色系，让人心情愉悦
🎵 程序化音效：使用 Web Audio API 生成，无需外部音频文件
🎭 表情系统：角色会根据状态变化表情（开心/担心/震惊）
✨ 粒子特效：完美跳跃时的华丽粒子爆发效果
📱 响应式设计：完美适配手机和电脑
💾 本地存档：最高分自动保存到本地

🛠️ 技术栈

前端：HTML5 + CSS3 + JavaScript (ES6+)
渲染：Canvas 2D API
3D效果：等距投影（Isometric Projection）
音频：Web Audio API

📂 项目结构

plaintext
jump-game/
├── index.html          # 游戏主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── game.js         # 游戏核心逻辑
│   ├── player.js       # 玩家角色控制
│   ├── platform.js     # 平台生成与管理
│   ├── audio.js        # 音效管理
│   └── ui.js           # 界面与交互
└── README.md           # 项目说明


🚀 部署到 GitHub Pages

方法一：直接上传

在 GitHub 创建新仓库（如 jump-game）
点击 "Add file" → "Upload files"
将 jump-game 文件夹内所有文件拖拽上传
进入仓库 Settings → Pages
Source 选择 main 分支，保存
等待部署完成，访问 https://你的用户名.github.io/jump-game/

方法二：使用 Git 命令

bash
# 创建仓库
git init
git add .
git commit -m "Initial commit: Jump Game"

# 关联远程仓库
git remote add origin https://github.com/你的用户名/jump-game.git
git branch -M main
git push -u origin main

# 在 GitHub 仓库设置中启用 Pages


🎮 本地运行

直接用浏览器打开 index.html 即可运行游戏。

或者使用本地服务器：

bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js
npx serve

# 使用 VS Code Live Server 插件
右键 index.html → Open with Live Server


🎨 自定义修改

修改配色

在 css/style.css 中修改 CSS 变量：

css
:root {
    --primary-color: #FF9A8B;      /* 主色调 */
    --secondary-color: #FF6B6B;    /* 次要色 */
    --accent-color: #FFE66D;       /* 强调色 */
    /* ... 更多颜色配置 */
}


修改平台颜色

在 js/platform.js 中修改 colorPalette 数组：

javascript
this.colorPalette = [
    '#FFB5A7', // 桃粉
    '#FCD5CE', // 浅桃
    // ... 添加更多颜色
];


调整游戏难度

在 js/platform.js 中修改：

javascript
this.minSize = 60;       // 平台最小尺寸
this.maxSize = 120;      // 平台最大尺寸
this.minDistance = 80;   // 平台最小间距
this.maxDistance = 200;  // 平台最大间距


📝 更新日志

v1.0.0 (2026-04-03)

✅ 完整游戏功能实现
✅ 3D 等距视角渲染
✅ 温暖治愈配色方案
✅ 程序化音效系统
✅ 粒子特效
✅ 本地最高分存储

📄 开源协议

MIT License

🙏 致谢

灵感来源于经典跳跃类游戏，采用原创设计与代码实现。

🎮 祝你游戏愉快！