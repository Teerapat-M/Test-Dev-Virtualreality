import type { TicketQueueEntry } from "./types";
import { UnionFind } from "./unionFind";

// ตัดเบอร์โทรให้เหลือแต่ตัวเลข: "081-234-5678" → "0812345678"
export function normalizePhone(phone?: string | null): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    return digits === "" ? null : digits;
}

// ตัดช่องว่างหัวท้ายของ deviceId และ paymentAccount ถ้าเหลือแต่สตริงว่าง ถือว่าไม่มีค่า
function normalizeText(value?: string | null): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
}

export type RawGroup = {
    indexes: number[];           // ตำแหน่งของรายการใน array input
    connectionReasons: string[];
};

export function groupEntries(entries: TicketQueueEntry[]): RawGroup[] {
    const uf = new UnionFind(entries.length);
    const firstOwner = new Map<string, number>(); // "phone:081..." → index ของบัญชีแรกที่ใช้ค่านี้
    const reasonsByPair: { a: number; b: number; text: string }[] = [];

    entries.forEach((entry, i) => {
        const keys: [string, string | null][] = [
            ["phone", normalizePhone(entry.phoneNumber)],
            ["device", normalizeText(entry.deviceId)],
            ["payment", normalizeText(entry.paymentAccount)],
        ];

        for (const [type, value] of keys) {
            if (value === null) continue; // ค่าว่างต้องไม่ทำให้ใครถูกเชื่อมกัน

            const key = `${type}:${value}`;
            const owner = firstOwner.get(key);
            if (owner === undefined) {
                firstOwner.set(key, i);
            } else {
                uf.union(owner, i);
                reasonsByPair.push({
                    a: owner,
                    b: i,
                    text: `${entries[owner].id} and ${entry.id} share the same ${type}`,
                });
            }
        }
    });

    // รวบรวมรายการที่มีหัวหน้าคนเดียวกันเข้าเป็นกลุ่มเดียว
    const groupsByRoot = new Map<number, RawGroup>();
    entries.forEach((_, i) => {
        const root = uf.find(i);
        let group = groupsByRoot.get(root);
        if (!group) {
            group = { indexes: [], connectionReasons: [] };
            groupsByRoot.set(root, group);
        }
        group.indexes.push(i);
    });

    for (const r of reasonsByPair) {
        groupsByRoot.get(uf.find(r.a))!.connectionReasons.push(r.text);
    }

    return [...groupsByRoot.values()];
}