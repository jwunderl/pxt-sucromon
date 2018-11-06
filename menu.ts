namespace menu {
    interface item {
        text: string;
        h: () => void;
        icon: Image;
    }

    interface MenuStyle {
        l: number; // left
        t: number; // top
        w: number; // width
        h: number; // height
        rows: number;
        cols?: number;

        // offX?: number; // x offset from left
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
            // if (!s.offX) s.offX = 5;
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
            /**
             * total width:
             *      4 (l and r borders)
             *      s.cols * itemW
             * itemW:
             *      s.selectArrow.width()
             *      + 2 (arrow padding)
             *      ?+ s.icon.width() + 2
             *      + s.f.fontWidth() + 1 padding
             */
            const itemWidth = (s.w - 4) / s.cols;

            draw.util.borderedBox(s.l, s.t,
                s.w, s.h,
                s.mc, s.bc);

            const firstDisplay = this.c / s.cols >= s.rows ?
                this.c - (this.c % (s.cols * s.rows))
                :
                0;

            // reset count on view change
            if (this.oldDisplay != firstDisplay) this.count = 0;
            this.oldDisplay = firstDisplay;

            for (let i = 0; i < s.rows; i++) {
                const y = s.t + s.offY + i * (s.h - s.offY) / s.rows; // account for font height
                for (let j = 0; j < s.cols; j++) { // generalize rendering as described above
                    const curr = s.cols * i + j;
                    const element = this.contents[firstDisplay + curr];
                    if (element) {
                        const x = s.l + (j * s.w / s.cols);
                        const textXOffset = 2 + s.selectArrow.width + 1 + (element.icon ? element.icon.width + 1 : 0);
                        const displayable = Math.floor((itemWidth - textXOffset) / s.f.charWidth); // fix to account for gutter between cols

                        let toDisplay = element.text;
                        // scroll item iff too long to display
                        if (toDisplay.length > displayable) {
                            const firstInd = (this.count / 15) % (toDisplay.length);
                            toDisplay = toDisplay.substr((firstInd < 3 ? 0 : firstInd - 3), displayable);
                        }

                        if (element.icon) {
                            screen.drawTransparentImage(element.icon, x + 3 + s.selectArrow.width, y);
                        }
                        screen.print(toDisplay, x + textXOffset, y, s.mc, s.f);
                        if (firstDisplay + curr === this.c) {
                            screen.drawTransparentImage(s.selectArrow, x + 2, y + 1)
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
            // TODO: Shadow effect w/ gray dots off right and bottom sides iff this = top element
            // TODO: incl icon in math, draw it
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
                    this.bAction();
                    break;
                }
                case ButtonId.Up: {
                    if (this.c - s.cols >= 0) {
                        // bump up if you can
                        this.c -= s.cols;
                    } else {
                        // otherwise find lowest element in same col
                        this.c = Math.floor((this.contents.length - 1) / s.cols) * s.cols + this.c;
                        if (this.c >= this.contents.length) {
                            this.c -= s.cols;
                        }
                    }
                    break;
                }
                case ButtonId.Down: {
                    if (this.c + s.cols < this.contents.length) {
                        // bump down one row if you can
                        this.c += s.cols;
                    } else if (Math.floor((this.contents.length - 1) / s.cols) != Math.floor(this.c / s.cols)) {
                        // else bump down to highest element of next row if one exists
                        this.c = this.contents.length - 1;
                    } else {
                        // else return to element in same col in row 0
                        this.c = this.c % s.cols;
                    }
                    break;
                }
                case ButtonId.Left: {
                    if (this.c % s.cols !== 0) {
                        // move left if possible
                        if (this.c - 1 >= 0) {
                            this.c -= 1;
                        }
                    } else if (this.c + 1 < this.contents.length) {
                        // if in col 0, bump around to the right most col in this row
                        this.c = Math.min(this.c + s.cols - 1, this.contents.length - 1);
                    }
                    break;
                }
                case ButtonId.Right: {
                    if (this.c % s.cols === s.cols - 1 || this.c >= this.contents.length - 1) {
                        // bump around to leftmost col in this row if in rightmost col
                        this.c -= this.c % s.cols;
                    } else if (this.c + 1 < this.contents.length) {
                        // else bump right if possible
                        this.c += 1;
                    }
                    break;
                }
            }
        }

        // Override to modify behavior for `b`
        bAction() {
            core.popFocus();
        }

        // add menu action that pops focus by default as well
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
                    h: null,
                    icon: undefined
                }, {
                    text: "Item",
                    h: () => {
                        core.setFocus(new BattleItem())
                    },
                    icon: undefined
                }, {
                    text: "Sucro",
                    h: null,
                    icon: undefined
                }, {
                    text: "Flee",
                    h: () => {
                        core.setFocus(new Confirmation(screen.width / 2 - 22, screen.height / 2 + 15, () => {
                            console.log("Failed to flee!");
                            // implement exit; % chance to super.bAction();
                            // otherwise displ "failed to flee" message
                        }));
                    },
                    icon: undefined
                }
            ];
            // <test>
            for (let i = 0; i < this.contents.length; i++) {
                // this.contents[i].icon = img`
                // 2 . . 2 .
                // 2 2 2 2 2
                // 2 2 2 2 2
                // 2 2 2 2 2
                // 2 . . 2 .
                // `
                this.contents[i].icon = img`
                2
                2
                2
                2
                2
                `
            }
            // </ test>
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
                cols: 3
            }
            super(s);
            this.contents = [
                {
                    text: "Potion",
                    h: null,
                    icon: undefined
                }, {
                    text: "Cactus",
                    h: null,
                    icon: undefined
                }, {
                    text: "Potato",
                    h: null,
                    icon: undefined
                }, {
                    text: "Berry",
                    h: null,
                    icon: undefined
                }, {
                    text: "Antidote",
                    h: null,
                    icon: undefined
                }, {
                    text: "Ball",
                    h: null,
                    icon: undefined
                }
            ];

            // <test elements>
            for (let i = 0; i < 31; i++) {
                let lorem = String.fromCharCode(Math.randomRange(65, 90));
                for (let j = Math.randomRange(5, 12); j >= 0; j--) {
                    lorem += String.fromCharCode(Math.randomRange(97, 122));
                }

                this.contents.push(
                    {
                        text: lorem,
                        h: null,
                        icon: undefined
                    }
                );
            }
            // <\ test elements>
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
                // offX: 5,
                offY: 2
            };
            super(s);
            this.contents = [
                {
                    text: "Yes",
                    h: () => {
                        core.popFocus();
                        h();
                    },
                    icon: undefined
                }, {
                    text: "No",
                    h: () => {
                        core.popFocus();
                    },
                    icon: undefined
                }
            ];
        }
    }
}