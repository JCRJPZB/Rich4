const {ccclass, property} = cc._decorator;

@ccclass
export default class Test extends cc.Component {

    @property(cc.Label)
    playerArray: Array<cc.Label> = [];

    @property(cc.Label)
    activePlayer: cc.Label = null;

    @property(cc.Integer)
    activeIndex = -1;

    @property(cc.Integer)
    playerCount = 4;

    gameState = false;

    onLoad () {
        this.gameState = true;
    }

    start () {
        console.log("Game start!")
        this.nextPlayerRound();

    }

    nextPlayerRound() {
        this.activeIndex = (this.activeIndex + 1) % this.playerCount;
        this.activePlayer = this.playerArray[this.activeIndex];
        this.activePlayer.getComponent("TestPlayer").roundStart();
    }
}
