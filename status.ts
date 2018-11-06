namespace status {
    export class MonsterStatus implements Element {
        private x: number;
        private y: number;
        private m: Monster;
        // private pendingDamage: number;  // maybe use to show decreasing health from attack over a few frames

        constructor(x: number, y: number, m: Monster) {
            this.x = x;
            this.y = y;
            this.m = m;
        }

        render() {
            const bf = image.font8;
            const sf = image.font5;
            const hp = this.m.currHealth / this.m.maxHealth;
            const fc = 0xF; // font color
            let h = this.y;
            screen.print(this.m.name, this.x, h, fc, bf);
            h += bf.charHeight + 2;

            screen.print("lvl: " + this.m.level, this.x + 10, h, fc, sf);
            h += sf.charHeight + 2;

            // outline for life
            draw.util.borderedBox(this.x, h, 60, 5, 0xF, 0x2);
            // fill life pct
            screen.fillRect(this.x + 1, h + 1, Math.clamp(0, 58, 58 * hp), 3, 0x7);
        }
    }
}