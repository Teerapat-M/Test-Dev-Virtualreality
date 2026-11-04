import type { TicketQueueEntry } from "./types";

// แปลงราคาตั๋วเป็นตัวเลข ถ้าใช้ไม่ได้ให้คืน null
export function parseTicketValue(value: string | number | null): number | null {
    if (value === null || value === undefined) return null;

    let num: number;
    if (typeof value === "number") {
        num = value;
    } else {
        const cleaned = value.replace(/,/g, "").trim(); // "1,500" → "1500"
        if (cleaned === "") return null;
        num = Number(cleaned); // "abc" → NaN
    }

    if (!Number.isFinite(num) || num <= 0) return null; // NaN, Infinity, 0, ติดลบ
    return num;
}

// คืนเหตุผลทุกข้อที่ทำให้รายการนี้ไม่มีสิทธิ์ ถ้าได้ array ว่าง แปลว่ามีสิทธิ์
export function getExclusionReasons(entry: TicketQueueEntry, now: Date): string[] {
    const reasons: string[] = [];

    if (entry.status === "cancelled") reasons.push("Cancelled entry");
    if (entry.status === "upgraded") reasons.push("Already upgraded");
    if (entry.membership === "blocked") reasons.push("Blocked fan");

    const startsAt = new Date(entry.eventStartsAt).getTime();
    if (Number.isNaN(startsAt)) {
        reasons.push("Invalid event start time");
    } else if (now.getTime() >= startsAt) {
        reasons.push("Concert has already started");
    }

    if (parseTicketValue(entry.ticketValue) === null) {
        reasons.push("Invalid ticket value");
    }

    return reasons;
}