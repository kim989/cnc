# TASKS & IMPLEMENTATION CHECKLIST (tasks.md)
## CNC 수직선반 5G 실시간 스마트 모니터링 & 공구마모 분석 시스템
**System Version:** v3.0.0 (최종 개발 프롬프트 v3.0, `매핑.md` 및 `알림창.md` 완벽 준수)  
**Development Methodology:** SDD (Spec-Driven Development)  
**Standard References:**
- 📑 [spec.md (v3.0 사양서)](file:///c:/Users/1/Desktop/P14/spec.md)
- 🗺️ [plan.md (v3.0 실행 계획서)](file:///c:/Users/1/Desktop/P14/plan.md)
- 📐 [매핑.md (표준 텔레메트리 DTO)](file:///c:/Users/1/Desktop/P14/매핑.md)
- 🚨 [알림창.md (긴급 경보 비프음 및 모달 사양)](file:///c:/Users/1/Desktop/P02/알림창.md)
- 📄 [최종프롬프트.md](file:///c:/Users/1/Desktop/P14/최종프롬프트.md)

---

## 1. 단계별 세부 구현 태스크 목록 (Phased Tasks)

### Phase 1: 5G 원천 데이터 스키마 및 DTO 모델링 (Layer 1 ~ Layer 3)
- [x] **TASK 1.1**: `매핑.md` 표준 DTO 구조에 맞춘 3계층 데이터 모델링 (`js/cnc-schema.js`).
  - 5축 좌표계 배열 (`absolute`, `machine`, `relative`, `distanceToGo`) [X, Z, Y, A, C] 매핑.
  - 서보 유효전류 원천값 (`servo.effectiveCurrent[0~4]`) 부호(-/+) 완벽 보존.
  - 센서 텔레메트리 (`sensor.vibrationRmsG`, `sensor.toolTemperatureC`) 모델링.
  - 기준값 및 품질 (`tool.referenceFlankWearMm`, `quality.referenceOuterDiameterMm`) 정의.
- [x] **TASK 1.2**: 5단계 가공 공정 단계(Machining Phase) 상수 및 임계값 스펙 구성.
  - `LOADING` (0~170s), `ROUGH_TURNING` (180~710s), `FINISH_TURNING` (720~1310s), `THREADING` (1320~1670s), `UNLOADING` (1680~1790s).

---

### Phase 2: 900-Row CSV 기반 가변 배속 시뮬레이터 구현
- [x] **TASK 2.1**: `cnc_5g_sample_dataset.csv` 특성을 반영한 900-Row 시뮬레이션 엔진 개발 (`js/cnc-simulator.js`).
  - 5개 제품(제품당 180행, 10초 주기, 총 1,790초 사이클) 순차 시뮬레이션.
  - 제품 간 약 910초의 비가공 시간 간격을 `NON-MACHINING INTERVAL / DATA GAP`으로 정상 판정.
- [x] **TASK 2.2**: 가변 재생 속도 제어기 탑재 (`1X` 10초, `5X` 2초, `10X` 1초, `50X` 200ms).
- [x] **TASK 2.3**: 시뮬레이션 제어 버튼 (`[START]`, `[PAUSE]`, `[RESET]`) 및 데이터 위치(`DATA: 356 / 900`) 바인딩.

---

### Phase 3: Multi-Sensor Fusion 공구 마모 & 가공 품질 분석 엔진
- [x] **TASK 3.1**: 5대 센서 융합 Tool Condition Index ($0 \sim 100\%$) 연산 구현 (`js/tool-wear-engine.js`).
  - 가중치: 서보 유효전류($35\%$) + 주축 부하($25\%$) + 진동($20\%$) + 공구 온도($15\%$) + 공정($5\%$).
- [x] **TASK 3.2**: **Phase-Aware Dynamic Thresholds** 로직 개발.
  - 황삭(ROUGH TURNING) 단계의 $81\%$ 주축 부하를 정상 범위로 판정하고 오경보 방지.
- [x] **TASK 3.3**: Ground Truth Reference Wear ($VB\text{ mm}$) vs AI Predicted Wear Index ($0 \sim 100\%$) 검증 및 모델 정확도($97.3\%$) 실시간 산출.
- [x] **TASK 3.4**: 공구 마모 $\rightarrow$ 절삭 저항 $\rightarrow$ 진동/온도 $\rightarrow$ 외경 치수($153.780 \sim 153.864\text{mm}$) 품질 연쇄 상관관계 분석.
- [x] **TASK 3.5**: AI 다중센서 동시 급상승 이상탐지 (`TOOL WEAR SUSPECTED`) 플래그 처리.

---

### Phase 4: 1920×1200 태블릿 HMI 메인 대시보드 (전문 한글화 적용)
- [x] **TASK 4.1**: 1920×1200 Two-Tier 다크 인더스트리얼 레이아웃 구축 (`index.html`, `css/hmi-theme.css`).
- [x] **TASK 4.2**: **상단 헤더**: 장비 ID (`VTL-01`), 운전 상태 (`가공 중`), 5G 연결 (`정상 연결`), 수신 지연시간 (`0.82초`), 데이터 출처 (`● 5G 시뮬레이션`), 배속 제어기.
- [x] **TASK 4.3**: **좌측 패널 (28%)**: 5축 절대/상대/잔여 좌표 매트릭스, NC 프로그램 (`O3303`), G코드 (`G01`), 이송속도 및 오버라이드.
- [x] **TASK 4.4**: **중앙 패널 (44%)**: 현재 공정 단계 (`외경/단면 황삭 ROUGH TURNING` 대형 배너 & $68\%$ 진행바), 사이클 시간 (`00:18:40`), X/Z축 서보 유효전류 원천값 (`-25.0 A`, 이동평균/피크).
- [x] **TASK 4.5**: **우측 패널 (28%)**: 주축 회전수 (`399 RPM`), 주축 부하율 (현재 `84.5%`, 최고 `86.96%`), 가공 완료 수량 (`5 / 1,000개`), 누적 시간.
- [x] **TASK 4.6**: **하단 3분할 카드**:
  - **하단 좌측**: 진동 실효값 (`1.52 g`, 피크 `2.78 g`), 공구 팁 온도 (`155.3 ℃`, 피크 `185.6 ℃`).
  - **하단 중앙**: 장착 공구 (`INSERT-T1-0001`), 플랭크 마모도 (실측 `0.056 mm`), 공구 마모 지수 (AI 예측 `82%`), 모델 정확도 (`97.3%`), 미니 파형 캔버스.
  - **하단 우측**: 제품 식별번호 (`SHELL-20250602-01`), 가공 순번 (`5개 중 1번째`), 가공 외경 치수 (`153.804 mm`, 편차 `+0.004 mm`).

---

### Phase 5: 7대 실시간 트렌드 Canvas 그래프 & 상세 서브뷰
- [x] **TASK 5.1**: 60fps 고성능 Canvas 파형 엔진 개발 (`js/hmi-charts.js`).
  - 그래프 1: 주축 부하율 (%) 시간별 추이
  - 그래프 2: 진동 실효값 (g) 시간별 추이
  - 그래프 3: 공구 팁 온도 (℃) 시간별 추이
  - 그래프 4: 서보 유효전류 (A) 시간별 추이
  - 그래프 5: 공구 마모 지수 (%) 제품별 증가 추이
  - 그래프 6: 가공 외경 치수 (mm) 제품별 치수 변화
  - 그래프 7: 사이클 시간 (초) 안정성 분석
- [x] **TASK 5.2**: **제품 5단계 상세 뷰** (`view-product-detail`): 단계별 부하/진동/온도 기준표.
- [x] **TASK 5.3**: **공구/품질 상관분석 뷰** (`view-tool-detail`): 인서트 사양 및 잔여 가공 수량 예측.
- [x] **TASK 5.4**: **15채널 알람 매트릭스 뷰** (`view-alarm`): `Alarm Short 0 ~ 14` LED 상태.
- [x] **TASK 5.5**: **가공 이력 뷰** (`view-history`): 5개 제품 가공 이력 데이터베이스.
- [x] **TASK 5.6**: **시스템 설정 뷰** (`view-setting`): Phase-Aware 부하 상한선 설정.

---

### Phase 6: 긴급 비프음 및 팝업 모달 관리자 통합 (`알림창.md` 100% 반영)
- [x] **TASK 6.1**: Web Audio API 기반 $880\text{Hz}$ (A5 경고톤) 비프음 실시간 합성 엔진 탑재 (`js/alarm-sound-manager.js`).
- [x] **TASK 6.2**: 점진적 볼륨 증폭 로직 (시작 5% $\rightarrow$ 0.5초마다 5%씩 최대 85%까지 증폭) 및 무한 반복 루프 구현.
- [x] **TASK 6.3**: 화면 최상단 강제 고정 긴급 모달 팝업 (`#emergency-alarm-modal`) 및 사이렌 애니메이션.
- [x] **TASK 6.4**: 강력한 레드 컬러의 **`OFF (경고 끄기)`** 버튼 클릭 시 사운드 및 모달 즉시 해제 인터락 연동.

---

## 2. 10대 절대 금지사항 검증 체크리스트 (Prohibitions Verification)

| 번호 | 금지 항목 | 시스템 구현 검증 결과 | 상태 |
| :---: | :--- | :--- | :---: |
| 1 | CSV의 `flank_wear_vb_mm`를 실시간 센서값으로 표현 금지 | 모델 검증용 `● 실측 기준 (REF)`으로 엄격 분리 표기 | ✅ 통과 |
| 2 | Estimated Wear와 실측 측정 Wear를 동일하게 취급 금지 | `● AI 융합 예측 (PRED)`과 `● 실측 기준 (REF)` 분리 및 오차(Accuracy) 산출 | ✅ 통과 |
| 3 | Spindle Load 단일 센서만으로 Tool Wear 확정 금지 | 서보 유효전류 + 주축부하 + 진동 + 공구온도 + 공정 5대 센서 융합 점수 산출 | ✅ 통과 |
| 4 | Vibration만으로 공구 교체 결정 금지 | 다중 센서 융합 마모 지수(85% 이상) 도달 시 교체 권장 | ✅ 통과 |
| 5 | Tool Temperature만으로 공구 교체 결정 금지 | 공정 단계 및 절삭 저항 복합 모델 적용 | ✅ 통과 |
| 6 | ROUGH TURNING의 높은 부하를 무조건 알람 처리 금지 | Phase-Aware Dynamic Threshold 적용 (황삭 85%까지 정상) | ✅ 통과 |
| 7 | Machining Phase를 고려하지 않고 단일 Threshold 적용 금지 | 공정 단계별 (`1_LOADING` ~ `5_UNLOADING`) 개별 부하 상한선 적용 | ✅ 통과 |
| 8 | 5G 통신망과 CNC 데이터 자체를 혼동 금지 | 5G 네트워크 상태와 CNC 데이터 수신 상태 별도 인디케이터 관리 | ✅ 통과 |
| 9 | Simulation 데이터를 LIVE 데이터로 가장 금지 | 데이터 출처 뱃지에 `● 5G 시뮬레이션` 명확히 표기 | ✅ 통과 |
| 10 | 실제 CNC에 검증되지 않은 명령 전송 금지 | 단방향 텔레메트리 모니터링 아키텍처 준수 | ✅ 통과 |

---

## 3. 최종 개발 산출물 매핑

* 📑 [**`spec.md`**](file:///c:/Users/1/Desktop/P14/spec.md): SDD 기준 요구사항 및 DTO 사양서 v3.0
* 🗺️ [**`plan.md`**](file:///c:/Users/1/Desktop/P14/plan.md): 계층별 시스템 아키텍처 및 구현 계획서 v3.0
* ✅ [**`tasks.md`**](file:///c:/Users/1/Desktop/P14/tasks.md): 단계별 구현 태스크 및 금지사항 검증표
* 📐 [**`매핑.md`**](file:///c:/Users/1/Desktop/P14/매핑.md): 표준 텔레메트리 DTO JSON 스펙
* 🚨 [**`알림창.md`**](file:///c:/Users/1/Desktop/P02/알림창.md): 긴급 경보 비프음 및 팝업 모달 사양서
* 🌐 [**`index.html`**](file:///c:/Users/1/Desktop/P14/index.html): 1920×1200 Two-Tier 한글 HMI 대시보드 & 긴급 모달
* 🎨 [**`css/hmi-theme.css`**](file:///c:/Users/1/Desktop/P14/css/hmi-theme.css): 고대비 다크 인더스트리얼 스타일시트 & 모달 CSS
* 🚨 [**`js/alarm-sound-manager.js`**](file:///c:/Users/1/Desktop/P14/js/alarm-sound-manager.js): Web Audio API 880Hz 비프음 증폭 & 모달 관리자
* 📐 [**`js/cnc-schema.js`**](file:///c:/Users/1/Desktop/P14/js/cnc-schema.js): 3계층 데이터 모델
* 🧠 [**`js/tool-wear-engine.js`**](file:///c:/Users/1/Desktop/P14/js/tool-wear-engine.js): 멀티센서 융합 & 품질 상관분석 엔진
* ⚙️ [**`js/cnc-simulator.js`**](file:///c:/Users/1/Desktop/P14/js/cnc-simulator.js): 900-Row 가변 배속 시뮬레이터 (1X~50X)
* 📊 [**`js/hmi-charts.js`**](file:///c:/Users/1/Desktop/P14/js/hmi-charts.js): 7대 실시간 트렌드 Canvas 렌더러
* 🚀 [**`js/app.js`**](file:///c:/Users/1/Desktop/P14/js/app.js): 전체 UI 바인딩, 알람 오디오 인터락 및 이벤트 컨트롤러
