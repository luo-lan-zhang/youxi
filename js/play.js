/**
 * UI与交互管理模块
 * 负责界面切换、分数显示、粒子特效等
 */

class UIManager {
    constructor() {
        // DOM 元素引用
        this.screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            gameOver: document.getElementById('game-over-screen')
        };
        
        this.elements = {
            // 开始界面
            startBtn: document.getElementById('start-btn'),
            bestScoreValue: document.getElementById('best-score-value'),
            
            // 游戏界面
            currentScore: document.getElementById('current-score'),
            powerContainer: document.getElementById('power-container'),
            powerFill: document.getElementById('power-fill'),
            comboText: document.getElementById('combo-text'),
            comboValue: document.getElementById('combo-value'),
            particlesContainer: document.getElementById('particles-container'),
            
            // 游戏结束界面
            finalScore: document.getElementById('final-score'),
            newRecord: document.getElementById('new-record'),
            finalBestScore: document.getElementById('final-best-score'),
            jumpCount: document.getElementById('jump-count'),
            perfectCount: document.getElementById('perfect-count'),
            restartBtn: document.getElementById('restart-btn'),
            homeBtn: document.getElementById('home-btn'),
            
            // 音效控制
            soundToggle: document.getElementById('sound-toggle'),
            soundOn: document.querySelector('.sound-on'),
            soundOff: document.querySelector('.sound-off')
        };
        
        // 游戏统计数据
        this.stats = {
            score: 0,
            bestScore: this.loadBestScore(),
            jumpCount: 0,
            perfectCount: 0,
            combo: 0,
            maxCombo: 0
        };
        
        // 粒子效果颜色池
        this.particleColors = [
            '#FFB5A7',
            '#FFE66D',
            '#FF9A8B',
            '#FF6B6B',
            '#FCD5CE',
            '#BEE1E6',
            '#FFE5D9'
        ];
        
        // 初始化事件监听
        this.initEventListeners();
    }

    /**
     * 初始化事件监听
     */
    initEventListeners() {
        // 开始按钮
        this.elements.startBtn.addEventListener('click', () => {
            this.playClickSound();
            if (window.game) {
                window.game.start();
            }
        });
        
        // 重新开始按钮
        this.elements.restartBtn.addEventListener('click', () => {
            this.playClickSound();
            if (window.game) {
                window.game.restart();
            }
        });
        
        // 返回首页按钮
        this.elements.homeBtn.addEventListener('click', () => {
            this.playClickSound();
            this.showScreen('start');
            if (window.game) {
                window.game.reset();
            }
        });
        
        // 音效切换
        this.elements.soundToggle.addEventListener('click', () => {
            this.toggleSound();
        });
        
        // 初始化最高分显示
        this.updateBestScoreDisplay();
    }

    /**
     * 显示指定屏幕
     */
    showScreen(screenName) {
        // 隐藏所有屏幕
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // 显示目标屏幕
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
        }
    }

    /**
     * 更新分数显示
     */
    updateScore(score) {
        this.stats.score = score;
        
        // 动画数字变化
        this.animateNumber(this.elements.currentScore, score);
    }

    /**
     * 数字变化动画
     */
    animateNumber(element, targetValue) {
        const currentValue = parseInt(element.textContent) || 0;
        const diff = targetValue - currentValue;
        
        if (diff === 0) return;
        
        const steps = Math.min(Math.abs(diff), 10);
        const stepValue = diff / steps;
        let step = 0;
        
        const animate = () => {
            step++;
            const newValue = Math.round(currentValue + stepValue * step);
            element.textContent = newValue;
            
            if (step < steps) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = targetValue;
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * 显示蓄力条
     */
    showPowerBar() {
        this.elements.powerContainer.classList.remove('hidden');
        this.elements.powerContainer.style.opacity = '1';
    }

    /**
     * 隐藏蓄力条
     */
    hidePowerBar() {
        this.elements.powerContainer.style.opacity = '0';
        setTimeout(() => {
            this.elements.powerContainer.classList.add('hidden');
        }, 200);
    }

    /**
     * 更新蓄力条进度
     */
    updatePowerBar(progress) {
        // progress: 0-1
        const percentage = Math.min(progress * 100, 100);
        this.elements.powerFill.style.width = `${percentage}%`;
    }

    /**
     * 显示连击提示
     */
    showCombo(combo) {
        if (combo < 2) return;
        
        this.stats.combo = combo;
        this.stats.maxCombo = Math.max(this.stats.maxCombo, combo);
        
        let comboText = '';
        if (combo >= 10) {
            comboText = '🔥 传奇连击！';
        } else if (combo >= 7) {
            comboText = '⚡ 超级连击！';
        } else if (combo >= 5) {
            comboText = '✨ 完美连击！';
        } else if (combo >= 3) {
            comboText = '💫 连击！';
        } else {
            comboText = '✓ 完美！';
        }
        
        this.elements.comboValue.textContent = comboText;
        this.elements.comboText.classList.remove('hidden');
        this.elements.comboText.classList.remove('show');
        
        // 触发重新动画
        void this.elements.comboText.offsetWidth;
        
        this.elements.comboText.classList.add('show');
        
        // 播放连击音效
        if (window.audioManager) {
            if (combo >= 5) {
                window.audioManager.play('combo');
            } else {
                window.audioManager.play('perfect');
            }
        }
        
        // 创建粒子特效
        this.createParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 15);
        
        // 自动隐藏
        setTimeout(() => {
            this.elements.comboText.classList.add('hidden');
            this.elements.comboText.classList.remove('show');
        }, 1000);
    }

    /**
     * 创建粒子爆发效果
     */
    createParticleBurst(x, y, count) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = 5 + Math.random() * 10;
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const distance = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance - 30; // 向上偏移
            
            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: ${this.particleColors[Math.floor(Math.random() * this.particleColors.length)]};
                --tx: ${tx}px;
                --ty: ${ty}px;
            `;
            
            this.elements.particlesContainer.appendChild(particle);
            
            // 动画结束后移除
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    /**
     * 创建落地粒子效果
     */
    createLandingParticles(x, y, isPerfect) {
        const count = isPerfect ? 20 : 8;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = isPerfect ? 6 + Math.random() * 8 : 4 + Math.random() * 6;
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * (isPerfect ? 80 : 40);
            const tx = Math.cos(angle) * distance;
            const ty = -Math.abs(Math.sin(angle) * distance) - 20;
            
            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: ${isPerfect ? '#FFE66D' : this.particleColors[Math.floor(Math.random() * this.particleColors.length)]};
                --tx: ${tx}px;
                --ty: ${ty}px;
            `;
            
            this.elements.particlesContainer.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    /**
     * 更新统计数据
     */
    updateStats(jumpCount, perfectCount) {
        this.stats.jumpCount = jumpCount;
        this.stats.perfectCount = perfectCount;
    }

    /**
     * 显示游戏结束界面
     */
    showGameOver(finalScore, isNewRecord) {
        // 更新最终分数
        this.elements.finalScore.textContent = finalScore;
        
        // 显示/隐藏新纪录提示
        if (isNewRecord) {
            this.elements.newRecord.classList.remove('hidden');
            this.saveBestScore(finalScore);
        } else {
            this.elements.newRecord.classList.add('hidden');
        }
        
        // 更新统计数据
        this.elements.finalBestScore.textContent = this.stats.bestScore;
        this.elements.jumpCount.textContent = this.stats.jumpCount;
        this.elements.perfectCount.textContent = this.stats.perfectCount;
        
        // 显示游戏结束界面
        setTimeout(() => {
            this.showScreen('gameOver');
        }, 500);
    }

    /**
     * 重置统计数据
     */
    resetStats() {
        this.stats.score = 0;
        this.stats.jumpCount = 0;
        this.stats.perfectCount = 0;
        this.stats.combo = 0;
        this.stats.maxCombo = 0;
        
        // 重置UI
        this.elements.currentScore.textContent = '0';
        this.hidePowerBar();
    }

    /**
     * 加载最高分
     */
    loadBestScore() {
        const saved = localStorage.getItem('jumpGameBestScore');
        return saved ? parseInt(saved) : 0;
    }

    /**
     * 保存最高分
     */
    saveBestScore(score) {
        if (score > this.stats.bestScore) {
            this.stats.bestScore = score;
            localStorage.setItem('jumpGameBestScore', score.toString());
            this.updateBestScoreDisplay();
        }
    }

    /**
     * 更新最高分显示
     */
    updateBestScoreDisplay() {
        this.elements.bestScoreValue.textContent = this.stats.bestScore;
    }

    /**
     * 切换音效
     */
    toggleSound() {
        if (window.audioManager) {
            const isMuted = window.audioManager.toggleMute();
            
            if (isMuted) {
                this.elements.soundOn.classList.add('hidden');
                this.elements.soundOff.classList.remove('hidden');
            } else {
                this.elements.soundOn.classList.remove('hidden');
                this.elements.soundOff.classList.add('hidden');
            }
        }
    }

    /**
     * 播放点击音效
     */
    playClickSound() {
        if (window.audioManager) {
            window.audioManager.init();
            window.audioManager.play('click');
        }
    }

    /**
     * 初始化音频系统
     */
    initAudio() {
        if (window.audioManager) {
            window.audioManager.init();
        }
    }

    /**
     * 显示提示信息
     */
    showToast(message, duration = 2000) {
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background: rgba(93, 78, 55, 0.9);
            color: white;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            z-index: 1000;
            animation: toastFadeIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastFadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * 添加触摸反馈
     */
    addTouchFeedback(element) {
        element.addEventListener('touchstart', () => {
            element.style.transform = 'scale(0.95)';
        });
        
        element.addEventListener('touchend', () => {
            element.style.transform = '';
        });
    }
}

// 添加 Toast 动画样式
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes toastFadeIn {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes toastFadeOut {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(toastStyles);

// 导出
window.UIManager = UIManager;
