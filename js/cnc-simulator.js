/**
 * CNC SMART MONITORING & TOOL WEAR SYSTEM v3.0
 * Module: 5G CNC Dataset-Driven Telemetry Simulator
 * 
 * Emits Telemetry DTO matching `매핑.md` exactly:
 * - 5-Axis Arrays for Position and Servo
 * - sensor.toolTemperatureC & sensor.vibrationRmsG
 * - quality.referenceOuterDiameterMm
 * - phase.name & phase.progressPct
 */

(function(window) {
  'use strict';

  class CNCSimulator {
    constructor(onDataCallback) {
      this.onDataCallback = onDataCallback;
      this.isRunning = false;
      this.timer = null;

      // Playback Configuration
      this.playbackSpeed = 10; // Default 10X (1 row per 1.0 second)
      this.currentRowIndex = 356;
      this.totalRows = 900;
      
      // Generate dataset matching exact CSV statistics
      this.dataset = this.generateRealisticDataset();

      // State instance matching 매핑.md
      this.state = window.CNCSchema.createRawTelemetryPacket();
    }

    start() {
      if (this.timer) clearInterval(this.timer);
      this.isRunning = true;
      const intervalMs = Math.max(50, Math.round(10000 / this.playbackSpeed));
      this.timer = setInterval(() => this.tick(), intervalMs);
    }

    pause() {
      this.isRunning = false;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    reset() {
      this.pause();
      this.currentRowIndex = 0;
      this.tick();
    }

    setSpeed(speed) {
      this.playbackSpeed = speed;
      if (this.isRunning) {
        this.start();
      }
    }

    toggle() {
      if (this.isRunning) this.pause();
      else this.start();
      return this.isRunning;
    }

    triggerAlarm(code = 'SV040', msg = 'SERVO CURRENT OVERLOAD ON X-AXIS') {
      this.state.alarm.active = true;
      this.state.alarm.channels = [{
        channel: 1,
        code: code,
        type: 'SERVO ALARM',
        message: msg,
        timestamp: new Date().toLocaleTimeString(),
        duration: '0.0 s'
      }];
      this.state.machine.status = 'ALARM';
      if (this.onDataCallback) this.onDataCallback(this.state);
    }

    clearAlarm() {
      this.state.alarm.active = false;
      this.state.alarm.channels = [];
      this.state.machine.status = 'CUTTING';
      if (this.onDataCallback) this.onDataCallback(this.state);
    }

    tick() {
      this.currentRowIndex = (this.currentRowIndex + 1) % this.totalRows;
      const row = this.dataset[this.currentRowIndex];

      this.mapRowToStandardDTO(row);

      if (this.onDataCallback) {
        this.onDataCallback(this.state);
      }
    }

    /**
     * Map dataset row to 매핑.md standard DTO format
     */
    mapRowToStandardDTO(row) {
      this.state.timestamp = row.timestamp;
      this.state.dataSource.latencyMs = Math.round(780 + Math.random() * 150);
      this.state.currentRow = this.currentRowIndex;
      this.state.totalRows = this.totalRows;

      // Product & Phase (매핑.md format)
      this.state.product.productId = row.productId;
      this.state.phase.name = row.machiningPhase;
      this.state.phase.progressPct = row.phaseProgressPct;

      // Sensors & Quality (매핑.md format)
      this.state.sensor.vibrationRmsG = row.vibrationRmsG;
      this.state.sensor.toolTemperatureC = row.toolTemperatureC;
      this.state.tool.referenceFlankWearMm = row.referenceFlankWearMm;
      this.state.quality.referenceOuterDiameterMm = row.referenceOuterDiameterMm;

      // Spindle & Status
      this.state.spindle.currentLoadPct = row.spindleLoadPct;
      this.state.spindle.commandRpm = 399;

      const isCutting = row.machiningPhase === 'ROUGH_TURNING' || row.machiningPhase === 'FINISH_TURNING' || row.machiningPhase === 'THREADING';
      this.state.machine.status = isCutting ? 'CUTTING' : (row.machiningPhase === 'LOADING' || row.machiningPhase === 'UNLOADING' ? 'IDLE' : 'RUNNING');
      this.state.machine.running = isCutting;

      // Position Array (5-Axis [X, Z, Y, A, C] matching 매핑.md)
      if (isCutting) {
        this.state.position.absolute = [+(110.880 - (row.cycleElapsedSec % 35) * 0.45).toFixed(3), +(-71.884 + (row.cycleElapsedSec % 35) * 0.12).toFixed(3), 0.0, 0.0, 0.0];
        this.state.position.distanceToGo = [0.0, +(-(35 - (row.cycleElapsedSec % 35)) * 0.42).toFixed(3), 0.0, 0.0, 0.0];
        this.state.servo.effectiveCurrent = [-25.0 + (Math.random() * 2 - 1), 2.0, 0.0, 0.0, 0.0];
        this.state.servo.loadPct = [Math.round(row.spindleLoadPct * 0.35), Math.round(row.spindleLoadPct * 0.4), 0, 0, 0];
        this.state.feed.current = row.machiningPhase === 'ROUGH_TURNING' ? 0.25 : (row.machiningPhase === 'FINISH_TURNING' ? 0.15 : 1.5);
      } else {
        this.state.position.absolute = [200.0, 100.0, 0.0, 0.0, 0.0];
        this.state.position.distanceToGo = [0.0, 0.0, 0.0, 0.0, 0.0];
        this.state.servo.effectiveCurrent = [-2.0, 0.0, 0.0, 0.0, 0.0];
        this.state.servo.loadPct = [2, 1, 0, 0, 0];
        this.state.feed.current = 0.0;
      }
      this.state.position.relative = [...this.state.position.absolute];

      // Production Timers
      this.state.production.currentCycleTimeSec = row.cycleElapsedSec;
      this.state.production.partCounter = row.partIndex;
    }

    /**
     * Build realistic 900-row dataset matching exact CSV
     */
    generateRealisticDataset() {
      const rows = [];
      const products = [
        { id: 'SHELL-20250602-01', wearBase: 0.040, diaBase: 153.794 },
        { id: 'SHELL-20250602-02', wearBase: 0.068, diaBase: 153.811 },
        { id: 'SHELL-20250602-03', wearBase: 0.095, diaBase: 153.810 },
        { id: 'SHELL-20250602-04', wearBase: 0.123, diaBase: 153.825 },
        { id: 'SHELL-20250602-05', wearBase: 0.150, diaBase: 153.844 }
      ];

      let baseDate = new Date('2025-06-02T08:15:30Z');

      products.forEach((prod, pIdx) => {
        for (let r = 0; r < 180; r++) {
          const elapsedSec = r * 10;
          let phase = 'LOADING';
          let phasePct = 0;
          let spLoad = 3.5;
          let vib = 0.045;
          let temp = 25.0;
          let wearVb = prod.wearBase + (r / 180) * 0.028;
          let outerDia = prod.diaBase + (r / 180) * 0.012;

          if (elapsedSec <= 170) {
            phase = 'LOADING';
            phasePct = (elapsedSec / 170) * 100;
            spLoad = 3.5 + Math.random() * 2.0;
            vib = 0.04 + Math.random() * 0.02;
            temp = 25.0 + (elapsedSec / 170) * 5.0;
          } else if (elapsedSec <= 710) {
            phase = 'ROUGH_TURNING';
            phasePct = ((elapsedSec - 180) / (710 - 180)) * 100;
            spLoad = 79.5 + Math.random() * 7.4;
            vib = 1.85 + Math.random() * 0.93;
            temp = 120.0 + Math.random() * 65.6;
          } else if (elapsedSec <= 1310) {
            phase = 'FINISH_TURNING';
            phasePct = ((elapsedSec - 720) / (1310 - 720)) * 100;
            spLoad = 42.0 + Math.random() * 5.0;
            vib = 0.95 + Math.random() * 0.45;
            temp = 110.0 + Math.random() * 30.0;
          } else if (elapsedSec <= 1670) {
            phase = 'THREADING';
            phasePct = ((elapsedSec - 1320) / (1670 - 1320)) * 100;
            spLoad = 61.0 + Math.random() * 6.0;
            vib = 1.30 + Math.random() * 0.50;
            temp = 135.0 + Math.random() * 25.0;
          } else {
            phase = 'UNLOADING';
            phasePct = ((elapsedSec - 1680) / (1790 - 1680)) * 100;
            spLoad = 2.95 + Math.random() * 1.5;
            vib = 0.037 + Math.random() * 0.02;
            temp = 45.0 - ((elapsedSec - 1680) / 110) * 15.0;
          }

          const curTime = new Date(baseDate.getTime() + elapsedSec * 1000);

          rows.push({
            timestamp: curTime.toISOString().replace('T', ' ').substring(0, 19),
            productId: prod.id,
            partIndex: pIdx + 1,
            cycleElapsedSec: elapsedSec,
            machiningPhase: phase,
            phaseProgressPct: Number(phasePct.toFixed(1)),
            spindleLoadPct: Number(spLoad.toFixed(2)),
            vibrationRmsG: Number(vib.toFixed(3)),
            toolTemperatureC: Number(temp.toFixed(1)),
            referenceFlankWearMm: Number(wearVb.toFixed(3)),
            referenceOuterDiameterMm: Number(outerDia.toFixed(3))
          });
        }

        // 910s non-machining gap
        baseDate = new Date(baseDate.getTime() + (1790 + 910) * 1000);
      });

      return rows;
    }
  }

  window.CNCSimulator = CNCSimulator;

})(window);
