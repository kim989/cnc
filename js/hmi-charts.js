/**
 * CNC SMART MONITORING & TOOL WEAR SYSTEM v3.0
 * Module: High-Performance Canvas HMI Charts & 7 Realtime Trends
 * Korean Localization
 */

(function(window) {
  'use strict';

  class HMIChartEngine {
    constructor() {
      this.maxPoints = 40;
      this.history = {
        spindleLoad: [],
        vibration: [],
        toolTemp: [],
        servoCurrent: [],
        wearMmRef: [0.040, 0.068, 0.095, 0.123, 0.150],
        wearIndexPred: [22, 38, 55, 69, 82],
        outerDia: [153.794, 153.811, 153.810, 153.825, 153.844],
        cycleTime: [1790, 1785, 1792, 1788, 1790]
      };

      // Pre-fill initial sliding window
      for (let i = 0; i < this.maxPoints; i++) {
        this.history.spindleLoad.push(80 + Math.random() * 5);
        this.history.vibration.push(2.2 + Math.random() * 0.3);
        this.history.toolTemp.push(175 + Math.random() * 5);
        this.history.servoCurrent.push(-25 + Math.random() * 2);
      }
    }

    pushTelemetry(raw, wear) {
      this.history.spindleLoad.push(raw.spindle.currentLoadPct);
      this.history.vibration.push(raw.sensor.vibrationRmsG);
      this.history.toolTemp.push(raw.sensor.toolTemperatureC);
      this.history.servoCurrent.push(raw.servo.effectiveCurrent[0]);

      if (this.history.spindleLoad.length > this.maxPoints) {
        this.history.spindleLoad.shift();
        this.history.vibration.shift();
        this.history.toolTemp.shift();
        this.history.servoCurrent.shift();
      }

      this.renderMiniWaveform(raw, wear);
      this.renderAll7Trends(raw, wear);
    }

    renderMiniWaveform(raw, wear) {
      const canvas = document.getElementById('mini-trend-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Background Grid
      ctx.strokeStyle = '#161e2a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 15; y < h; y += 25) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Baseline Dotted
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.45);
      ctx.lineTo(w, h * 0.45);
      ctx.stroke();
      ctx.setLineDash([]);

      // Servo Current Waveform (Cyan)
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
      ctx.shadowBlur = 8;
      this.drawSeries(ctx, this.history.servoCurrent, w, h, -35, 0);
      ctx.shadowBlur = 0;

      // Vibration (Green)
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1.5;
      this.drawSeries(ctx, this.history.vibration, w, h, 0, 3.5);
    }

    renderAll7Trends(raw, wear) {
      // 그래프 1: 주축 부하율 (%)
      this.renderGenericChart('chart-spindle-load', this.history.spindleLoad, '#00f0ff', 0, 100, '%');
      // 그래프 2: 진동 실효값 (g)
      this.renderGenericChart('chart-vibration', this.history.vibration, '#00ff88', 0, 3.5, 'g');
      // 그래프 3: 공구 팁 온도 (℃)
      this.renderGenericChart('chart-tool-temp', this.history.toolTemp, '#ffb800', 0, 220, '℃');
      // 그래프 4: 서보 유효전류 (A)
      this.renderGenericChart('chart-servo-current', this.history.servoCurrent, '#a855f7', -35, 0, 'A');
      // 그래프 5: 공구 마모 지수 (%)
      this.renderGenericChart('chart-tool-wear', this.history.wearIndexPred, '#ff3366', 0, 100, '%');
      // 그래프 6: 가공 외경 치수 (mm)
      this.renderGenericChart('chart-outer-dia', this.history.outerDia, '#3d8bfd', 153.750, 153.900, 'mm');
      // 그래프 7: 사이클 시간 (초)
      this.renderGenericChart('chart-cycle-time', this.history.cycleTime, '#00ff88', 1700, 1850, '초');
    }

    renderGenericChart(canvasId, series, color, minVal, maxVal, unit) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = '#141c28';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 15; y < h; y += 25) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Series Line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      this.drawSeries(ctx, series, w, h, minVal, maxVal);
      ctx.shadowBlur = 0;

      // Latest Value Text
      const latest = series[series.length - 1] || 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${Number(latest).toFixed(1)} ${unit}`, w - 65, 18);
    }

    drawSeries(ctx, data, w, h, minVal, maxVal) {
      if (!data || data.length < 2) return;
      const stepX = w / (data.length - 1);
      const range = maxVal - minVal;

      ctx.beginPath();
      data.forEach((val, i) => {
        const normY = (val - minVal) / range;
        const y = h - (normY * (h - 20) + 10);
        const x = i * stepX;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }

  window.HMIChartEngine = HMIChartEngine;

})(window);
