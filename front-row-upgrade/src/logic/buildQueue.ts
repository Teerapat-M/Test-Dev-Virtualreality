import { getExclusionReasons } from "./eligibility";
import { groupEntries } from "./grouping";
import { compareRanked, DEFAULT_MODE, scoreEntry } from "./scoring";
import type {
    ExcludedEntry, FanGroup, FrontRowUpgradeResult, RankedEntry, ScoringMode, TicketQueueEntry,
} from "./types";

export function buildFrontRowUpgradeQueue(
    entries: TicketQueueEntry[],
    now: Date,
    mode: ScoringMode = DEFAULT_MODE,
): FrontRowUpgradeResult {
    // 1. คัดออก (ไม่แก้ input แค่จดไว้ว่า index ไหนมีสิทธิ์)
    const excludedEntries: ExcludedEntry[] = [];
    const eligible: boolean[] = entries.map((entry) => {
        const reasons = getExclusionReasons(entry, now);
        if (reasons.length > 0) {
            excludedEntries.push({ entry, reason: reasons.join(", "), reasons });
            return false;
        }
        return true;
    });

    // 2. จัดกลุ่มจากทุกรายการ
    const rawGroups = groupEntries(entries);

    // 3. เลือกตัวแทนของแต่ละกลุ่ม (เฉพาะคนที่มีสิทธิ์)
    const fanGroups: FanGroup[] = rawGroups.map((g) => {
        const ranked: RankedEntry[] = g.indexes
            .filter((i) => eligible[i])
            .map((i) => scoreEntry(entries[i], now, mode))
            .sort(compareRanked);

        const groupEntriesList = g.indexes.map((i) => entries[i]);
        const smallestId = groupEntriesList.map((e) => e.id).sort()[0];

        return {
            id: `group-${smallestId}`,
            entries: groupEntriesList,
            representative: ranked[0] ?? null,
            connectionReasons: g.connectionReasons,
        };
    });

    // เรียงกลุ่มตาม id ให้ลำดับออกมาเหมือนเดิมทุกครั้ง
    fanGroups.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    // 4. เลือกผู้ชนะจากตัวแทนทุกกลุ่ม
    const candidates = fanGroups
        .map((g) => g.representative)
        .filter((r): r is RankedEntry => r !== null)
        .sort(compareRanked);

    const winner = candidates[0] ?? null;
    if (winner) {
        winner.reasons = [`Highest score among ${candidates.length} fan group(s)`, ...winner.reasons];
    }

    return { winner, candidates, fanGroups, excludedEntries };
}