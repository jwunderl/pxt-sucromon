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
            const fc = 0xF; // font color
            const barWidth = 60;
            let h = this.y;
            
            screen.print(this.m.name, this.x, h, fc, image.font8);
            h += image.font8.charHeight + 2;

            screen.print("lvl: " + this.m.level, this.x + 10, h, fc, image.font5);
            h += image.font5.charHeight + 2;

            // outline for life
            draw.util.borderedBox(this.x, h, barWidth + 2, 5, 0xF, 0x2);
            // fill life pct
            screen.fillRect(this.x + 1, h + 1, Math.clamp(0, barWidth, barWidth * this.m.currHealth / this.m.maxHealth), 3, 0x7);
        }
    }
}