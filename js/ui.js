/**
 * 游戏核心逻辑模块
 * 负责游戏主循环、输入处理、碰撞检测等
 */

class Game {
    constructor() {
        // Canvas 相关
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏状态
        this.state = 'idle'; // idle, playing, gameover
        this.isPaused = false;
        
        // 时间管理
        this.lastTime = 0;
        this.deltaTime = 0;
        this.gameTime = 0;
        
        // 分数与统计
        this.score = 0;
        this.jumpCount = 0;
        this.perfectCount = 0;
        this.combo = 0;
        
        // 游戏对象
        this.player = null;
        this.platformManager = null;
        this.uiManager = null;
        
        // 相机
        this.camera = {
            x: 0,
            y: 0,
            z: 0,
            targetX: 0,
            targetY: 0,
            targetZ: 0,
            screenCenterX: 0,
            screenCenterY: 0,
            smoothing: 0.08
        };
        
        // 输入状态
        this.isCharging = false;
        this.chargeStartTime = 0;
        
        // 下一个平台的方向
        this.nextDirection = 'right'; // 'right' 或 'forward'
        
        // 绑定方法
        this.gameLoop = this.gameLoop.bind(this);
        this.handleStartCharge = this.handleStartCharge.bind(this);
        this.handleEndCharge = this.handleEndCharge.bind(this);
        this.handleResize = this.handleResize.bind(this);
        
        // 初始化
        this.init();
    }

    /**
     * 初始化游戏
     */
    init() {
        // 设置 Canvas 尺寸
        this.handleResize();
        window.addEventListener('resize', this.handleResize);
        
        // 创建管理器
        this.uiManager = new UIManager();
        this.platformManager = new PlatformManager();
        
        // 创建玩家
        this.player = new Player(0, 0, 0);
        
        // 绑定输入事件
        this.bindInputEvents();
        
        // 初始化音频
        this.uiManager.initAudio();
        
        // 显示开始界面
        this.uiManager.showScreen('start');
        
        console.log('🎮 游戏初始化完成');
    }

    /**
     * 绑定输入事件
     */
    bindInputEvents() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', this.handleStartCharge);
        this.canvas.addEventListener('mouseup', this.handleEndCharge);
        this.canvas.addEventListener('mouseleave', this.handleEndCharge);
        
        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStartCharge(e);
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEndCharge(e);
        }, { passive: false });
        
        this.canvas.addEventListener('touchcancel', this.handleEndCharge);
        
        // 键盘事件（可选）
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.state === 'playing' && !this.isCharging) {
                this.handleStartCharge(e);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.isCharging) {
                this.handleEndCharge(e);
            }
        });
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        
        this.ctx.scale(dpr, dpr);
        
        // 更新相机中心
        this.camera.screenCenterX = window.innerWidth / 2;
        this.camera.screenCenterY = window.innerHeight * 0.55;
    }

    /**
     * 开始游戏
     */
    start() {
        // 重置游戏状态
        this.reset();
        
        // 初始化平台
        this.platformManager.init(0, 400, 0);
        
        // 初始化玩家位置
        const startPlatform = this.platformManager.getCurrentPlatform();
        this.player.setPosition(
            startPlatform.x,
            startPlatform.y - this.player.height,
            startPlatform.z
        );
        
        // 初始化相机
        this.updateCameraTarget();
        this.camera.x = this.camera.targetX;
        this.camera.y = this.camera.targetY;
        this.camera.z = this.camera.targetZ;
        
        // 初始化方向
        this.updateNextDirection();
        
        // 切换到游戏界面
        this.uiManager.showScreen('game');
        
        // 开始游戏循环
        this.state = 'playing';
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
        
        console.log('🎯 游戏开始！');
    }

    /**
     * 重置游戏
     */
    reset() {
        this.state = 'idle';
        this.score = 0;
        this.jumpCount = 0;
        this.perfectCount = 0;
        this.combo = 0;
        this.isCharging = false;
        
        this.uiManager.resetStats();
    }

    /**
     * 重新开始游戏
     */
    restart() {
        this.start();
    }

    /**
     * 游戏主循环
     */
    gameLoop(currentTime) {
        if (this.state !== 'playing') return;
        
        // 计算时间差
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 限制 deltaTime 防止卡顿
        this.deltaTime = Math.min(this.deltaTime, 0.1);
        
        // 更新游戏时间
        this.gameTime += this.deltaTime;
        
        // 更新
        this.update(this.deltaTime);
        
        // 渲染
        this.render();
        
        // 继续循环
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * 更新游戏状态
     */
    update(deltaTime) {
        // 更新玩家
        this.player.update(deltaTime);
        
        // 更新平台
        this.platformManager.update(deltaTime);
        
        // 更新蓄力
        if (this.isCharging && !this.player.isJumping) {
            this.player.updateCharge(deltaTime);
            
            // 更新UI蓄力条
            const progress = this.player.chargePower / this.player.maxChargePower;
            this.uiManager.updatePowerBar(progress);
        }
        
        // 检查跳跃状态
        if (this.player.isJumping) {
            this.checkLanding();
        }
        
        // 更新相机
        this.updateCamera();
    }

    /**
     * 渲染游戏画面
     */
    render() {
        const ctx = this.ctx;
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 绘制背景
        this.renderBackground(ctx, width, height);
        
        // 渲染平台
        this.platformManager.render(ctx, this.camera);
        
        // 渲染玩家
        this.player.render(ctx, this.camera);
        
        // 渲染方向指示器
        if (!this.player.isJumping) {
            this.renderDirectionIndicator(ctx);
        }
    }

    /**
     * 渲染背景
     */
    renderBackground(ctx, width, height) {
        // 渐变背景
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#FFF5F0');
        gradient.addColorStop(0.5, '#FFE8E0');
        gradient.addColorStop(1, '#FFD9CC');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // 装饰性云朵
        this.renderClouds(ctx, width, height);
    }

    /**
     * 渲染装饰性云朵
     */
    renderClouds(ctx, width, height) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        
        // 云朵位置基于相机偏移
        const offset = (this.camera.x + this.camera.z) * 0.1;
        
        // 云朵1
        this.drawCloud(ctx, (100 + offset * 0.5) % (width + 200) - 100, 80, 40);
        
        // 云朵2
        this.drawCloud(ctx, (width - 150 + offset * 0.3) % (width + 200) - 100, 120, 30);
        
        // 云朵3
        this.drawCloud(ctx, (width / 2 + offset * 0.4) % (width + 200) - 100, 60, 35);
    }

    /**
     * 绘制单个云朵
     */
    drawCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
        ctx.arc(x + size * 1.5, y, size * 0.8, 0, Math.PI * 2);
        ctx.arc(x + size * 0.5, y + size * 0.3, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 渲染方向指示器
     */
    renderDirectionIndicator(ctx) {
        const nextPlatform = this.platformManager.getNextPlatform();
        if (!nextPlatform) return;
        
        const currentPlatform = this.platformManager.getCurrentPlatform();
        
        // 计算方向
        const dx = nextPlatform.x - currentPlatform.x;
        const dz = nextPlatform.z - currentPlatform.z;
        
        // 确定方向
        let direction = dx > 0 ? 'right' : 'forward';
        
        // 在玩家位置绘制箭头
        const playerPos = this.player.getPosition();
        const screenPos = this.project3Dto2D(
            playerPos.x,
            playerPos.y - 60,
            playerPos.z
        );
        
        // 绘制箭头
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        
        if (direction === 'right') {
            ctx.rotate(-Math.PI / 4);
        } else {
            ctx.rotate(Math.PI / 4);
        }
        
        // 箭头动画
        const bounce = Math.sin(this.gameTime * 5) * 5;
        ctx.translate(bounce, 0);
        
        ctx.fillStyle = 'rgba(255, 154, 139, 0.8)';
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.8)';
        ctx.lineWidth = 2;
        
        // 绘制箭头形状
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-5, -10);
        ctx.lineTo(-5, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }

    /**
     * 处理开始蓄力
     */
    handleStartCharge(e) {
        if (this.state !== 'playing') return;
        if (this.player.isJumping) return;
        
        this.isCharging = true;
        this.chargeStartTime = Date.now();
        
        // 确定跳跃方向
        this.updateNextDirection();
        
        // 开始玩家蓄力
        this.player.startCharge(this.nextDirection);
        
        // 显示蓄力条
        this.uiManager.showPowerBar();
    }

    /**
     * 处理结束蓄力
     */
    handleEndCharge(e) {
        if (!this.isCharging) return;
        
        this.isCharging = false;
        
        // 隐藏蓄力条
        this.uiManager.hidePowerBar();
        
        // 执行跳跃
        const jumpData = this.player.endCharge();
        if (jumpData) {
            this.performJump(jumpData);
        }
    }

    /**
     * 执行跳跃
     */
    performJump(jumpData) {
        const nextPlatform = this.platformManager.getNextPlatform();
        
        this.player.jump(
            jumpData.power,
            jumpData.direction,
            nextPlatform
        );
        
        this.jumpCount++;
    }

    /**
     * 更新下一个方向
     */
    updateNextDirection() {
        const nextPlatform = this.platformManager.getNextPlatform();
        if (!nextPlatform) return;
        
        const currentPlatform = this.platformManager.getCurrentPlatform();
        
        const dx = Math.abs(nextPlatform.x - currentPlatform.x);
        const dz = Math.abs(nextPlatform.z - currentPlatform.z);
        
        this.nextDirection = dx > dz ? 'right' : 'forward';
    }

    /**
     * 检查着陆
     */
    checkLanding() {
        const playerPos = this.player.getPosition();
        
        // 检查是否开始下落
        if (this.player.vy < 0) return;
        
        // 检查是否落在平台上
        const landingResult = this.platformManager.checkLanding(
            playerPos.x,
            playerPos.z
        );
        
        // 获取当前平台的高度
        const currentPlatform = this.platformManager.getCurrentPlatform();
        const nextPlatform = this.platformManager.getNextPlatform();
        
        if (landingResult.landed && nextPlatform) {
            // 成功着陆
            this.player.land(nextPlatform.y - this.player.height);
            
            // 前进到下一个平台
            this.platformManager.advanceToNext();
            
            // 计分
            let points = 1;
            this.combo++;
            
            if (landingResult.isPerfect) {
                points = 2;
                this.perfectCount++;
                
                // 完美落地粒子效果
                const screenPos = this.project3Dto2D(playerPos.x, playerPos.y, playerPos.z);
                this.uiManager.createLandingParticles(screenPos.x, screenPos.y, true);
            } else {
                // 普通落地粒子效果
                const screenPos = this.project3Dto2D(playerPos.x, playerPos.y, playerPos.z);
                this.uiManager.createLandingParticles(screenPos.x, screenPos.y, false);
            }
            
            // 连击加分
            if (this.combo >= 2) {
                points += Math.floor(this.combo / 2);
            }
            
            this.score += points;
            this.uiManager.updateScore(this.score);
            this.uiManager.updateStats(this.jumpCount, this.perfectCount);
            
            // 显示连击提示
            if (landingResult.isPerfect) {
                this.uiManager.showCombo(this.combo);
            }
            
            // 更新相机目标
            this.updateCameraTarget();
            
            // 更新下一个方向
            this.updateNextDirection();
            
        } else if (playerPos.y > 500) {
            // 掉落，游戏结束
            this.gameOver();
        }
    }

    /**
     * 更新相机目标位置
     */
    updateCameraTarget() {
        const currentPlatform = this.platformManager.getCurrentPlatform();
        
        if (currentPlatform) {
            this.camera.targetX = currentPlatform.x;
            this.camera.targetY = currentPlatform.y - 200;
            this.camera.targetZ = currentPlatform.z;
        }
    }

    /**
     * 更新相机位置
     */
    updateCamera() {
        // 平滑跟随
        this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothing;
        this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.smoothing;
        this.camera.z += (this.camera.targetZ - this.camera.z) * this.camera.smoothing;
    }

    /**
     * 游戏结束
     */
    gameOver() {
        this.state = 'gameover';
        this.player.fall();
        
        // 检查是否新纪录
        const isNewRecord = this.score > this.uiManager.stats.bestScore;
        
        // 显示游戏结束界面
        setTimeout(() => {
            this.uiManager.showGameOver(this.score, isNewRecord);
        }, 800);
        
        console.log(`游戏结束！得分: ${this.score}`);
    }

    /**
     * 3D坐标转2D屏幕坐标
     */
    project3Dto2D(x, y, z) {
        const angleX = Math.PI / 6;
        const angleZ = Math.PI / 4;
        
        const relX = x - this.camera.x;
        const relY = y - this.camera.y;
        const relZ = z - this.camera.z;
        
        const projectedX = (relX - relZ) * Math.cos(angleZ);
        const projectedY = relY - (relX + relZ) * Math.sin(angleZ) * Math.cos(angleX);
        
        return {
            x: projectedX + this.camera.screenCenterX,
            y: projectedY + this.camera.screenCenterY
        };
    }
}

// 游戏启动
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
