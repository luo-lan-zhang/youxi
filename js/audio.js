/**
 * 音效管理模块
 * 使用 Web Audio API 生成程序化音效，无需外部音频文件
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.isMuted = false;
        this.isInitialized = false;
        
        // 音量设置
        this.masterVolume = 0.5;
        this.sfxVolume = 0.6;
        this.musicVolume = 0.3;
        
        // 音效参数配置
        this.sounds = {
            jump: {
                frequency: 400,
                duration: 0.15,
                type: 'sine',
                slide: 600
            },
            land: {
                frequency: 200,
                duration: 0.1,
                type: 'triangle',
                slide: 150
            },
            perfect: {
                frequencies: [523.25, 659.25, 783.99], // C5, E5, G5 和弦
                duration: 0.3,
                type: 'sine'
            },
            combo: {
                frequencies: [659.25, 783.99, 987.77, 1046.50], // E5, G5, B5, C6
                duration: 0.4,
                type: 'sine'
            },
            gameOver: {
                frequency: 200,
                duration: 0.5,
                type: 'sawtooth',
                slide: 100
            },
            charge: {
                frequency: 300,
                duration: 0.05,
                type: 'sine'
            },
            click: {
                frequency: 800,
                duration: 0.05,
                type: 'square'
            },
            score: {
                frequencies: [523.25, 587.33, 659.25], // C5, D5, E5
                duration: 0.15,
                type: 'sine'
            }
        };
    }

    /**
     * 初始化音频上下文（需要用户交互后调用）
     */
    init() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isInitialized = true;
            console.log('🔊 音频系统已初始化');
        } catch (e) {
            console.warn('音频初始化失败:', e);
        }
    }

    /**
     * 恢复音频上下文（移动端需要）
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * 切换静音状态
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    /**
     * 设置静音
     */
    setMute(muted) {
        this.isMuted = muted;
    }

    /**
     * 播放音效
     * @param {string} soundName - 音效名称
     * @param {object} options - 可选参数
     */
    play(soundName, options = {}) {
        if (this.isMuted || !this.isInitialized) return;
        
        this.resume();
        
        const soundConfig = this.sounds[soundName];
        if (!soundConfig) {
            console.warn(`未找到音效: ${soundName}`);
            return;
        }

        const volume = (options.volume || 1) * this.sfxVolume * this.masterVolume;

        try {
            if (soundConfig.frequencies) {
                // 多音符音效（和弦）
                this.playChord(soundConfig, volume);
            } else {
                // 单音符音效
                this.playNote(soundConfig, volume);
            }
        } catch (e) {
            console.warn('播放音效失败:', e);
        }
    }

    /**
     * 播放单音符
     */
    playNote(config, volume) {
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        // 创建振荡器
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = config.type;
        oscillator.frequency.setValueAtTime(config.frequency, currentTime);
        
        // 音高滑动效果
        if (config.slide) {
            oscillator.frequency.linearRampToValueAtTime(
                config.slide,
                currentTime + config.duration
            );
        }
        
        // 音量包络
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + config.duration);
        
        // 连接节点
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // 播放
        oscillator.start(currentTime);
        oscillator.stop(currentTime + config.duration + 0.1);
    }

    /**
     * 播放和弦
     */
    playChord(config, volume) {
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        config.frequencies.forEach((freq, index) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.type = config.type;
            oscillator.frequency.setValueAtTime(freq, currentTime);
            
            // 和弦音量包络（稍微错开）
            const startTime = currentTime + index * 0.02;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume / config.frequencies.length, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + config.duration + 0.1);
        });
    }

    /**
     * 播放蓄力音效（循环上升音）
     * @param {number} progress - 蓄力进度 0-1
     */
    playChargeProgress(progress) {
        if (this.isMuted || !this.isInitialized) return;
        
        const ctx = this.audioContext;
        const currentTime = ctx.currentTime;
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // 频率随蓄力进度上升
        const baseFreq = 300;
        const maxFreq = 800;
        const freq = baseFreq + (maxFreq - baseFreq) * progress;
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, currentTime);
        
        const volume = 0.1 * this.sfxVolume * this.masterVolume;
        gainNode.gain.setValueAtTime(volume, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.05);
    }

    /**
     * 播放连续蓄力音效
     */
    startChargeLoop() {
        if (this.isMuted || !this.isInitialized) return;
        
        this.chargeInterval = setInterval(() => {
            // 这个会在蓄力过程中被调用
        }, 50);
    }

    /**
     * 停止蓄力音效
     */
    stopChargeLoop() {
        if (this.chargeInterval) {
            clearInterval(this.chargeInterval);
            this.chargeInterval = null;
        }
    }

    /**
     * 播放游戏结束音效序列
     */
    playGameOverSequence() {
        if (this.isMuted || !this.isInitialized) return;
        
        this.play('gameOver');
        
        // 延迟播放下降音
        setTimeout(() => {
            const ctx = this.audioContext;
            if (!ctx) return;
            
            const currentTime = ctx.currentTime;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(300, currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, currentTime + 0.8);
            
            const volume = 0.2 * this.sfxVolume * this.masterVolume;
            gainNode.gain.setValueAtTime(volume, currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.8);
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.start(currentTime);
            oscillator.stop(currentTime + 0.8);
        }, 200);
    }
}

// 创建全局音效管理器实例
window.audioManager = new AudioManager();
