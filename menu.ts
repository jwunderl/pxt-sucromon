namespace menu {
    interface item {
        text: string;
        h: () => void;
        icon?: Image;
        customSelect?: Image;
    }

    interface MenuStyle {
        l: number; // left
        t: number; // top
        w: number; // width
        h: number; // height

        rows: number;
        cols?: number;
        offY?: number; // y offset from top

        mc?: number; // border and text color
        bc?: number; // background color
        ec?: number; // emphasis color

        upArrow?: Image;
        selectArrow?: Image;
        downArrow?: Image;
        f?: image.Font;
    }

    export class MonsterMenu implements Element {
        protected style: MenuStyle;
        protected curr: number;
        protected contents: item[];
        protected active: boolean;
        protected count: number;

        private oldDisplay: number; // for tracking whether view has changed

        constructor(s: MenuStyle) {
            this.style = s;

            if (!s.cols) s.cols = 2;
            if (!s.offY) s.offY = 7;
            if (!s.mc) s.mc = 0xF;
            if (!s.bc) s.bc = 0x1;
            if (!s.ec) s.ec = 0x7;
            if (!s.f) s.f = image.font5;

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

            this.count = 0;
            this.active = true;
            this.curr = 0;
            this.oldDisplay = 0;
        }

        render() {
            if (!this.active) return;

            let s = this.style;
            const itemWidth = (s.w - 4) / s.cols;

            draw.util.borderedBox(s.l, s.t,
                s.w, s.h,
                s.mc, s.bc);

            const firstDisplay = this.curr / s.cols >= s.rows ?
                this.curr - (this.curr % (s.cols * s.rows))
                :
                0;

            // reset count on view change
            if (this.oldDisplay != firstDisplay) this.count = 0;
            this.oldDisplay = firstDisplay;

            for (let i = 0; i < s.rows; i++) {
                const rowHeight = (s.h - s.offY) / s.rows;
                const y = s.t + s.offY + i * rowHeight;

                for (let j = 0; j < s.cols; j++) {
                    const c = s.cols * i + j;
                    const element = this.contents[firstDisplay + c];
                    if (element) {
                        const arrow = element.customSelect ? element.customSelect : s.selectArrow;
                        const x = s.l + (j * s.w / s.cols);
                        const textXOffset = 2 + arrow.width + 1 + (element.icon ? element.icon.width + 1 : 0);
                        const displayable = Math.floor((itemWidth - textXOffset) / s.f.charWidth);

                        let toDisplay = element.text;
                        // scroll item iff too long to display
                        if (toDisplay.length > displayable) {
                            const firstInd = (this.count / 15) % (toDisplay.length);
                            toDisplay = toDisplay.substr((firstInd < 3 ? 0 : firstInd - 3), displayable);
                        }

                        if (element.icon) {
                            screen.drawTransparentImage(element.icon, x + 2 + arrow.width + 1, y + (s.f.charHeight - element.icon.height) / 2);
                        }
                        screen.print(toDisplay, x + textXOffset, y, s.mc, s.f);
                        if (firstDisplay + c == this.curr) {
                            screen.drawTransparentImage(arrow, x + 2, y + (s.f.charHeight - arrow.height) / 2);
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
            this.count++;
        }

        action(button: number) {
            const s = this.style;
            switch (button) {
                case controller.A.id: {
                    let selectedElement = this.contents[this.curr];
                    if (selectedElement.h) {
                        selectedElement.h();
                    }
                    break;
                }
                case controller.B.id: {
                    this.bAction();
                    break;
                }
                case controller.up.id: {
                    if (this.curr - s.cols >= 0) {
                        // bump up if you can
                        this.curr -= s.cols;
                    } else {
                        // otherwise find lowest element in same col
                        this.curr = Math.floor((this.contents.length - 1) / s.cols) * s.cols + this.curr;
                        if (this.curr >= this.contents.length) {
                            this.curr -= s.cols;
                        }
                    }
                    break;
                }
                case controller.down.id: {
                    if (this.curr + s.cols < this.contents.length) {
                        // bump down one row if you can
                        this.curr += s.cols;
                    } else if (Math.floor((this.contents.length - 1) / s.cols) != Math.floor(this.curr / s.cols)) {
                        // else bump down to highest element of next row if one exists
                        this.curr = this.contents.length - 1;
                    } else {
                        // else return to element in same col in row 0
                        this.curr = this.curr % s.cols;
                    }
                    break;
                }
                case controller.left.id: {
                    if (this.curr % s.cols !== 0) {
                        // move left if possible
                        if (this.curr - 1 >= 0) {
                            this.curr -= 1;
                        }
                    } else if (this.curr + 1 < this.contents.length) {
                        // if in col 0, bump around to the right most col in this row
                        this.curr = Math.min(this.curr + s.cols - 1, this.contents.length - 1);
                    }
                    break;
                }
                case controller.right.id: {
                    if (this.curr % s.cols === s.cols - 1 || this.curr >= this.contents.length - 1) {
                        // bump around to leftmost col in this row if in rightmost col
                        this.curr -= this.curr % s.cols;
                    } else if (this.curr + 1 < this.contents.length) {
                        // else bump right if possible
                        this.curr += 1;
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

    export class BattleCore extends MonsterMenu {
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
                    h: undefined,
                    icon: undefined
                }, {
                    text: "Item",
                    h: () => {
                        core.setFocus(new BattleItem())
                    },
                    icon: undefined
                }, {
                    text: "Sucro",
                    h: undefined,
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

    export class BattleItem extends MonsterMenu {
        constructor() {
            const s: MenuStyle = {
                l: 20,
                t: 20,
                w: 120,
                h: 80,
                rows: 7,
                cols: 2
            }
            super(s);
            this.contents = [
                {
                    text: "Potion",
                    h: undefined,
                    icon: undefined
                }, {
                    text: "Cactus",
                    h: undefined,
                    icon: undefined
                }, {
                    text: "Potato",
                    h: undefined,
                    icon: undefined
                }, {
                    text: "Berry",
                    h: undefined,
                    icon: undefined
                }, {
                    text: "Antidote",
                    h: undefined,
                    icon: undefined
                }, {
                    text: "Ball",
                    h: undefined,
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
                        h: undefined,
                        icon: undefined
                    }
                );
            }
            // <\ test elements>
        }
    }

    export class Confirmation extends MonsterMenu {
        constructor(x: number, y: number, h: () => void) {
            const s: MenuStyle = {
                l: x,
                t: y,
                w: 60,
                h: 11,
                rows: 1,
                offY: 3
            };
            super(s);
            this.contents = [
                {
                    text: "Yes",
                    h: () => {
                        core.popFocus();
                        h();
                    },
                    icon: undefined,
                    customSelect: img`
                        . . . . 7
                        7 . . 7 .
                        . 7 7 . .
                        . 7 . . .
                    `
                }, {
                    text: "No",
                    h: () => {
                        core.popFocus();
                    },
                    icon: undefined,
                    customSelect: img`
                        2 . . 2
                        . 2 2 .
                        . 2 2 .
                        2 . . 2
                    `
                }
            ];
        }
    }
}