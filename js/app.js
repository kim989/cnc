/**
 * CNC SMART MONITORING & TOOL WEAR SYSTEM v3.0
 * Module: Main Application Controller & Telemetry UI Binder
 * Korean Localization & Emergency Alarm Sound Manager Integration (알림창.md)
 */

(function() {
  'use strict';

  // Instantiate Core Intelligence & Audio Engines
  const wearEngine = new window.ToolWearEngine();
  const chartEngine = new window.HMIChartEngine();
  const alarmSoundManager = new window.AlarmSoundManager();
  let simulator = null;

  // DOM Elements Cache
  const DOM = {
    // Header
    machineId: document.getElementById('val-machine-id'),
    machineStatus: document.getElementById('val-machine-status'),
    badgeStatus: document.getElementById('badge-machine-status'),
    latency: document.getElementById('val-latency'),
    simRow: document.getElementById('val-sim-row'),
    clockTime: document.getElementById('hmi-clock-time'),
    clockDate: document.getElementById('hmi-clock-date'),
    
    // Left: Position & Program
    absX: document.getElementById('val-abs-x'),
    absZ: document.getElementById('val-abs-z'),
    relU: document.getElementById('val-rel-u'),
    relW: document.getElementById('val-rel-w'),
    dtgX: document.getElementById('val-dtg-x'),
    dtgZ: document.getElementById('val-dtg-z'),
    ncProg: document.getElementById('val-nc-prog'),
    gCode: document.getElementById('val-current-gcode'),
    feedRate: document.getElementById('val-feed-rate'),
    feedOverride: document.getElementById('val-feed-override'),

    // Center: Phase & Process
    currentPhaseTitle: document.getElementById('val-current-phase-title'),
    phaseProgressPct: document.getElementById('val-phase-progress-pct'),
    barPhaseProgress: document.getElementById('bar-phase-progress'),
    phaseNormLoad: document.getElementById('val-phase-norm-load'),
    phaseLoadState: document.getElementById('val-phase-load-state'),
    cycleTime: document.getElementById('val-cycle-time'),
    cyclePct: document.getElementById('val-cycle-pct'),
    servoCurrX: document.getElementById('val-servo-curr-x'),
    servoCurrZ: document.getElementById('val-servo-curr-z'),
    currMaX: document.getElementById('val-curr-ma-x'),
    currPkX: document.getElementById('val-curr-pk-x'),
    currMaZ: document.getElementById('val-curr-ma-z'),
    currPkZ: document.getElementById('val-curr-pk-z'),

    // Right: Spindle & Production
    spindleRpm: document.getElementById('val-spindle-rpm'),
    spindleLoad: document.getElementById('val-spindle-load'),
    spindlePeak: document.getElementById('val-spindle-peak'),
    barSpindleRpm: document.getElementById('bar-spindle-rpm'),
    barSpindleLoad: document.getElementById('bar-spindle-load'),
    partCount: document.getElementById('val-part-count'),
    partTarget: document.getElementById('val-part-target'),
    timePoweron: document.getElementById('val-time-poweron'),
    timeOperating: document.getElementById('val-time-operating'),
    timeCutting: document.getElementById('val-time-cutting'),

    // Bottom 3-Split Cards
    vibrationRms: document.getElementById('val-vibration-rms'),
    vibrationPeak: document.getElementById('val-vibration-peak'),
    toolTemp: document.getElementById('val-tool-temp'),
    tempPeak: document.getElementById('val-temp-peak'),
    wearRef: document.getElementById('val-wear-ref'),
    wearIndex: document.getElementById('val-wear-index'),
    modelAccuracy: document.getElementById('val-model-accuracy'),
    anomalyFlag: document.getElementById('val-anomaly-flag'),
    activeTool: document.getElementById('val-active-tool'),
    toolConditionBadge: document.getElementById('badge-tool-status'),
    toolConditionText: document.getElementById('val-tool-condition-text'),
    productId: document.getElementById('val-product-id'),
    partSeq: document.getElementById('val-part-seq'),
    outerDia: document.getElementById('val-outer-dia'),
    diaDev: document.getElementById('val-dia-dev'),

    // Top Banner & Emergency Modal
    alarmBanner: document.getElementById('hmi-alarm-banner'),
    bannerAlarmCode: document.getElementById('banner-alarm-code'),
    bannerAlarmMsg: document.getElementById('banner-alarm-msg'),
    bannerAlarmTime: document.getElementById('banner-alarm-time'),
    btnAlarmDismiss: document.getElementById('btn-alarm-dismiss'),
    btnAlarmModalOff: document.getElementById('btn-alarm-modal-off'),
    alarmChannelsGrid: document.getElementById('alarm-channels-grid')
  };

  /**
   * Main Realtime Telemetry Handler conforming to `매핑.md`
   * @param {Object} raw - Standard Telemetry DTO
   */
  function handleTelemetryPacket(raw) {
    const wear = wearEngine.analyze(raw);

    updateHeader(raw);
    updatePositionAndProgram(raw);
    updatePhaseAndServo(raw, wear);
    updateSpindleAndProduction(raw);
    updateBottomCards(raw, wear);
    chartEngine.pushTelemetry(raw, wear);
    handleAlarmDisplay(raw, wear);
  }

  function updateHeader(raw) {
    if (DOM.machineId) DOM.machineId.textContent = raw.machine.machineId;
    
    const statusMap = {
      'CUTTING': '가공 중 (CUTTING)',
      'RUNNING': '운전 중 (RUNNING)',
      'IDLE': '대기 중 (IDLE)',
      'STOP': '정지 (STOP)',
      'ALARM': '경보 발생 (ALARM)'
    };
    if (DOM.machineStatus) DOM.machineStatus.textContent = statusMap[raw.machine.status] || raw.machine.status;
    if (DOM.badgeStatus) DOM.badgeStatus.className = `main-status-badge status-${raw.machine.status.toLowerCase()}`;
    if (DOM.latency) DOM.latency.textContent = `${(raw.dataSource.latencyMs / 1000).toFixed(2)} 초`;
    if (DOM.simRow && raw.currentRow !== undefined) {
      DOM.simRow.textContent = `${raw.currentRow + 1} / ${raw.totalRows || 900}`;
    }

    const now = new Date();
    if (DOM.clockTime) DOM.clockTime.textContent = now.toTimeString().split(' ')[0];
    if (DOM.clockDate) DOM.clockDate.textContent = now.toISOString().split('T')[0];
  }

  function updatePositionAndProgram(raw) {
    const abs = raw.position.absolute || [0, 0, 0, 0, 0];
    const rel = raw.position.relative || [0, 0, 0, 0, 0];
    const dtg = raw.position.distanceToGo || [0, 0, 0, 0, 0];

    if (DOM.absX) DOM.absX.textContent = Number(abs[0]).toFixed(3);
    if (DOM.absZ) DOM.absZ.textContent = Number(abs[1]).toFixed(3);
    if (DOM.relU) DOM.relU.textContent = Number(rel[0]).toFixed(3);
    if (DOM.relW) DOM.relW.textContent = Number(rel[1]).toFixed(3);
    if (DOM.dtgX) DOM.dtgX.textContent = Number(dtg[0]).toFixed(3);
    if (DOM.dtgZ) DOM.dtgZ.textContent = Number(dtg[1]).toFixed(3);

    if (DOM.ncProg) DOM.ncProg.textContent = raw.program.ncProgramNo || 'O3303';
    if (DOM.gCode) DOM.gCode.textContent = raw.program.gCode || 'G01';
    if (DOM.feedRate) DOM.feedRate.textContent = `${raw.feed.current || 0.25} ${raw.feed.unit || 'mm/rev'}`;
    if (DOM.feedOverride) DOM.feedOverride.textContent = `${raw.feed.overridePct || 100}%`;
  }

  function updatePhaseAndServo(raw, wear) {
    const phaseName = raw.phase ? raw.phase.name : 'ROUGH_TURNING';
    const phaseProgress = raw.phase ? raw.phase.progressPct : 68;

    const phaseKoreanMap = {
      'LOADING': '공작물 장착/클램프 (LOADING)',
      'ROUGH_TURNING': '외경/단면 황삭 (ROUGH TURNING)',
      'FINISH_TURNING': '외경 정삭 가공 (FINISH TURNING)',
      'THREADING': '나사 정밀 가공 (THREADING)',
      'UNLOADING': '언로딩/반출 (UNLOADING)'
    };

    if (DOM.currentPhaseTitle) DOM.currentPhaseTitle.textContent = phaseKoreanMap[phaseName] || phaseName;
    if (DOM.phaseProgressPct) DOM.phaseProgressPct.textContent = `${phaseProgress}%`;
    if (DOM.barPhaseProgress) DOM.barPhaseProgress.style.width = `${phaseProgress}%`;

    const phaseSpec = window.CNCSchema.PHASES[phaseName] || window.CNCSchema.PHASES['ROUGH_TURNING'];
    if (DOM.phaseNormLoad) DOM.phaseNormLoad.textContent = `${phaseSpec.normalLoadMin}~${phaseSpec.normalLoadMax}%`;
    if (DOM.phaseLoadState) {
      const isNorm = wear.isLoadNormalForPhase;
      DOM.phaseLoadState.textContent = isNorm ? `정상 범위 (${raw.spindle.currentLoadPct}%)` : `경보 범위 (${raw.spindle.currentLoadPct}%)`;
      DOM.phaseLoadState.className = isNorm ? 'text-green' : 'text-warn';
    }

    if (DOM.cycleTime) DOM.cycleTime.textContent = formatCycleTime(raw.production.currentCycleTimeSec || 0);
    if (DOM.cyclePct) DOM.cyclePct.textContent = `${Math.min(100, Math.round(((raw.production.currentCycleTimeSec || 0) / 1790) * 100))}%`;

    const currArr = raw.servo.effectiveCurrent || [-25.0, 2.0, 0, 0, 0];
    if (DOM.servoCurrX) DOM.servoCurrX.textContent = `${currArr[0]} A`;
    if (DOM.servoCurrZ) DOM.servoCurrZ.textContent = `${currArr[1]} A`;
    if (DOM.currMaX) DOM.currMaX.textContent = wear.maCurrent;
    if (DOM.currPkX) DOM.currPkX.textContent = wear.pkCurrent;
    if (DOM.currMaZ) DOM.currMaZ.textContent = '2.1';
    if (DOM.currPkZ) DOM.currPkZ.textContent = '4.5';
  }

  function updateSpindleAndProduction(raw) {
    const sp = raw.spindle;
    if (DOM.spindleRpm) DOM.spindleRpm.textContent = sp.commandRpm || 399;
    if (DOM.spindleLoad) DOM.spindleLoad.textContent = sp.currentLoadPct;
    if (DOM.spindlePeak) DOM.spindlePeak.textContent = `${sp.peakLoadPct || 86.96}%`;
    if (DOM.barSpindleRpm) DOM.barSpindleRpm.style.width = `${Math.min(100, ((sp.commandRpm || 399) / 1500) * 100)}%`;
    if (DOM.barSpindleLoad) DOM.barSpindleLoad.style.width = `${Math.min(100, sp.currentLoadPct)}%`;

    if (DOM.partCount) DOM.partCount.innerHTML = `${raw.production.partCounter || 5} <small>개 (PCS)</small>`;
    if (DOM.partTarget) DOM.partTarget.innerHTML = `1,000 <small>개</small>`;
    if (DOM.timePoweron) DOM.timePoweron.textContent = `${raw.time.powerOnHours.toLocaleString()} 시간`;
    if (DOM.timeOperating) DOM.timeOperating.textContent = raw.time.operatingTimeStr;
    if (DOM.timeCutting) DOM.timeCutting.textContent = raw.time.cuttingTimeStr;
  }

  function updateBottomCards(raw, wear) {
    if (DOM.vibrationRms) DOM.vibrationRms.textContent = raw.sensor.vibrationRmsG;
    if (DOM.vibrationPeak) DOM.vibrationPeak.textContent = `${raw.sensor.vibrationPeakG || 2.78} g`;
    if (DOM.toolTemp) DOM.toolTemp.textContent = raw.sensor.toolTemperatureC;
    if (DOM.tempPeak) DOM.tempPeak.textContent = `${raw.sensor.toolTemperaturePeakC || 185.6} ℃`;

    if (DOM.wearRef) DOM.wearRef.innerHTML = `${Number(raw.tool.referenceFlankWearMm).toFixed(3)} <small>mm</small>`;
    if (DOM.wearIndex) DOM.wearIndex.textContent = `${wear.wearIndex} %`;
    if (DOM.modelAccuracy) DOM.modelAccuracy.textContent = `${wear.modelAccuracyPct} %`;
    if (DOM.anomalyFlag) {
      DOM.anomalyFlag.textContent = wear.anomalyDetected ? `이상 감지: ${wear.anomalyMessage}` : `상태: ${wear.conditionStatus}`;
      DOM.anomalyFlag.className = wear.anomalyDetected ? 'ws-sub text-warn' : 'ws-sub text-muted';
    }
    if (DOM.activeTool) DOM.activeTool.textContent = `장착 공구: ${raw.tool.toolId}`;
    if (DOM.toolConditionBadge) DOM.toolConditionBadge.className = `tw-status-pill ${wear.conditionClass}`;
    if (DOM.toolConditionText) DOM.toolConditionText.textContent = `${wear.conditionStatus} (${wear.wearIndex}%)`;

    if (DOM.productId) DOM.productId.textContent = raw.product.productId;
    if (DOM.partSeq) DOM.partSeq.textContent = `5개 중 ${raw.production.partCounter || 5}번째 제품`;
    if (DOM.outerDia) DOM.outerDia.textContent = Number(raw.quality.referenceOuterDiameterMm).toFixed(3);
    if (DOM.diaDev) {
      const dev = raw.quality.referenceOuterDiameterMm - 153.800;
      DOM.diaDev.textContent = `기준 편차: ${dev >= 0 ? '+' : ''}${dev.toFixed(3)} mm`;
      DOM.diaDev.className = wear.qualityClass === 'status-good' ? 'dia-dev text-green' : 'dia-dev text-warn';
    }
  }

  function handleAlarmDisplay(raw, wear) {
    // 1. CNC Alarm Trigger or Wear Anomaly
    if (raw.alarm && raw.alarm.active) {
      const al = raw.alarm.channels[0] || { code: 'SV040', message: 'X축 서보 유효전류 과부하 (OVERLOAD)', timestamp: '21:40:10' };
      DOM.alarmBanner.classList.remove('hidden');
      DOM.bannerAlarmCode.textContent = al.code;
      DOM.bannerAlarmMsg.textContent = al.message;
      DOM.bannerAlarmTime.textContent = al.timestamp;

      // Start Audio & Emergency Modal
      alarmSoundManager.startAlarm(
        "⚠️ 긴급 바이트 마모 경고",
        "바이트(공구) 마모 한계 초과 감지!\n이송 속도를 낮추고 공구 팁을 교체하십시오.",
        al.code
      );
    } else {
      DOM.alarmBanner.classList.add('hidden');
    }
  }

  function formatCycleTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  /**
   * UI Navigation & Event Bindings
   */
  function initEvents() {
    // 1. Bottom Dock Navigation Tabs
    const navItems = document.querySelectorAll('.nav-item');
    const viewTabs = document.querySelectorAll('.hmi-view-tab');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const targetId = item.getAttribute('data-target');
        viewTabs.forEach(tab => {
          tab.classList.toggle('active', tab.id === targetId);
        });
      });
    });

    // 2. Playback Speed Selector (1X, 5X, 10X, 50X)
    const speedBtns = document.querySelectorAll('.speed-btn');
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const speed = Number(btn.getAttribute('data-speed'));
        if (simulator) simulator.setSpeed(speed);
      });
    });

    // 3. Play / Pause Toggle
    const btnSimToggle = document.getElementById('btn-sim-toggle');
    const simIcon = document.getElementById('sim-icon');
    btnSimToggle.addEventListener('click', () => {
      if (simulator) {
        const isRunning = simulator.toggle();
        simIcon.textContent = isRunning ? '⏸️' : '▶️';
      }
    });

    // 4. Reset Simulation
    const btnSimReset = document.getElementById('btn-sim-reset');
    btnSimReset.addEventListener('click', () => {
      if (simulator) {
        simulator.reset();
        simIcon.textContent = '▶️';
      }
    });

    // 5. Alarm Trigger Test (Triggers Beep Audio & Modal Popup)
    const btnTriggerAlarm = document.getElementById('btn-trigger-alarm');
    btnTriggerAlarm.addEventListener('click', () => {
      alarmSoundManager.initAudioContext();
      if (simulator) simulator.triggerAlarm('SV040', 'X축 서보 유효전류 과부하 (OVERLOAD)');
    });

    // 6. Alarm Dismiss & Modal OFF Button (Stops audio loop & dismisses popup)
    if (DOM.btnAlarmDismiss) {
      DOM.btnAlarmDismiss.addEventListener('click', () => {
        alarmSoundManager.stopAlarm();
        if (simulator) simulator.clearAlarm();
      });
    }

    if (DOM.btnAlarmModalOff) {
      DOM.btnAlarmModalOff.addEventListener('click', () => {
        alarmSoundManager.stopAlarm();
        if (simulator) simulator.clearAlarm();
      });
    }

    // 7. Build 15-channel Alarm LED Matrix in Korean
    if (DOM.alarmChannelsGrid) {
      DOM.alarmChannelsGrid.innerHTML = '';
      for (let i = 0; i < 15; i++) {
        const div = document.createElement('div');
        div.className = `alarm-chan-chip ${i === 1 ? 'active' : ''}`;
        div.innerHTML = `
          <div class="chan-led"></div>
          <div>
            <span class="d-block" style="font-size: 9px; color: var(--text-muted);">알람 채널 ${i}</span>
            <span style="font-weight: 700; font-size: 11px;">${i === 1 ? 'SV040 (감지)' : '정상 (NORMAL)'}</span>
          </div>
        `;
        DOM.alarmChannelsGrid.appendChild(div);
      }
    }
  }

  // Application Entrypoint
  window.addEventListener('DOMContentLoaded', () => {
    initEvents();
    simulator = new window.CNCSimulator(handleTelemetryPacket);
    simulator.start();
    const simIcon = document.getElementById('sim-icon');
    if (simIcon) simIcon.textContent = '⏸️';
  });

})();
