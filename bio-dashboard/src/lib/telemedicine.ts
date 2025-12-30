/**
 * Telemedicine Module - Data Models & Mock Database
 * 
 * 원격 의료 시스템: 병원 예약, 화상 진료
 */

/* ============================================
 * 1. Types & Interfaces
 * ============================================
 */

export interface Hospital {
  id: string;
  name: string;
  nameEn: string;
  region: Region;
  specialty: Specialty[];
  rating: number;
  reviewCount: number;
  address: string;
  phone: string;
  image?: string;
  doctors: Doctor[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: Specialty;
  experience: number; // years
  rating: number;
  image?: string;
  availableSlots: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:mm
  duration: number;    // minutes
  isAvailable: boolean;
  doctorId: string;
}

export interface Appointment {
  id: string;
  userId: string;
  hospitalId: string;
  hospitalName: string;
  doctorId: string;
  doctorName: string;
  specialty: Specialty;
  slotId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  dataShareConsent: boolean;
  accessToken?: string;
  createdAt: number;
  notes?: string;
}

export type Region = 
  | "seoul"
  | "gyeonggi"
  | "busan"
  | "daegu"
  | "incheon"
  | "gwangju"
  | "daejeon"
  | "ulsan";

export type Specialty = 
  | "internal"      // 내과
  | "cardiology"    // 심장내과
  | "endocrinology" // 내분비내과
  | "nephrology"    // 신장내과
  | "neurology"     // 신경과
  | "dermatology"   // 피부과
  | "psychiatry"    // 정신건강의학과
  | "family";       // 가정의학과

export type AppointmentStatus = 
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

/* ============================================
 * 2. Constants & Labels
 * ============================================
 */

export const REGION_LABELS: Record<Region, string> = {
  seoul: "서울",
  gyeonggi: "경기",
  busan: "부산",
  daegu: "대구",
  incheon: "인천",
  gwangju: "광주",
  daejeon: "대전",
  ulsan: "울산"
};

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  internal: "내과",
  cardiology: "심장내과",
  endocrinology: "내분비내과",
  nephrology: "신장내과",
  neurology: "신경과",
  dermatology: "피부과",
  psychiatry: "정신건강의학과",
  family: "가정의학과"
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "대기 중",
  confirmed: "예약 확정",
  in_progress: "진료 중",
  completed: "진료 완료",
  cancelled: "취소됨"
};

/* ============================================
 * 3. Mock Database - Hospitals
 * ============================================
 */

function generateTimeSlots(doctorId: string, daysAhead: number = 14): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();
  
  for (let d = 1; d <= daysAhead; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Morning slots: 09:00 - 12:00
    for (let h = 9; h < 12; h++) {
      slots.push({
        id: `${doctorId}-${dateStr}-${h}:00`,
        date: dateStr,
        time: `${h.toString().padStart(2, '0')}:00`,
        duration: 30,
        isAvailable: Math.random() > 0.3, // 70% availability
        doctorId
      });
      slots.push({
        id: `${doctorId}-${dateStr}-${h}:30`,
        date: dateStr,
        time: `${h.toString().padStart(2, '0')}:30`,
        duration: 30,
        isAvailable: Math.random() > 0.3,
        doctorId
      });
    }
    
    // Afternoon slots: 14:00 - 17:00
    for (let h = 14; h < 17; h++) {
      slots.push({
        id: `${doctorId}-${dateStr}-${h}:00`,
        date: dateStr,
        time: `${h.toString().padStart(2, '0')}:00`,
        duration: 30,
        isAvailable: Math.random() > 0.3,
        doctorId
      });
      slots.push({
        id: `${doctorId}-${dateStr}-${h}:30`,
        date: dateStr,
        time: `${h.toString().padStart(2, '0')}:30`,
        duration: 30,
        isAvailable: Math.random() > 0.3,
        doctorId
      });
    }
  }
  
  return slots;
}

export const MOCK_HOSPITALS: Hospital[] = [
  {
    id: "hosp-001",
    name: "서울대학교병원",
    nameEn: "Seoul National University Hospital",
    region: "seoul",
    specialty: ["internal", "cardiology", "endocrinology", "nephrology"],
    rating: 4.8,
    reviewCount: 2340,
    address: "서울특별시 종로구 대학로 101",
    phone: "02-2072-2114",
    doctors: [
      {
        id: "doc-001",
        name: "김철수",
        specialty: "internal",
        experience: 15,
        rating: 4.9,
        availableSlots: generateTimeSlots("doc-001")
      },
      {
        id: "doc-002",
        name: "이영희",
        specialty: "cardiology",
        experience: 12,
        rating: 4.7,
        availableSlots: generateTimeSlots("doc-002")
      },
      {
        id: "doc-003",
        name: "박민수",
        specialty: "endocrinology",
        experience: 10,
        rating: 4.8,
        availableSlots: generateTimeSlots("doc-003")
      }
    ]
  },
  {
    id: "hosp-002",
    name: "삼성서울병원",
    nameEn: "Samsung Medical Center",
    region: "seoul",
    specialty: ["internal", "neurology", "nephrology", "psychiatry"],
    rating: 4.7,
    reviewCount: 1890,
    address: "서울특별시 강남구 일원로 81",
    phone: "02-3410-2114",
    doctors: [
      {
        id: "doc-004",
        name: "정수진",
        specialty: "neurology",
        experience: 18,
        rating: 4.9,
        availableSlots: generateTimeSlots("doc-004")
      },
      {
        id: "doc-005",
        name: "최동훈",
        specialty: "nephrology",
        experience: 14,
        rating: 4.6,
        availableSlots: generateTimeSlots("doc-005")
      }
    ]
  },
  {
    id: "hosp-003",
    name: "경기도의료원",
    nameEn: "Gyeonggi Medical Center",
    region: "gyeonggi",
    specialty: ["internal", "family", "dermatology"],
    rating: 4.5,
    reviewCount: 980,
    address: "경기도 수원시 팔달구 중부대로 123",
    phone: "031-250-8800",
    doctors: [
      {
        id: "doc-006",
        name: "한미영",
        specialty: "family",
        experience: 8,
        rating: 4.7,
        availableSlots: generateTimeSlots("doc-006")
      },
      {
        id: "doc-007",
        name: "송재호",
        specialty: "dermatology",
        experience: 11,
        rating: 4.5,
        availableSlots: generateTimeSlots("doc-007")
      }
    ]
  },
  {
    id: "hosp-004",
    name: "부산대학교병원",
    nameEn: "Pusan National University Hospital",
    region: "busan",
    specialty: ["internal", "cardiology", "endocrinology"],
    rating: 4.6,
    reviewCount: 1560,
    address: "부산광역시 서구 구덕로 179",
    phone: "051-240-7000",
    doctors: [
      {
        id: "doc-008",
        name: "윤서연",
        specialty: "cardiology",
        experience: 13,
        rating: 4.8,
        availableSlots: generateTimeSlots("doc-008")
      }
    ]
  },
  {
    id: "hosp-005",
    name: "인천길병원",
    nameEn: "Incheon Gil Medical Center",
    region: "incheon",
    specialty: ["internal", "nephrology", "psychiatry"],
    rating: 4.4,
    reviewCount: 720,
    address: "인천광역시 남동구 남동대로 774번길 21",
    phone: "032-460-3000",
    doctors: [
      {
        id: "doc-009",
        name: "강지민",
        specialty: "psychiatry",
        experience: 9,
        rating: 4.6,
        availableSlots: generateTimeSlots("doc-009")
      },
      {
        id: "doc-010",
        name: "임현우",
        specialty: "internal",
        experience: 7,
        rating: 4.4,
        availableSlots: generateTimeSlots("doc-010")
      }
    ]
  }
];

/* ============================================
 * 4. Hospital Service Functions
 * ============================================
 */

/**
 * 병원 검색 (필터링)
 */
export function searchHospitals(
  region?: Region,
  specialty?: Specialty
): Hospital[] {
  let results = [...MOCK_HOSPITALS];
  
  if (region) {
    results = results.filter(h => h.region === region);
  }
  
  if (specialty) {
    results = results.filter(h => h.specialty.includes(specialty));
  }
  
  return results.sort((a, b) => b.rating - a.rating);
}

/**
 * 병원 상세 조회
 */
export function getHospitalById(id: string): Hospital | undefined {
  return MOCK_HOSPITALS.find(h => h.id === id);
}

/**
 * 의사 상세 조회
 */
export function getDoctorById(hospitalId: string, doctorId: string): Doctor | undefined {
  const hospital = getHospitalById(hospitalId);
  return hospital?.doctors.find(d => d.id === doctorId);
}

/**
 * 특정 날짜의 가용 시간대 조회
 */
export function getAvailableSlots(
  doctorId: string,
  date: string
): TimeSlot[] {
  for (const hospital of MOCK_HOSPITALS) {
    const doctor = hospital.doctors.find(d => d.id === doctorId);
    if (doctor) {
      return doctor.availableSlots.filter(
        slot => slot.date === date && slot.isAvailable
      );
    }
  }
  return [];
}

/**
 * 슬롯 예약 (가용성 업데이트)
 */
export function bookSlot(doctorId: string, slotId: string): boolean {
  for (const hospital of MOCK_HOSPITALS) {
    const doctor = hospital.doctors.find(d => d.id === doctorId);
    if (doctor) {
      const slot = doctor.availableSlots.find(s => s.id === slotId);
      if (slot && slot.isAvailable) {
        slot.isAvailable = false;
        return true;
      }
    }
  }
  return false;
}

/* ============================================
 * 5. Access Token & Data Sharing
 * ============================================
 */

/**
 * 임시 접근 토큰 생성
 */
export function generateAccessToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'DST-'; // Data Share Token prefix
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * 접근 토큰 검증 (모킹)
 */
export function validateAccessToken(token: string): boolean {
  return token.startsWith('DST-') && token.length === 20;
}

/* ============================================
 * 6. Appointment Manager (State Management)
 * ============================================
 */

export class AppointmentManager {
  private appointments: Appointment[] = [];
  private listeners: ((appointments: Appointment[]) => void)[] = [];

  constructor(initialAppointments: Appointment[] = []) {
    this.appointments = initialAppointments;
  }

  /**
   * 예약 생성
   */
  createAppointment(
    userId: string,
    hospital: Hospital,
    doctor: Doctor,
    slot: TimeSlot,
    dataShareConsent: boolean,
    notes?: string
  ): Appointment {
    const accessToken = dataShareConsent ? generateAccessToken() : undefined;
    
    const appointment: Appointment = {
      id: `apt-${Date.now()}`,
      userId,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      slotId: slot.id,
      date: slot.date,
      time: slot.time,
      status: "confirmed",
      dataShareConsent,
      accessToken,
      createdAt: Date.now(),
      notes
    };
    
    // 슬롯 예약 처리
    bookSlot(doctor.id, slot.id);
    
    this.appointments.push(appointment);
    this.notifyListeners();
    
    return appointment;
  }

  /**
   * 예약 취소
   */
  cancelAppointment(appointmentId: string): boolean {
    const idx = this.appointments.findIndex(a => a.id === appointmentId);
    if (idx !== -1) {
      this.appointments[idx].status = "cancelled";
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * 예약 상태 업데이트
   */
  updateStatus(appointmentId: string, status: AppointmentStatus): boolean {
    const appointment = this.appointments.find(a => a.id === appointmentId);
    if (appointment) {
      appointment.status = status;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * 사용자 예약 목록 조회
   */
  getUserAppointments(userId: string): Appointment[] {
    return this.appointments
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * 예약 조회 (ID)
   */
  getAppointmentById(id: string): Appointment | undefined {
    return this.appointments.find(a => a.id === id);
  }

  /**
   * 모든 예약 조회
   */
  getAllAppointments(): Appointment[] {
    return [...this.appointments];
  }

  /**
   * 리스너 등록
   */
  subscribe(callback: (appointments: Appointment[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l([...this.appointments]));
  }
}

// 싱글톤 인스턴스
export const appointmentManager = new AppointmentManager();






