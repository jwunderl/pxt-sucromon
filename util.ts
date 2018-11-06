namespace draw.util {
    export function borderedBox(x: number,
        y: number,
        width: number,
        height: number,
        mainColor: number,
        bkgdColor: number) {
        screen.fillRect(x + 1, y + 1, width - 2, height - 2, bkgdColor);
        screen.drawRect(x, y, width, height, mainColor);
    }
}