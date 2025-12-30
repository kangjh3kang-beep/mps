## Bio-Analysis AI Dashboard (Prototype)

기술백서(Part 3, Part 5)를 기반으로 한 **모바일 웹/앱 대시보드 프로토타입**입니다.

### 실행 방법

```bash
cd bio-dashboard
npm install
npm run dev
```

### 포함 기능
- **Dashboard**: Health Score 원형 게이지(0~100), 실시간(모킹) 젖산 농도 표시
- **Trend Analysis**: 최근 7일 농도 라인 차트(Recharts)
- **AI Dr. Coach**: 채팅 UI + RAG 시뮬레이션(모킹 응답)
- **Sensor Mocking**: Raw(노이즈) → 차동 처리 → Kalman Filter → 보정 농도 로그







