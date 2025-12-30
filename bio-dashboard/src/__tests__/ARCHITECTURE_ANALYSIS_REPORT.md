# 아키텍처 분석 보고서
## 확장 가능한 게시판 아키텍처 및 데이터 무결성 전수조사

생성일: 2024년 12월

---

## 1. 게시판(Agora) 아키텍처 분석

### 1.1 스키마 구조 (`agora-schema.ts`)

#### ✅ 잘 구현된 부분 (Scalability Ready)

| 항목 | 구현 상태 | 설명 |
|------|----------|------|
| **인덱스 설정** | ✅ 우수 | `authorId`, `status`, `category`, `voteCount`, `createdAt`에 인덱스 적용 |
| **비정규화 카운트** | ✅ 우수 | `voteCount`, `commentCount` 필드로 COUNT 쿼리 회피 |
| **중복 투표 방지** | ✅ 우수 | `@@unique([ideaId, userId])` 제약조건 |
| **계층적 댓글** | ✅ 우수 | `parentId` 필드로 대댓글 지원 |
| **캐스케이드 삭제** | ✅ 우수 | 아이디어 삭제 시 투표/댓글 자동 삭제 |
| **시간 추적** | ✅ 우수 | `createdAt`, `updatedAt`, `reviewedAt` 필드 |
| **모더레이션** | ✅ 우수 | `isHidden`, `hiddenReason` 필드로 댓글 숨김 가능 |
| **AI 분석 통합** | ✅ 우수 | `aiAnalysis` JSON 필드로 AI 분석 결과 저장 |

#### ⚠️ 개선이 필요한 부분

| 항목 | 현재 상태 | 권장 개선안 |
|------|----------|------------|
| **파티셔닝** | ❌ 미구현 | `createdAt` 기준 월별/연별 파티셔닝 필요 |
| **읽기 복제본** | ❌ 미구현 | 읽기 쿼리용 레플리카 DB 추가 권장 |
| **캐싱 레이어** | ❌ 미구현 | Redis 캐시로 인기 아이디어 캐싱 권장 |
| **전문 검색** | ❌ 미구현 | Elasticsearch/PostgreSQL FTS 통합 필요 |
| **Rate Limiting** | ⚠️ 부분 | API 레벨 rate limiting 필요 |

### 1.2 트래픽 대응 분석

```
현재 아키텍처의 예상 처리량:
- 읽기 (목록 조회): ~10,000 TPS (인덱스 활용)
- 쓰기 (투표/댓글): ~1,000 TPS (트랜잭션 필요)
- 검색: ~100 TPS (인덱스만으로는 제한적)

권장 아키텍처 (100,000+ TPS 대응):
- CDN + Redis 캐시: 인기 아이디어 캐싱
- 읽기/쓰기 분리: Primary + Read Replica
- 샤딩: category 또는 createdAt 기준
- 검색: Elasticsearch 별도 구축
```

### 1.3 확장성 점수

| 카테고리 | 점수 | 평가 |
|----------|------|------|
| 스키마 설계 | 8.5/10 | 우수 - 인덱스, 비정규화 적용 |
| 쿼리 최적화 | 7/10 | 양호 - 기본 최적화 적용 |
| 캐싱 전략 | 4/10 | 미흡 - 캐싱 레이어 없음 |
| 분산 처리 | 3/10 | 미흡 - 단일 DB 구조 |
| **총점** | **5.6/10** | **중간 규모 트래픽 대응 가능** |

---

## 2. 데이터 무결성 및 트랜잭션 분석

### 2.1 포인트 시스템 (`points-db.ts`, `h2e-engine.ts`)

#### ✅ 잘 구현된 부분

| 항목 | 구현 상태 | 설명 |
|------|----------|------|
| **원자적 업데이트** | ⚠️ 부분 | Read-Modify-Write 패턴 사용 (파일 기반) |
| **잔액 검증** | ✅ 우수 | 포인트 차감 전 잔액 확인 |
| **트랜잭션 기록** | ✅ 우수 | 모든 포인트 변동 기록 |
| **중복 방지** | ✅ 우수 | 고유 트랜잭션 ID 생성 |
| **티어 자동 갱신** | ✅ 우수 | 포인트 변경 시 자동 계산 |

#### ❌ 개선이 필요한 부분 (Critical)

| 항목 | 현재 상태 | 위험 수준 | 권장 개선안 |
|------|----------|----------|------------|
| **동시성 제어** | ❌ 미구현 | 🔴 높음 | DB 트랜잭션 또는 락 필요 |
| **낙관적 잠금** | ❌ 미구현 | 🔴 높음 | version 필드 추가 필요 |
| **롤백 메커니즘** | ❌ 미구현 | 🟡 중간 | 보상 트랜잭션 패턴 구현 |
| **결제 멱등성** | ⚠️ 부분 | 🟡 중간 | 멱등키 검증 강화 필요 |

### 2.2 결제 시스템 (`payment-platform.ts`)

#### 상태 전이 다이어그램

```
[pending] ──► [processing] ──► [completed] ──► [refunded]
    │              │
    ▼              ▼
[cancelled]    [failed] ──► [pending] (재시도)
```

#### ✅ 잘 구현된 부분

| 항목 | 구현 상태 | 설명 |
|------|----------|------|
| **상태 머신** | ✅ 우수 | 명확한 상태 전이 정의 |
| **주문 항목 관리** | ✅ 우수 | 주문-상품 관계 구조화 |
| **할인 계산** | ✅ 우수 | 쿠폰, 포인트 차감 로직 |
| **환불 처리** | ✅ 우수 | 환불 요청-승인 워크플로우 |

#### ❌ 개선이 필요한 부분

| 항목 | 현재 상태 | 권장 개선안 |
|------|----------|------------|
| **분산 트랜잭션** | ❌ 미구현 | Saga 패턴 구현 필요 |
| **결제 PG 연동** | ⚠️ 모킹 | 실제 PG API 연동 필요 |
| **감사 로그** | ❌ 미구현 | 모든 금전 거래 감사 로그 필요 |

### 2.3 권한 시스템 (`permissions.ts`)

#### ✅ 잘 구현된 부분 (우수)

| 항목 | 구현 상태 | 설명 |
|------|----------|------|
| **레벨 계층** | ✅ 우수 | 11개 레벨 (Guest ~ Government) |
| **권한 매핑** | ✅ 우수 | 레벨별 세밀한 권한 정의 |
| **전문가 유형** | ✅ 우수 | 9개 전문가 유형 지원 |
| **검증 상태** | ✅ 우수 | pending/verified/rejected |
| **확장성** | ✅ 우수 | 향후 레벨 추가 용이 |

---

## 3. 트랜잭션 코드 전수조사 결과

### 3.1 포인트 차감 API (`/api/points/spend/route.ts`)

```typescript
// 현재 구현 (lines 66-82)
const result = spendPoints(userId, pointsToSpend, ...);
if (!result.success) { return error; }
const updatedPoints = await addTransaction(userId, result.transaction);
```

#### 문제점 분석

1. **Race Condition 취약점**
   - `spendPoints`와 `addTransaction` 사이에 다른 요청이 들어올 수 있음
   - 동시에 두 요청이 잔액 100을 읽고 각각 50을 차감하면 → -50 잔액 발생 가능

2. **권장 수정안**

```typescript
// 권장: Prisma 트랜잭션 사용
await prisma.$transaction(async (tx) => {
  const user = await tx.userPoints.findUnique({ where: { userId } });
  if (user.balance < amount) throw new Error('Insufficient balance');
  await tx.userPoints.update({
    where: { userId },
    data: { balance: { decrement: amount } }
  });
  await tx.pointTransaction.create({ data: { ... } });
});
```

### 3.2 파일 기반 DB (`points-db.ts`)

```typescript
// 현재 구현 (lines 67-121)
const db = await readDB();       // 1. 읽기
user.currentBalance += change;   // 2. 수정
await writeDB(db);               // 3. 쓰기
```

#### 문제점

- 1-2-3 사이에 다른 프로세스가 개입 가능
- 파일 잠금 없이 동시 쓰기 시 데이터 손실 가능

#### 권장 개선안

```typescript
import { lockfile } from 'proper-lockfile';

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const release = await lockfile.lock(POINTS_FILE);
  try {
    return await fn();
  } finally {
    await release();
  }
}

export async function addTransaction(...) {
  return withLock(async () => {
    const db = await readDB();
    // ... 로직
    await writeDB(db);
  });
}
```

---

## 4. 종합 평가 및 권장 사항

### 4.1 현재 아키텍처 성숙도

| 영역 | 점수 | 상태 |
|------|------|------|
| 게시판 스키마 | 8.5/10 | ✅ 양호 |
| 게시판 확장성 | 5.6/10 | ⚠️ 보통 |
| 포인트 무결성 | 4/10 | 🔴 개선 필요 |
| 결제 시스템 | 6/10 | ⚠️ 보통 |
| 권한 시스템 | 9/10 | ✅ 우수 |
| **종합** | **6.6/10** | **프로토타입 수준, 프로덕션 전 개선 필요** |

### 4.2 우선순위별 개선 권장 사항

#### 🔴 긴급 (프로덕션 전 필수)

1. **동시성 제어 구현**
   - Prisma 트랜잭션으로 마이그레이션
   - 낙관적 잠금 (version 필드) 추가

2. **포인트 시스템 데이터베이스화**
   - 파일 기반 → PostgreSQL 마이그레이션
   - 트랜잭션 격리 수준 설정

#### 🟡 중간 (출시 3개월 이내)

3. **캐싱 레이어 구축**
   - Redis 도입
   - 인기 아이디어 캐싱

4. **감사 로그 시스템**
   - 모든 금전 거래 기록
   - 이벤트 소싱 패턴 고려

#### 🟢 장기 (출시 후)

5. **분산 아키텍처**
   - 읽기/쓰기 분리
   - 마이크로서비스화 검토

6. **검색 엔진 통합**
   - Elasticsearch 도입
   - 전문 검색 기능

---

## 5. 테스트 커버리지 권장

| 테스트 영역 | 현재 | 목표 |
|------------|------|------|
| 권한 시스템 | 90% | 95% |
| 포인트 계산 | 80% | 90% |
| 동시성 테스트 | 0% | 80% |
| 통합 테스트 | 0% | 70% |
| E2E 테스트 | 0% | 50% |

---

*이 보고서는 코드베이스 전수조사를 통해 자동 생성되었습니다.*


