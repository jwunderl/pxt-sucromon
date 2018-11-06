scene.setBackgroundColor(1);
core.initUI();
core.setFocus(new menu.BattleCore());

//test
let m1: status.Monster = {
    name: "Monsterio",
    lvl: 50,
    maxHealth: 50,
    currHealth: 50
};
core.addToView(new status.MonsterStatus(1, 1, m1))
game.onUpdateInterval(250, function () {
    m1.currHealth--
})
let m2: status.Monster = {
    name: "Corger",
    lvl: 100,
    maxHealth: 100,
    currHealth: 50
};
core.addToView(new status.MonsterStatus(95, 67, m2))
// \test

game.eventContext().registerFrameHandler(150, core.render);
 