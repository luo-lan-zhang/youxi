// 获取HTML中的元素（和index.html对应，不能错）
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // 画布绘图核心
const jumpButton = document.getElementById('jumpButton');

// 微信跳一跳核心参数（贴合原版手感）
const GRAVITY = 9.8; // 重力加速度，模拟真实跳跃
const JUMP_ANGLE = 45 * Math.PI / 180; // 固定跳跃角度，和微信一致
const DISTANCE_FACTOR = 0.75; // 按压时间和跳跃距离的比例（关键，调手感）
const TIME_OFFSET = 5; // 避免误触的时间偏移

// 玩家（小人）对象：位置、大小、速度
let player = {
    x: 100, // 初始x坐标
    y: 300, // 初始y坐标（落在第一个平台上）
    width: 30, // 小人宽度
    height: 30, // 小人高度
    velocityX: 0, // 水平速度
    velocityY: 0, // 垂直速度
    isJumping: false, // 是否正在跳跃（防止连续跳跃）
    scale: 1 // 缩放（按压时轻微缩小，反馈手感）
};

// 平台对象：和微信跳一跳一样，随机生成，有普通/特殊平台
let platforms = [];
let currentPlatformIndex = 0; // 当前所在平台索引

// 得分系统（贴合微信原版规则）
let score = 0;
let centerHitStreak = 0; // 连续命中中心的次数（连击加分）

// 离屏画布：预渲染背景，优化手机端流畅度（避免卡顿）
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

// 预渲染背景（一次渲染，反复使用，提升性能）
function preRenderBackground() {
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    
    // 渐变背景（贴合微信跳一跳浅色背景）
    const gradient = offscreenCtx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#89f7fe'); // 浅蓝
    gradient.addColorStop(1, '#66a6ff'); // 深蓝
    offscreenCtx.fillStyle = gradient;
    offscreenCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 地面（白色，和微信一致）
    offscreenCtx.fillStyle = '#ffffff';
    offscreenCtx.fillRect(0, 300, canvas.width, 100);
}

// 初始化游戏（页面加载时执行，重置所有状态）
function initGame() {
    adaptScreen(); // 适配手机屏幕
    preRenderBackground(); // 预渲染背景
    generatePlatforms(); // 生成平台
    
    // 重置玩家状态
    player.x = 100;
    player.y = 300;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isJumping = false;
    player.scale = 1;
    
    // 重置得分
    score = 0;
    centerHitStreak = 0;
    
    // 更新UI（得分、关卡）
    updateUI();
}

// 生成平台（贴合微信跳一跳：随机间距、特殊平台随机出现）
function generatePlatforms() {
    platforms = [];
    let x = 50; // 第一个平台的x坐标
    
    // 生成10个平台（可修改数量，越多关卡越长）
    for (let i = 0; i < 10; i++) {
        // 随机平台间距（150-250像素，和微信手感一致）
        const gap = Math.random() * 100 + 150;
        // 随机平台类型（普通/特殊）
        const type = getRandomPlatformType(i);
        
        platforms.push({
            x: x,
            y: 300, // 所有平台在同一高度，和微信一致
            width: 100, // 平台宽度
            height: 20, // 平台高度
            type: type // 平台类型（普通/音乐盒/便利店等）
        });
        
        x += gap; // 下一个平台的x坐标（右移）
    }
}

// 随机生成平台类型（关卡越靠后，特殊平台越多）
function getRandomPlatformType(index) {
    const random = Math.random();
    
    // 60% 概率是普通平台
    if (random < 0.6) {
        return 'normal';
    }
    
    // 关卡越靠后，特殊平台概率越高（最高30%）
    const specialProb = Math.min(0.3, index * 0.02);
    
    if (random < 0.6 + specialProb) {
        // 特殊平台类型（和微信跳一跳一致）
        const types = ['music-box', 'convenience-store', 'magic-cube', 'manhole'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    return 'normal';
}

// 跳跃核心函数（按压时间 → 跳跃距离，贴合微信手感）
function jump(pressDuration) {
    if (player.isJumping) return; // 正在跳跃时，不允许再次跳跃
    
    // 根据按压时间计算跳跃距离（非线性映射，和微信一致）
    const distance = (pressDuration - TIME_OFFSET) / DISTANCE_FACTOR;
    const velocity = distance * 10; // 按压时间 → 初始速度
    
    // 分解速度（水平+垂直，抛物线运动）
    player.velocityX = velocity * Math.cos(JUMP_ANGLE);
    player.velocityY = velocity * Math.sin(JUMP_ANGLE);
    
    player.isJumping = true; // 标记为正在跳跃
    jumpLoop(); // 启动跳跃动画
}

// 跳跃动画循环（模拟抛物线，重力下落）
function jumpLoop() {
    if (!player.isJumping) return; // 停止跳跃时，退出循环
    
    // 更新玩家位置（水平+垂直）
    player.x += player.velocityX * 0.1;
    player.y -= player.velocityY * 0.1;
    
    // 应用重力（垂直速度递减，模拟下落）
    player.velocityY -= GRAVITY * 0.1;
    
    // 检测落地（落到地面/平台）
    if (player.y >= 300) {
        player.y = 300; // 固定在地面高度
        player.isJumping = false; // 标记为停止跳跃
        checkLanding(); // 检查是否落在平台上
    }
    
    // 循环执行（动画流畅）
    requestAnimationFrame(jumpLoop);
}

// 检查落点（核心：判断是否落在平台上，贴合微信判定规则）
function checkLanding() {
    const currentPlatform = platforms[currentPlatformIndex]; // 当前所在平台
    
    // 碰撞检测：判断玩家是否落在平台上
    if (checkCollision(player, currentPlatform)) {
        // 计算落点精度（是否命中平台中心）
        const accuracy = calculateLandingAccuracy(currentPlatform);
        
        // 命中中心（精度≥80%），连击加分
        if (accuracy >= 80) {
            centerHitStreak++;
            score += centerHitStreak * 2; // 连击加分：2、4、6...最高32分
            if (centerHitStreak >= 16) {
                score += 32; // 连续16次后，每次加32分（和微信一致）
            }
        } else {
            // 未命中中心，加1分，重置连击
            score += 1;
            centerHitStreak = 0;
        }
        
        // 进入下一个平台
        currentPlatformIndex++;
        
        // 所有平台跳完，游戏胜利
        if (currentPlatformIndex >= platforms.length) {
            alert('游戏胜利！最终得分: ' + score);
            initGame(); // 重置游戏，重新开始
        }
    } else {
        // 未落在平台上，游戏失败
        alert('游戏失败！最终得分: ' + score);
        initGame(); // 重置游戏，重新开始
    }
    
    updateUI(); // 更新得分和关卡显示
}

// 碰撞检测（矩形包围盒，精准判定，避免误判）
function checkCollision(player, platform) {
    return (player.x + player.width >= platform.x && // 玩家右边缘 ≥ 平台左边缘
            player.x <= platform.x + platform.width && // 玩家左边缘 ≤ 平台右边缘
            player.y + player.height >= platform.y && // 玩家下边缘 ≥ 平台上边缘
            player.y <= platform.y + platform.height); // 玩家上边缘 ≤ 平台下边缘
}

// 计算落点精度（是否命中平台中心，贴合微信加分规则）
function calculateLandingAccuracy(platform) {
    // 玩家中心x坐标
    const playerCenterX = player.x + player.width / 2;
    // 平台中心x坐标
    const platformCenterX = platform.x + platform.width / 2;
    
    // 计算偏移量（玩家中心和平台中心的距离）
    const offset = Math.abs(playerCenterX - platformCenterX);
    const maxOffset = platform.width / 2; // 最大偏移量（平台一半宽度）
    
    // 精度百分比（0-100%）
    return (1 - offset / maxOffset) * 100;
}

// 更新UI（得分、关卡）
function updateUI() {
    document.querySelector('.score').textContent = `得分: ${score}`;
    document.querySelector('.level').textContent = `关卡: ${currentPlatformIndex + 1}`;
}

// 触摸事件处理（手机端核心，支持长按蓄力，贴合微信操作）
let touchStart = null; // 触摸开始时间（用于计算按压时长）

// 触摸开始（长按蓄力）
jumpButton.addEventListener('touchstart', (event) => {
    event.preventDefault(); // 禁止默认行为（避免手机页面滚动）
    if (touchStart) return; // 防止重复触摸
    
    touchStart = new Date().getTime(); // 记录触摸开始时间
});

// 触摸结束（松开跳跃）
jumpButton.addEventListener('touchend', (event) => {
    event.preventDefault(); // 禁止默认行为
    if (!touchStart) return; // 没有触摸开始，不执行
    
    // 计算按压时长（毫秒）
    const duration = new Date().getTime() - touchStart;
    if (duration > 50) { // 按压时间≥50ms，才触发跳跃（避免误触）
        jump(duration);
    }
    
    touchStart = null; // 重置触摸开始时间
});

// 鼠标事件处理（电脑端测试用，和手机端操作一致）
jumpButton.addEventListener('mousedown', () => {
    touchStart = new Date().getTime();
});
jumpButton.addEventListener('mouseup', () => {
    if (!touchStart) return;
    const duration = new Date().getTime() - touchStart;
    if (duration > 50) {
        jump(duration);
    }
    touchStart = null;
});

// 屏幕适配（核心：手机端自动缩放，确保不同手机都能正常显示）
function adaptScreen() {
    const screenWidth = window.innerWidth; // 手机屏幕宽度
    canvas.width = screenWidth; // 画布宽度 = 屏幕宽度
    canvas.height = screenWidth * (600 / 400); // 保持宽高比（和微信跳一跳一致）
    
    preRenderBackground(); // 重新渲染背景（适配新尺寸）
}

// 渲染循环（每帧绘制，确保游戏流畅）
function render() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制预渲染的背景（提升性能，手机端不卡顿）
    ctx.drawImage(offscreenCanvas, 0, 0);
    
    // 绘制玩家（红色小人，贴合微信跳一跳）
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // 绘制平台（不同类型平台不同颜色，贴合微信）
    platforms.forEach(platform => {
        // 根据平台类型设置颜色
        switch (platform.type) {
            case 'music-box': // 音乐盒（黄色）
                ctx.fillStyle = '#ffcc66';
                break;
            case 'convenience-store': // 便利店（绿色）
                ctx.fillStyle = '#66cc99';
                break;
            case 'magic-cube': // 魔方（粉色）
                ctx.fillStyle = '#ff99cc';
                break;
            case 'manhole': // 井盖（灰色）
                ctx.fillStyle = '#999999';
                break;
            default: // 普通平台（浅蓝色）
                ctx.fillStyle = '#89f7fe';
        }
        // 绘制平台
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
    
    // 循环渲染（60帧/秒，流畅不卡顿）
    requestAnimationFrame(render);
}

// 性能监控（调试用，显示帧率，确保手机端流畅）
let lastFrameTime = 0;
let frameCount = 0;
function updateFPS() {
    const currentTime = performance.now();
    if (currentTime - lastFrameTime >= 1000) {
        document.querySelector('.fps-display').textContent = `FPS: ${frameCount}`;
        frameCount = 0;
        lastFrameTime = currentTime;
    }
    frameCount++;
}

// 页面加载完成后，启动游戏
window.addEventListener('load', () => {
    adaptScreen(); // 适配屏幕
    initGame(); // 初始化游戏
    render(); // 启动渲染循环
    
    // 每秒更新一次帧率
    setInterval(updateFPS, 100);
});

// 手机旋转（横屏/竖屏）时，重新适配屏幕
window.addEventListener('resize', adaptScreen);
window.addEventListener('orientationchange', adaptScreen);