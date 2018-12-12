interface Element {
    render(): void;
    action?(b: number): void;
}

namespace core {
    let focus: Element;
    let hud: Element[];
    let focusStack: Element[];

    function initUI() {
        if (focusStack != undefined) return;
        hud = [];
        focusStack = [];

        [
            controller.A,
            controller.B,
            controller.left,
            controller.right,
            controller.up,
            controller.down
        ].forEach(b => {
            b.onEvent(ControllerButtonEvent.Pressed, handleInput(b.id));
            b.onEvent(ControllerButtonEvent.Repeated, handleInput(b.id));
            b.repeatDelay = 500;
            b.repeatInterval = 350;
        });
    }

    export function setFocus(e: Element) {
        initUI();
        if (focus) focusStack.push(focus);
        focusStack.push(e);
        popFocus();
    }

    export function popFocus() {
        initUI();
        if (!focusStack.length) return;
        focus = focusStack.pop();
    }

    export function destroy(e: Element) {
        initUI();
        hud.removeElement(e);
    }

    export function addToView(e: Element) {
        initUI();
        hud.push(e);
    }

    export function render() {
        initUI();
        // Menus, game elements
        for (let e of focusStack) {
            e.render();
        }

        // HUDs, status bars, hints
        for (let e of hud) {
            e.render();
        }

        // Current controlled element
        if (focus) {
            focus.render();
        }
    }

    function handleInput(button: number) {
        return () => (focus && focus.action(button));
    }
}