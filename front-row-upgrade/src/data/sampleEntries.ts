import type { TicketQueueEntry } from "../logic/types";

// ข้อมูลตัวอย่าง ครอบคลุมทุกเคสที่โจทย์พูดถึง
export const START_TIME = new Date("2026-11-05T18:00:00+07:00");

export const sampleEntries: TicketQueueEntry[] = [
    { id: "E1", fanId: "F1", fanName: "Ploy", ticketValue: 3500, joinedQueueAt: "2026-11-05T15:00:00+07:00", eventStartsAt: "2026-11-05T20:00:00+07:00", status: "waiting", loyaltyPoints: 400, upgradesLast30Days: 0, membership: "regular", phoneNumber: "081-234-5678", deviceId: "dev-ploy", paymentAccount: "acc-ploy" },
    { id: "E2", fanId: "F2", fanName: "Ploy (2nd account)", ticketValue: "3500", joinedQueueAt: "2026-11-05T14:30:00+07:00", eventStartsAt: "2026-11-05T20:00:00+07:00", status: "waiting", loyaltyPoints: 50, upgradesLast30Days: 2, membership: "regular", phoneNumber: "081 234 5678", deviceId: "dev-shared", paymentAccount: null },
    { id: "E3", fanId: "F3", fanName: "Ploy's friend device", ticketValue: 2000, joinedQueueAt: "2026-11-05T16:00:00+07:00", eventStartsAt: "2026-11-05T20:00:00+07:00", status: "waiting", loyaltyPoints: 0, upgradesLast30Days: 0, membership: "regular", phoneNumber: null, deviceId: "dev-shared", paymentAccount: "acc-other" },
    { id: "E4", fanId: "F4", fanName: "Mint (VIP)", ticketValue: 5000, joinedQueueAt: "2026-11-05T16:30:00+07:00", eventStartsAt: "2026-11-05T20:00:00+07:00", status: "waiting", loyaltyPoints: 900, upgradesLast30Days: 0, membership: "vip", phoneNumber: "0899999999", deviceId: "", paymentAccount: "acc-mint" },
    { id: "E5", fanId: "F5", fanName: "Top", ticketValue: 1800, joinedQueueAt: "2026-11-05T14:00:00+07:00", eventStartsAt: "2026-11-05T20:00:00+07:00", status: "waiting", loyaltyPoints: 100, upgradesLast30Days: 3, membership: "regular", phoneNumber: "0861112222", deviceId: "", paymentAccount: null },
    { id: "E6", fanId: "F6", fanName: "Nam", ticketValue: 2500, joinedQueueAt: "2026-11-05T17:00:00+07:00", eventStartsAt: "2026-11-05T20:00:00+07:00", status: "waiting", loyaltyPoints: 1200, upgradesLast30Days: null, membership: "regular", phoneNumber: null, deviceId: null, paymentAccount: null },
    { id: "E7", fanId: "F7", fanName: "Cancelled fan", ticketValue: 3000, joinedQueueAt: "2026-11-05T12:00:00+07:00", eventStartsAt: "2026-11-05T20:00:00+07:00", status: "cancelled", loyaltyPoints: 500, membership: "regular" },
    { id: "E8", fanId: "F8", fanName: "Blocked fan", ticketValue: 3000, joinedQueueAt: "2026-11-05T12:00:00+07:00", eventStartsAt: "2026-11-05T20:00:00+07:00", status: "waiting", membership: "blocked" },
    { id: "E9", fanId: "F9", fanName: "Free ticket", ticketValue: 0, joinedQueueAt: "2026-11-05T13:00:00+07:00", eventStartsAt: "2026-11-05T20:00:00+07:00", status: "waiting", membership: "regular" },
    { id: "E10", fanId: "F10", fanName: "Bad price", ticketValue: "abc", joinedQueueAt: "2026-11-05T13:00:00+07:00", eventStartsAt: "2026-11-05T20:00:00+07:00", status: "waiting", membership: "vip" },
    { id: "E11", fanId: "F11", fanName: "Already upgraded", ticketValue: 4000, joinedQueueAt: "2026-11-05T11:00:00+07:00", eventStartsAt: "2026-11-05T20:00:00+07:00", status: "upgraded", membership: "regular" },
    { id: "E12", fanId: "F12", fanName: "Early show fan", ticketValue: 2200, joinedQueueAt: "2026-11-05T15:30:00+07:00", eventStartsAt: "2026-11-05T18:30:00+07:00", status: "waiting", loyaltyPoints: 300, membership: "regular" },
];