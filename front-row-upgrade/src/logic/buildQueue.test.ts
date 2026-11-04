import { describe, it, expect } from "vitest";
import { buildFrontRowUpgradeQueue } from "../buildQueue";
import type { TicketQueueEntry } from "../types";

const NOW = new Date("2026-11-05T10:00:00Z");

// สร้างรายการตัวอย่าง ใส่เฉพาะฟิลด์ที่ต่างจากค่าเริ่มต้น
function make(id: string, overrides: Partial<TicketQueueEntry> = {}): TicketQueueEntry {
  return {
    id, fanId: `fan-${id}`, fanName: `Fan ${id}`,
    ticketValue: 1000,
    joinedQueueAt: "2026-11-05T09:00:00Z",
    eventStartsAt: "2026-11-05T20:00:00Z",
    status: "waiting", membership: "regular",
    phoneNumber: null, deviceId: null, paymentAccount: null,
    ...overrides,
  };
}

describe("buildFrontRowUpgradeQueue", () => {
  it("1. cancelled entries cannot win", () => {
    const result = buildFrontRowUpgradeQueue(
      [make("A", { status: "cancelled", joinedQueueAt: "2026-11-05T06:00:00Z" }), make("B")], NOW);
    expect(result.winner?.entry.id).toBe("B");
    expect(result.excludedEntries[0].reasons).toContain("Cancelled entry");
  });

  it("2. entries after the concert start time cannot win", () => {
    const result = buildFrontRowUpgradeQueue(
      [make("A", { eventStartsAt: "2026-11-05T09:30:00Z" })], NOW);
    expect(result.winner).toBeNull();
    expect(result.excludedEntries[0].reasons).toContain("Concert has already started");
  });

  it("3. blocked fans cannot win", () => {
    const result = buildFrontRowUpgradeQueue(
      [make("A", { membership: "blocked", joinedQueueAt: "2026-11-05T06:00:00Z" }), make("B")], NOW);
    expect(result.winner?.entry.id).toBe("B");
  });

  it("4. invalid or zero ticket values cannot win", () => {
    const entries = [
      make("A", { ticketValue: 0 }),
      make("B", { ticketValue: "abc" }),
      make("C", { ticketValue: null }),
      make("D", { ticketValue: -50 }),
      make("E", { ticketValue: "1,500" }),
    ];
    const result = buildFrontRowUpgradeQueue(entries, NOW);
    expect(result.winner?.entry.id).toBe("E");
    expect(result.excludedEntries.map((x) => x.entry.id).sort()).toEqual(["A", "B", "C", "D"]);
  });

  it("5. different phone formatting connects entries", () => {
    const result = buildFrontRowUpgradeQueue([
      make("A", { phoneNumber: "081-234-5678" }),
      make("B", { phoneNumber: "081 234 5678" }),
      make("C", { phoneNumber: "0812345678" }),
    ], NOW);
    expect(result.fanGroups).toHaveLength(1);
    expect(result.fanGroups[0].entries).toHaveLength(3);
  });

  it("6. indirect connections create one fan group", () => {
    const result = buildFrontRowUpgradeQueue([
      make("A", { phoneNumber: "0811111111" }),
      make("B", { phoneNumber: "0811111111", deviceId: "dev-1" }),
      make("C", { deviceId: "dev-1" }),
      make("D"),
    ], NOW);
    expect(result.fanGroups).toHaveLength(2);
    const big = result.fanGroups.find((g) => g.entries.length === 3)!;
    expect(big.entries.map((e) => e.id).sort()).toEqual(["A", "B", "C"]);
  });

  it("7. the same input always gives the same winner and does not mutate input", () => {
    const entries = [make("B"), make("A"), make("C", { membership: "vip" })];
    const snapshot = JSON.stringify(entries);
    const first = buildFrontRowUpgradeQueue(entries, NOW);
    const second = buildFrontRowUpgradeQueue([...entries].reverse(), NOW);
    expect(first.winner?.entry.id).toBe(second.winner?.entry.id);
    expect(JSON.stringify(entries)).toBe(snapshot);
  });

  it("edge 1: empty values never connect accounts", () => {
    const result = buildFrontRowUpgradeQueue([
      make("A", { deviceId: "", phoneNumber: "-", paymentAccount: "   " }),
      make("B", { deviceId: "", phoneNumber: "-", paymentAccount: "   " }),
    ], NOW);
    expect(result.fanGroups).toHaveLength(2);
  });

  it("edge 2: a big linked group still gets only one candidate", () => {
    const linked = Array.from({ length: 50 }, (_, i) =>
      make(`G${String(i).padStart(2, "0")}`, { paymentAccount: "same-card", joinedQueueAt: "2026-11-05T07:00:00Z" }));
    const result = buildFrontRowUpgradeQueue([...linked, make("Solo")], NOW);
    expect(result.candidates).toHaveLength(2);
  });

  it("edge 3: ties are broken by joinedQueueAt, then by id", () => {
    const result = buildFrontRowUpgradeQueue([
      make("B", { joinedQueueAt: "2026-11-05T09:00:00Z" }),
      make("A", { joinedQueueAt: "2026-11-05T09:00:20Z" }),
      make("C", { joinedQueueAt: "2026-11-05T09:00:00Z" }),
    ], NOW);
    expect(result.candidates.map((c) => c.entry.id)).toEqual(["B", "C", "A"]);
  });

  it("performance: 200k entries finish quickly", () => {
    const big = Array.from({ length: 200_000 }, (_, i) =>
      make(`E${i}`, { phoneNumber: `08${i % 50_000}`, deviceId: `d${i}` }));
    const start = performance.now();
    const result = buildFrontRowUpgradeQueue(big, NOW);
    expect(result.fanGroups).toHaveLength(50_000);
    expect(performance.now() - start).toBeLessThan(5000);
  });
});