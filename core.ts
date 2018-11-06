namespace core {
    let focus: Element;
    let hud: Element[];
    let focusStack: Element[];

    export function initUI() {
        hud = [];
        focusStack = [];
    }

    export function setFocus(e: Element) {
        if (focus) focusStack.push(focus);
        focusStack.push(e);
        popFocus();
    }

    export function popFocus() {
        if (!focusStack.length) return;
        focus = focusStack.pop();

        controller.A.onEvent(ControllerButtonEvent.Pressed, handleInput(ButtonId.A));
        controller.B.onEvent(ControllerButtonEvent.Pressed, handleInput(ButtonId.B));
        controller.left.onEvent(ControllerButtonEvent.Pressed, handleInput(ButtonId.Left));
        controller.right.onEvent(ControllerButtonEvent.Pressed, handleInput(ButtonId.Right));
        controller.up.onEvent(ControllerButtonEvent.Pressed, handleInput(ButtonId.Up));
        controller.down.onEvent(ControllerButtonEvent.Pressed, handleInput(ButtonId.Down));
    }

    export function destroy(e: Element) {
        hud.removeElement(e);
    }

    export function addToView(e: Element) {
        hud.push(e);
    }

    export function render() {
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

    function handleInput(button: ButtonId) {
        return () => (focus && focus.action(button));
    }
}