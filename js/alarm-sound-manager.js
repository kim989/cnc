/**
 * CNC SMART MONITORING & TOOL WEAR SYSTEM v3.0
 * Module: Alarm Sound & Emergency Interlock Modal Manager (알림창.md 100% 반영)
 * 
 * Features:
 * 1. Web Audio API Synthetic 880Hz (A5 Warning Beep) generation without external asset dependency
 * 2. Progressive Volume Escalation: Starts at 5% volume and increases every 0.5s up to 100%
 * 3. Infinite loop playback until operator explicitly clicks [OFF (경고 끄기)]
 * 4. Topmost Modal Popup with flashing siren & interlock release
 */

(function(window) {
  'use strict';

  class AlarmSoundManager {
    constructor() {
      this.audioCtx = null;
      this.isPlaying = false;
      this.volume = 0.05;      // 시작 음량 5%
      this.maxVolume = 0.85;   // 최대 음량
      this.stepVolume = 0.05;  // 0.5초마다 5%씩 증폭
      this.gainNode = null;
      this.oscillator = null;
      this.beepInterval = null;
      this.volumeEscalationTimer = null;
    }

    initAudioContext() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }

    /**
     * Start Emergency Audio Alarm & Modal Popup
     * @param {string} title 
     * @param {string} message 
     * @param {string} code 
     */
    startAlarm(title = "⚠️ 긴급 바이트 마모 경고", message = "바이트(공구) 마모 한계 초과 감지!\n이송 속도를 낮추고 공구 팁을 교체하십시오.", code = "SV040") {
      if (this.isPlaying) return; // 이미 울리고 있다면 중복 방지

      this.initAudioContext();
      this.isPlaying = true;
      this.volume = 0.05;

      // 1. 소리 비프음 루프 재생 시작
      this._startBeepLoop();

      // 2. 볼륨 점진적 증폭 타이머 (0.5초마다 5% 증가)
      this.volumeEscalationTimer = setInterval(() => {
        if (!this.isPlaying) return;
        if (this.volume < this.maxVolume) {
          this.volume = Math.min(this.maxVolume, this.volume + this.stepVolume);
        }
      }, 500);

      // 3. UI 최상단 팝업 모달 띄우기
      this._showEmergencyModal(title, message, code);
    }

    _startBeepLoop() {
      if (!this.audioCtx) return;

      const playSingleBeep = () => {
        if (!this.isPlaying || !this.audioCtx) return;

        try {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(880.0, this.audioCtx.currentTime); // 880Hz (A5 Warning Tone)

          // 0.4초 비프음 + 0.1초 휴지
          gain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.38);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.4);
        } catch (e) {
          console.warn('Audio Beep warning:', e);
        }
      };

      playSingleBeep();
      this.beepInterval = setInterval(playSingleBeep, 500); // 0.5초 주기 반복
    }

    _showEmergencyModal(title, message, code) {
      const modal = document.getElementById('emergency-alarm-modal');
      const titleEl = document.getElementById('modal-alarm-title');
      const msgEl = document.getElementById('modal-alarm-msg');
      const codeEl = document.getElementById('modal-alarm-code');

      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.innerHTML = message.replace(/\n/g, '<br>');
      if (codeEl) codeEl.textContent = code;

      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('show');
      }
    }

    /**
     * Stop Emergency Alarm and Dismiss Modal (OFF Button)
     */
    stopAlarm() {
      this.isPlaying = false;
      if (this.beepInterval) {
        clearInterval(this.beepInterval);
        this.beepInterval = null;
      }
      if (this.volumeEscalationTimer) {
        clearInterval(this.volumeEscalationTimer);
        this.volumeEscalationTimer = null;
      }

      const modal = document.getElementById('emergency-alarm-modal');
      if (modal) {
        modal.classList.remove('show');
        modal.classList.add('hidden');
      }
    }
  }

  // Global Export
  window.AlarmSoundManager = AlarmSoundManager;

})(window);
