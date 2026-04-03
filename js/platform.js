/**
 * 玩家角色控制模块
 * 负责角色的渲染、动画和跳跃物理
 */

class Player {
    constructor(x, y, z) {
        // 位置
        this.x = x;
        this.y = y;
        this.z = z;
        
        // 速度
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        
        // 尺寸
        this.width = 25;
        this.height = 40;
        this.depth = 25;
        
        // 状态
        this.state = 'idle'; // idle, charging, jumping, landing
        this.isJumping = false;
        this.isCharging = false;
        
        // 蓄力相关
        this.chargeStartTime = 0;
        this.chargePower = 0;
        this.maxChargePower = 100;
        this.chargeRate = 80; // 每秒充能
        
        // 跳跃参数
        this.jumpForce = 0;
        this.gravity = 0.8;
        this.jumpDuration = 0;
        
        // 压缩效果（蓄力时）
        this.squashAmount = 0;
        this.maxSquash = 0.4;
        
        // 旋转角度
        this.rotation = 0;
        this.targetRotation = 0;
        
        // 动画
        this.animationTime = 0;
        this.bouncePhase = 0;
        
        // 表情状态
        this.expression = 'normal'; // normal, happy, worried
        
        // 目标平台方向
        this.targetDirection = null;
    }

    /**
     * 开始蓄力
     */
    startCharge(direction) {
        if (this.isJumping) return;
        
        this.isCharging = true;
        this.state = 'charging';
        this.chargeStartTime = Date.now();
        this.chargePower = 0;
        this.targetDirection = direction;
        this.expression = 'determined';
        
        // 播放蓄力音效
        if (window.audioManager) {
            window.audioManager.play('charge');
        }
    }

    /**
     * 更新蓄力状态
     */
    updateCharge(deltaTime) {
        if (!this.isCharging) return;
        
        const elapsed = (Date.now() - this.chargeStartTime) / 1000;
        this.chargePower = Math.min(elapsed * this.chargeRate, this.maxChargePower);
        
        // 更新压缩效果
        this.squashAmount = (this.chargePower / this.maxChargePower) * this.maxSquash;
        
        // 播放蓄力进度音效
        if (window.audioManager && Math.floor(elapsed * 10) % 2 === 0) {
            window.audioManager.playChargeProgress(this.chargePower / this.maxChargePower);
        }
    }

    /**
     * 结束蓄力，执行跳跃
     */
    endCharge() {
        if (!this.isCharging) return null;
        
        const jumpData = {
            power: this.chargePower,
            direction: this.targetDirection
        };
        
        // 重置蓄力状态
        this.isCharging = false;
        this.chargePower = 0;
        this.squashAmount = 0;
        this.state = 'jumping';
        this.isJumping = true;
        this.expression = 'excited';
        
        // 播放跳跃音效
        if (window.audioManager) {
            window.audioManager.play('jump');
        }
        
        return jumpData;
    }

    /**
     * 执行跳跃物理
     */
    jump(power, direction, targetPlatform) {
        // 计算跳跃力度
        const jumpStrength = power * 3.5;
        
        // 根据方向设置速度
        if (direction === 'right') {
            this.vx = jumpStrength * 0.7;
            this.vz = 0;
            this.targetRotation = Math.PI / 2;
        } else {
            this.vx = 0;
            this.vz = jumpStrength * 0.7;
            this.targetRotation = 0;
        }
        
        // 垂直跳跃力度
        this.vy = -jumpStrength * 0.4;
        
        // 记录起始位置
        this.startX = this.x;
        this.startZ = this.z;
        this.jumpStartTime = Date.now();
    }

    /**
     * 更新物理状态
     */
    update(deltaTime) {
        if (this.isJumping) {
            // 应用速度
            this.x += this.vx;
            this.z += this.vz;
            this.y += this.vy;
            
            // 应用重力
            this.vy += this.gravity;
            
            // 更新旋转
            this.rotation += (this.targetRotation - this.rotation) * 0.2;
            
            // 空中动画
            this.animationTime += deltaTime;
            
            // 检查是否开始下落
            if (this.vy > 0) {
                this.expression = 'worried';
            }
        }
        
        // 更新待机动画
        if (this.state === 'idle') {
            this.bouncePhase += deltaTime * 3;
        }
    }

    /**
     * 着陆
     */
    land(platformY) {
        this.y = platformY - this.height;
        this.vy = 0;
        this.vx = 0;
        this.vz = 0;
        this.isJumping = false;
        this.state = 'landing';
        this.expression = 'happy';
        
        // 重置旋转
        this.targetRotation = 0;
        
        // 播放着陆音效
        if (window.audioManager) {
            window.audioManager.play('land');
        }
        
        // 延迟恢复待机状态
        setTimeout(() => {
            this.state = 'idle';
            this.expression = 'normal';
        }, 300);
    }

    /**
     * 掉落
     */
    fall() {
        this.state = 'falling';
        this.expression = 'shocked';
        
        // 播放游戏结束音效
        if (window.audioManager) {
            window.audioManager.playGameOverSequence();
        }
    }

    /**
     * 渲染玩家角色
     */
    render(ctx, camera) {
        // 应用压缩效果
        const squashFactor = 1 - this.squashAmount;
        const stretchFactor = 1 + this.squashAmount * 0.5;
        
        const renderWidth = this.width * squashFactor;
        const renderHeight = this.height * stretchFactor;
        const renderDepth = this.depth * squashFactor;
        
        // 计算3D坐标
        const baseY = this.y - renderHeight;
        
        // 待机时的轻微弹跳
        let bounceY = 0;
        if (this.state === 'idle') {
            bounceY = Math.sin(this.bouncePhase) * 2;
        }
        
        // 计算所有顶点
        const vertices = this.calculateVertices(
            this.x, 
            baseY + bounceY, 
            this.z, 
            renderWidth, 
            renderHeight, 
            renderDepth
        );
        
        // 投影到2D
        const projected = {};
        for (let key in vertices) {
            projected[key] = this.project3Dto2D(
                vertices[key].x,
                vertices[key].y,
                vertices[key].z,
                camera
            );
        }
        
        // 渲染身体
        this.renderBody(ctx, projected);
        
        // 渲染面部特征
        this.renderFace(ctx, projected, camera);
    }

    /**
     * 计算角色顶点
     */
    calculateVertices(x, y, z, width, height, depth) {
        const hw = width / 2;
        const hd = depth / 2;
        
        return {
            // 底面
            bottomFrontLeft: { x: x - hw, y: y + height, z: z - hd },
            bottomFrontRight: { x: x + hw, y: y + height, z: z - hd },
            bottomBackLeft: { x: x - hw, y: y + height, z: z + hd },
            bottomBackRight: { x: x + hw, y: y + height, z: z + hd },
            // 顶面
            topFrontLeft: { x: x - hw, y: y, z: z - hd },
            topFrontRight: { x: x + hw, y: y, z: z - hd },
            topBackLeft: { x: x - hw, y: y, z: z + hd },
            topBackRight: { x: x + hw, y: y, z: z + hd }
        };
    }

    /**
     * 渲染身体
     */
    renderBody(ctx, projected) {
        const colors = {
            top: '#5D4E37',
            right: '#4A3F30',
            front: '#3D3428',
            highlight: '#6B5A43'
        };
        
        // 绘制顶面
        ctx.beginPath();
        ctx.moveTo(projected.topFrontLeft.x, projected.topFrontLeft.y);
        ctx.lineTo(projected.topFrontRight.x, projected.topFrontRight.y);
        ctx.lineTo(projected.topBackRight.x, projected.topBackRight.y);
        ctx.lineTo(projected.topBackLeft.x, projected.topBackLeft.y);
        ctx.closePath();
        ctx.fillStyle = colors.top;
        ctx.fill();
        ctx.strokeStyle = colors.right;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制右侧面
        ctx.beginPath();
        ctx.moveTo(projected.topFrontRight.x, projected.topFrontRight.y);
        ctx.lineTo(projected.topBackRight.x, projected.topBackRight.y);
        ctx.lineTo(projected.bottomBackRight.x, projected.bottomBackRight.y);
        ctx.lineTo(projected.bottomFrontRight.x, projected.bottomFrontRight.y);
        ctx.closePath();
        ctx.fillStyle = colors.right;
        ctx.fill();
        ctx.stroke();
        
        // 绘制前侧面
        ctx.beginPath();
        ctx.moveTo(projected.topFrontLeft.x, projected.topFrontLeft.y);
        ctx.lineTo(projected.topFrontRight.x, projected.topFrontRight.y);
        ctx.lineTo(projected.bottomFrontRight.x, projected.bottomFrontRight.y);
        ctx.lineTo(projected.bottomFrontLeft.x, projected.bottomFrontLeft.y);
        ctx.closePath();
        ctx.fillStyle = colors.front;
        ctx.fill();
        ctx.stroke();
    }

    /**
     * 渲染面部特征
     */
    renderFace(ctx, projected, camera) {
        // 计算面部中心位置（在顶面）
        const centerX = (projected.topFrontLeft.x + projected.topFrontRight.x + 
                        projected.topBackRight.x + projected.topBackLeft.x) / 4;
        const centerY = (projected.topFrontLeft.y + projected.topFrontRight.y + 
                        projected.topBackRight.y + projected.topBackLeft.y) / 4;
        
        // 计算缩放因子
        const scale = this.width / 25;
        
        // 绘制眼睛
        const eyeOffsetX = 6 * scale;
        const eyeOffsetY = -2 * scale;
        const eyeSize = 4 * scale;
        
        ctx.fillStyle = '#FFFFFF';
        
        // 左眼
        ctx.beginPath();
        ctx.arc(centerX - eyeOffsetX, centerY + eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 右眼
        ctx.beginPath();
        ctx.arc(centerX + eyeOffsetX, centerY + eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 瞳孔
        ctx.fillStyle = '#2C2416';
        const pupilSize = 2 * scale;
        
        ctx.beginPath();
        ctx.arc(centerX - eyeOffsetX + pupilSize/2, centerY + eyeOffsetY, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(centerX + eyeOffsetX + pupilSize/2, centerY + eyeOffsetY, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 根据表情绘制嘴巴
        ctx.fillStyle = '#FFE66D';
        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 1.5 * scale;
        
        const mouthY = centerY + 6 * scale;
        const mouthWidth = 8 * scale;
        
        if (this.expression === 'happy' || this.expression === 'excited') {
            // 开心的笑
            ctx.beginPath();
            ctx.arc(centerX, mouthY, mouthWidth * 0.6, 0, Math.PI);
            ctx.fillStyle = '#FFE66D';
            ctx.fill();
            ctx.stroke();
        } else if (this.expression === 'worried' || this.expression === 'shocked') {
            // 担心/震惊的O型嘴
            ctx.beginPath();
            ctx.arc(centerX, mouthY, mouthWidth * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFE66D';
            ctx.fill();
            ctx.stroke();
        } else {
            // 普通表情 - 微笑
            ctx.beginPath();
            ctx.arc(centerX, mouthY - 2, mouthWidth * 0.5, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
        
        // 腮红
        ctx.fillStyle = 'rgba(255, 181, 167, 0.6)';
        const blushSize = 5 * scale;
        const blushY = centerY + 2 * scale;
        
        ctx.beginPath();
        ctx.ellipse(centerX - eyeOffsetX - 4 * scale, blushY, blushSize, blushSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(centerX + eyeOffsetX + 4 * scale, blushY, blushSize, blushSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 如果蓄力中，显示蓄力指示器
        if (this.isCharging) {
            this.renderChargeIndicator(ctx, centerX, centerY - 30 * scale, scale);
        }
    }

    /**
     * 渲染蓄力指示器
     */
    renderChargeIndicator(ctx, x, y, scale) {
        const radius = 15 * scale;
        const progress = this.chargePower / this.maxChargePower;
        
        // 背景圆环
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3 * scale;
        ctx.stroke();
        
        // 进度圆环
        ctx.beginPath();
        ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        
        // 渐变色
        const gradient = ctx.createLinearGradient(x - radius, y, x + radius, y);
        gradient.addColorStop(0, '#FFE66D');
        gradient.addColorStop(0.5, '#FF9A8B');
        gradient.addColorStop(1, '#FF6B6B');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4 * scale;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    /**
     * 3D到2D投影
     */
    project3Dto2D(x, y, z, camera) {
        const angleX = Math.PI / 6;
        const angleZ = Math.PI / 4;
        
        const relX = x - camera.x;
        const relY = y - camera.y;
        const relZ = z - camera.z;
        
        const projectedX = (relX - relZ) * Math.cos(angleZ);
        const projectedY = relY - (relX + relZ) * Math.sin(angleZ) * Math.cos(angleX);
        
        return {
            x: projectedX + camera.screenCenterX,
            y: projectedY + camera.screenCenterY
        };
    }

    /**
     * 获取当前位置
     */
    getPosition() {
        return { x: this.x, y: this.y, z: this.z };
    }

    /**
     * 设置位置
     */
    setPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

// 导出
window.Player = Player;
