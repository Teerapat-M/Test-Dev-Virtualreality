// Union-Find (Disjoint Set) ใช้ index ของบัญชีเป็นตัวแทนแต่ละคน
export class UnionFind {
    private parent: number[]; // parent[i] = หัวหน้าของ i
    private rank: number[];   // ความสูงโดยประมาณของต้นไม้ ใช้ตัดสินว่าใครขึ้นกับใคร

    constructor(size: number) {
        // ตอนเริ่ม ทุกคนเป็นหัวหน้าของตัวเอง
        this.parent = Array.from({ length: size }, (_, i) => i);
        this.rank = new Array(size).fill(0);
    }

    // หาหัวหน้าสูงสุดของ x
    find(x: number): number {
        let root = x;
        while (this.parent[root] !== root) root = this.parent[root];

        // path compression: ให้ทุกคนที่เดินผ่าน ชี้ตรงไปหาหัวหน้าเลย
        // ครั้งหน้าจะ find ได้เร็วขึ้น
        while (this.parent[x] !== root) {
            const next = this.parent[x];
            this.parent[x] = root;
            x = next;
        }
        return root;
    }

    // รวมกลุ่มของ a กับ b
    union(a: number, b: number): void {
        const rootA = this.find(a);
        const rootB = this.find(b);
        if (rootA === rootB) return; // อยู่กลุ่มเดียวกันอยู่แล้ว

        // union by rank: ให้ต้นไม้ที่เตี้ยกว่าไปขึ้นกับต้นที่สูงกว่า ต้นไม้จะได้ไม่สูงเกินไป
        if (this.rank[rootA] < this.rank[rootB]) {
            this.parent[rootA] = rootB;
        } else if (this.rank[rootA] > this.rank[rootB]) {
            this.parent[rootB] = rootA;
        } else {
            this.parent[rootB] = rootA;
            this.rank[rootA]++;
        }
    }
}