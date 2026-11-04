export type Membership = "regular" | "vip" | "blocked";
export type EntryStatus = "waiting" | "upgraded" | "cancelled";

// หน้าตาข้อมูลตามโจทย์ ห้ามแก้ เพราะคนตรวจจะใช้ข้อมูลรูปแบบนี้
export type TicketQueueEntry = {
  id: string;
  fanId: string;
  fanName: string;
  ticketValue: string | number | null;
  joinedQueueAt: string;
  eventStartsAt: string;
  status: EntryStatus;
  loyaltyPoints?: number | null;
  upgradesLast30Days?: number | null;
  membership?: Membership;
  phoneNumber?: string | null;
  deviceId?: string | null;
  paymentAccount?: string | null;
};

export type RankedEntry = {
  entry: TicketQueueEntry;
  score: number;
  reasons: string[]; // คำอธิบายว่าคะแนนมาจากไหน
};

export type FanGroup = {
  id: string;
  entries: TicketQueueEntry[];
  representative: RankedEntry | null;
  connectionReasons: string[]; // เช่น "A และ B ใช้เบอร์เดียวกัน"
};

export type ExcludedEntry = {
  entry: TicketQueueEntry;
  reason: string;    // ทุกเหตุผลต่อกันเป็นข้อความเดียว (ตามรูปแบบของโจทย์)
  reasons: string[]; // ส่วนที่เพิ่มเอง: เก็บเหตุผลแยกเป็นข้อ
};

export type ScoringMode = {
  rushHour: boolean;
  vipHour: boolean;
  fairQueue: boolean;
};

export type FrontRowUpgradeResult = {
  winner: RankedEntry | null;
  candidates: RankedEntry[]; // ส่วนที่เพิ่มเอง: ตัวแทนทุกกลุ่มเรียงตามคะแนน ใช้แสดง top 3 บน UI
  fanGroups: FanGroup[];
  excludedEntries: ExcludedEntry[];
};