/**
 * CNC SMART MONITORING & TOOL WEAR SYSTEM v3.0
 * Module: CNC Data Schema & Standard Telemetry DTO
 * 
 * 100% Compliant with `매핑.md` Schema:
 * - Arrays for 5-Axis (Position, Servo Load, Servo Current, Motor Speed)
 * - Sensor Telemetry (vibrationRmsG, toolTemperatureC)
 * - Reference Data (referenceFlankWearMm, referenceOuterDiameterMm)
 * - Machining Phase (phase.name, phase.progressPct)
 */

(function(window) {
  'use strict';

  // Machining Phase Definitions
  const MACHINING_PHASES = {
    'LOADING': { name: 'LOADING', desc: 'Workpiece Clamping', avgLoad: 5, normalLoadMin: 0, normalLoadMax: 15, normalTempMax: 35, normalVibMax: 0.1 },
    'ROUGH_TURNING': { name: 'ROUGH_TURNING', desc: 'Rough Cut Outer Dia', avgLoad: 81, normalLoadMin: 60, normalLoadMax: 85, warnLoadMax: 90, normalTempMax: 185, normalVibMax: 2.8 },
    'FINISH_TURNING': { name: 'FINISH_TURNING', desc: 'Finish Cut Outer Dia', avgLoad: 44, normalLoadMin: 30, normalLoadMax: 55, warnLoadMax: 65, normalTempMax: 140, normalVibMax: 1.4 },
    'THREADING': { name: 'THREADING', desc: 'Precision Threading', avgLoad: 63, normalLoadMin: 45, normalLoadMax: 70, warnLoadMax: 80, normalTempMax: 160, normalVibMax: 1.9 },
    'UNLOADING': { name: 'UNLOADING', desc: 'Unclamping & Part Out', avgLoad: 3, normalLoadMin: 0, normalLoadMax: 10, normalTempMax: 50, normalVibMax: 0.1 }
  };

  const CNC_CONFIG = {
    machineId: 'VTL-01',
    machineType: 'FANUC 31i-B5 Vertical Turning Lathe',
    defaultSamplingIntervalMs: 1000,
    axisMapping: ['X (Radial)', 'Z (Axial)', 'Y (Linear)', 'A (Rotary)', 'C (Spindle)']
  };

  /**
   * Factory function that returns a Telemetry DTO matching `매핑.md` structure exactly
   */
  function createStandardTelemetryPacket() {
    return {
      timestamp: new Date().toISOString(),

      dataSource: {
        mode: "SIMULATION",
        network: "5G",
        latencyMs: 820
      },

      machine: {
        machineId: "VTL-01",
        running: true,
        status: "CUTTING" // 'CUTTING', 'RUNNING', 'IDLE', 'STOP', 'ALARM'
      },

      position: {
        absolute: [110.880, -71.884, 0.000, 0.000, 0.000],
        machine: [155.206, -12.450, 0.000, 0.000, 0.000],
        relative: [110.880, -71.884, 0.000, 0.000, 0.000],
        distanceToGo: [0.000, -13.228, 0.000, 0.000, 0.000]
      },

      feed: {
        current: 0.25,
        unit: "mm/rev",
        overridePct: 100
      },

      spindle: {
        commandRpm: 399,
        currentLoadPct: 81.4,
        peakLoadPct: 86.96,
        motors: [81.4, 0, 0, 0, 0]
      },

      servo: {
        loadPct: [25, 31, 0, 0, 0],
        effectiveCurrent: [-25.0, 2.0, 0.0, 0.0, 0.0], // Raw signed values preserved
        actualMotorSpeed: [1200, 850, 0, 0, 0]
      },

      program: {
        ncProgramNo: "O3303",
        mainProgramNo: "O3303",
        gCodeGroup: 1,
        gCodeFlag: 1,
        gCode: "G01",
        blockNo: "N000040"
      },

      production: {
        partCounter: 5,
        targetParts: 1000,
        currentCycleTimeSec: 930,
        lastCycleTimeSec: 1790,
        averageCycleTimeSec: 1790
      },

      product: {
        productId: "SHELL-20250602-01",
        totalParts: 5
      },

      tool: {
        toolId: "INSERT-T1-0001",
        referenceFlankWearMm: 0.056, // Ground Truth from CSV
        estimatedWearIndex: 82        // Computed Multi-Sensor Prediction
      },

      sensor: {
        vibrationRmsG: 1.52,
        vibrationPeakG: 2.78,
        toolTemperatureC: 155.3,
        toolTemperaturePeakC: 185.6
      },

      quality: {
        referenceOuterDiameterMm: 153.804,
        targetDiameterMm: 153.800
      },

      phase: {
        name: "ROUGH_TURNING",
        progressPct: 55
      },

      alarm: {
        active: false,
        channels: [],
        channelsShort: new Array(15).fill(0)
      },

      time: {
        powerOnHours: 463536,
        operatingTimeStr: "2,508:08:58",
        cuttingTimeStr: "1,394:46:41"
      }
    };
  }

  // Export
  window.CNCSchema = {
    CONFIG: CNC_CONFIG,
    PHASES: MACHINING_PHASES,
    createRawTelemetryPacket: createStandardTelemetryPacket
  };

})(window);
