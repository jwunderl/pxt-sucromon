namespace menu {
    interface item {
        text: string;
        h: () => void;
        icon?: Image;
    }

    interface MenuStyle {
        l: number; // left
        t: number; // top
        w: number; // width
        h: number; // height
        rows: number;
        cols?: number;

        offX?: number; // x offset from left
        offY?: number; // y offset from top

        mc?: number; // border and text color
        bc?: number; // background color
        ec?: number; // emphasis color

        upArrow?: Image;
        selectArrow?: Image;
        downArrow?: Image;
        f?: image.Font;
    }

    export class Menu implements Element {
        protected style: MenuStyle;
        protected c: number; // currently selected item
        protected contents: item[];
        protected active: boolean;
        protected count: number;
        private oldDisplay: number;

        constructor(s: MenuStyle) {
            this.style = s;

            // potentially change these to === undefined checks, when that gets fixed
            if (!s.cols) s.cols = 2;
            if (!s.offX) s.offX = 5;
            if (!s.offY) s.offY = 7;
            if (!s.mc) s.mc = 0xF;
            if (!s.bc) s.bc = 0x1;
            if (!s.ec) s.ec = 0x7;

            if (!s.upArrow) {
                s.upArrow = img`
                    . . F . .
                    . F F F .
                    F F . F F
                `;
                s.upArrow.replace(0xF, s.ec);
            }

            if (!s.downArrow) {
                s.downArrow = img`
                    F F . F F
                    . F F F .
                    . . F . .
                `
                s.downArrow.replace(0xF, s.ec);
            }

            if (!s.selectArrow) {
                s.selectArrow = img`
                    F .
                    . F
                    F .
                `
                s.selectArrow.replace(0xF, s.ec);
            }
            if (!s.f) {
                s.f = image.font5;
            }

            this.count = 0;
            this.active = true;
            this.c = 0;
            this.oldDisplay = 0;
        }

        render() {
            if (!this.active) return;

            let s = this.style;
            const displayable = (s.w / s.cols - 4) / s.f.charWidth; // fix to account for gutter between cols

            draw.util.borderedBox(s.l, s.t,
                s.w, s.h,
                s.mc, s.bc);

            const firstDisplay = this.c / s.cols >= s.rows ? this.c - (this.c % (s.cols * s.rows)) : 0;

            // reset count on view change
            if (this.oldDisplay != firstDisplay) this.count = 0;
            this.oldDisplay = firstDisplay;

            for (let i = 0; i < s.rows; i++) {
                const y = s.t + s.offY + i * (s.h - s.offY) / s.rows;
                for (let j = 0; j < s.cols; j++) { // I guess generalize this and the actions to n cols
                    const curr = s.cols * i + j;
                    let element = this.contents[firstDisplay + curr];
                    if (element) {
                        const x = s.l + s.offX + j * s.w / s.cols;

                        let toDisplay = element.text;
                        // scroll item iff too long to display
                        if (toDisplay.length > displayable) {
                            const firstInd = (this.count / 15) % (toDisplay.length);
                            toDisplay = toDisplay.substr((firstInd < 3 ? 0 : firstInd - 3), displayable);
                        }

                        screen.print(toDisplay, x, y, s.mc, s.f);
                        if (firstDisplay + curr == this.c) {
                            screen.drawTransparentImage(s.selectArrow, x - 3, y + 1)
                        }
                    }
                }
            }

            if (firstDisplay != 0) {
                screen.drawTransparentImage(s.upArrow,
                    s.l + s.w / 2 - s.upArrow.width / 2,
                    s.t + 2);
            }

            if (firstDisplay + 2 * s.rows < this.contents.length) {
                screen.drawTransparentImage(s.downArrow,
                    s.l + s.w / 2 - s.downArrow.width / 2,
                    s.t + s.h - s.downArrow.height - 2);
            }
            // TODO: Shadow effect w/ gray dots off right and bottom sides
            // TODO: incl icon in math, draw it
            // hide arrow if not in focus? trivial but not sure if it would be helpful
            this.count++;
        }

        action(button: ButtonId) {
            const s = this.style;
            switch (button) {
                case ButtonId.A: {
                    let selectedElement = this.contents[this.c];
                    if (selectedElement.h) {
                        selectedElement.h();
                    }
                    break;
                }
                case ButtonId.B: {
                    this.backOut();
                    break;
                }
                case ButtonId.Up: {
                    if (this.c - s.cols >= 0) {
                        this.c -= s.cols;
                    } else {
                        this.c = Math.floor((this.contents.length - 1) / s.cols) * s.cols + this.c;
                        if (this.c >= this.contents.length) {
                            this.c -= s.cols;
                        }
                    }
                    break;
                }
                case ButtonId.Down: {
                    if (this.c + s.cols < this.contents.length) {
                        this.c += s.cols;
                    } else {
                        if (Math.floor((this.contents.length - 1) / s.cols) != Math.floor(this.c / s.cols)) {
                            this.c = this.contents.length - 1;
                        } else {
                            this.c = this.c % s.cols;
                        }
                    }
                    break;
                }
                case ButtonId.Left: {
                    if (this.c % s.cols !== 0) {
                        if (this.c - 1 >= 0) {
                            this.c -= 1;
                        }
                    } else if (this.c + 1 < this.contents.length) {
                        this.c = Math.min(this.c + s.cols - 1, this.contents.length - 1);
                    }
                    break;
                }
                case ButtonId.Right: {
                    if (this.c % s.cols === s.cols - 1 || this.c >= this.contents.length - 1) {
                        this.c -= this.c % s.cols;
                    } else if (this.c + 1 < this.contents.length) {
                        this.c += 1;
                    }
                    break;
                }
            }
        }

        // Override to modify behavior for `b`
        backOut() {
            core.popFocus();
        }
    }

    export class BattleCore extends Menu {
        constructor() {
            const s: MenuStyle = {
                l: 80,
                t: 90,
                w: 80,
                h: 30,
                rows: 2
            }
            super(s);
            this.contents = [
                {
                    text: "Move",
                    h: null
                }, {
                    text: "Item",
                    h: () => {
                        core.setFocus(new BattleItem())
                    }
                }, {
                    text: "Sucro",
                    h: null
                }, {
                    text: "Flee",
                    h: () => {
                        core.setFocus(new Confirmation(screen.width / 2 - 22, screen.height / 2 + 15, () => {
                            console.log("Failed to flee!");
                            // implement exit; % chance to super.backOut();
                            // otherwise displ "failed to flee" message
                        }));
                    }
                }
            ];
        }

        backOut() {

        }
    }

    export class BattleItem extends Menu {
        constructor() {
            const s: MenuStyle = {
                l: 20,
                t: 20,
                w: 120,
                h: 80,
                rows: 7,
                cols: 4
            }
            super(s);
            this.contents = [
                {
                    text: "Potion",
                    h: null
                }, {
                    text: "Cactus",
                    h: null
                }, {
                    text: "Potato",
                    h: null
                }, {
                    text: "Berry",
                    h: null
                }, {
                    text: "Antidote",
                    h: null
                }, {
                    text: "Ball",
                    h: null
                }
            ];

            // test elements
            for (let i = 0; i < 31; i++) {
                let lorem = String.fromCharCode(Math.randomRange(65, 90));
                for (let j = Math.randomRange(5, 12); j >= 0; j--) {
                    lorem += String.fromCharCode(Math.randomRange(97, 122));
                }

                this.contents.push(
                    {
                        text: lorem,
                        h: null
                    }
                );
            }
        }
    }

    export class Confirmation extends Menu {
        constructor(x: number, y: number, h: () => void) {
            const s: MenuStyle = {
                l: x,
                t: y,
                w: 45,
                h: 10,
                rows: 1,
                offX: 5,
                offY: 2
            };
            super(s);
            this.contents = [
                {
                    text: "Yes",
                    h: () => {
                        this.backOut()
                        h();
                    }
                }, {
                    text: "No",
                    h: () => { this.backOut() }
                }
            ];
        }
    }
}