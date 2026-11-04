import type { RankedEntry, ScoringMode, TicketQueueEntry } from "./types";

// ตัวเลขทั้งหมดของสูตรอยู่ที่นี่ที่เดียว แต่ละโหมดแค่เปลี่ยนค่า
export function getWeights(mode: ScoringMode) {
    return {
        pointsPerWaitMinute: mode.rushHour ? 1.5 : 1,
        maxWaitMinutes: 720, // เพดาน 12 ชั่วโมง
        loyaltyMultiplier: 0.1,
        vipBonus: mode.vipHour ? 60 : 30,
        penaltyPerRecentUpgrade: mode.fairQueue ? 150 : 60,
    };
}

export const DEFAULT_MODE: ScoringMode = { rushHour: false, vipHour: false, fairQueue: false };

export function scoreEntry(
    entry: TicketQueueEntry,
    now: Date,
    mode: ScoringMode = DEFAULT_MODE,
): RankedEntry {
    const w = getWeights(mode);
    const reasons: string[] = [];

    // 1. เวลารอ
    const joinedAt = new Date(entry.joinedQueueAt).getTime();
    const rawMinutes = Number.isNaN(joinedAt) ? 0 : (now.getTime() - joinedAt) / 60000;
    const waitMinutes = Math.min(Math.max(rawMinutes, 0), w.maxWaitMinutes);
    const waitPoints = Math.floor(waitMinutes) * w.pointsPerWaitMinute;
    reasons.push(`Waited ${Math.floor(waitMinutes)} min: +${waitPoints}`);

    // 2. loyalty (null หรือไม่มีค่า นับเป็น 0)
    const loyalty = Math.max(entry.loyaltyPoints ?? 0, 0);
    const loyaltyPoints = loyalty * w.loyaltyMultiplier;
    if (loyaltyPoints > 0) reasons.push(`Loyalty ${loyalty}: +${loyaltyPoints}`);

    // 3. VIP
    const vipPoints = entry.membership === "vip" ? w.vipBonus : 0;
    if (vipPoints > 0) reasons.push(`VIP member: +${vipPoints}`);

    // 4. หักแต้มคนที่เพิ่งได้อัป
    const recent = Math.max(entry.upgradesLast30Days ?? 0, 0);
    const penalty = recent * w.penaltyPerRecentUpgrade;
    if (penalty > 0) reasons.push(`${recent} upgrade(s) in last 30 days: -${penalty}`);

    const score = Math.round((waitPoints + loyaltyPoints + vipPoints - penalty) * 100) / 100;
    return { entry, score, reasons };
}

// เรียงลำดับ: คะแนนมากก่อน → ถ้าเท่า ใครเข้าคิวก่อน → ถ้ายังเท่า id น้อยกว่า
export function compareRanked(a: RankedEntry, b: RankedEntry): number {
    if (a.score !== b.score) return b.score - a.score;

    const ta = new Date(a.entry.joinedQueueAt).getTime();
    const tb = new Date(b.entry.joinedQueueAt).getTime();
    const safeA = Number.isNaN(ta) ? Infinity : ta; // วันที่พังไปอยู่ท้าย
    const safeB = Number.isNaN(tb) ? Infinity : tb;
    if (safeA !== safeB) return safeA < safeB ? -1 : 1;

    return a.entry.id < b.entry.id ? -1 : a.entry.id > b.entry.id ? 1 : 0;
}