let m1: Monster = {
    name: "Monsterio",
    level: 50,
    maxHealth: 50,
    currHealth: 50
};
core.addToView(new status.MonsterStatus(1, 1, m1))
game.onUpdateInterval(1000, function () {
    m1.currHealth--
})
let m2: Monster = {
    name: "Corger",
    level: 100,
    maxHealth: 100,
    currHealth: 50
};
core.addToView(new status.MonsterStatus(95, 67, m2))

core.setFocus(new menu.BattleCore());