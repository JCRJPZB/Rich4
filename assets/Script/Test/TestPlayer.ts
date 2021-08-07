const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    game: cc.Node = null;

    onLoad() {
        this.game = cc.find("/SafeArea/Player/Main Camera");
    }

    roundStart() {
        this.scheduleOnce(function () {
            this.moveCallback();
        }, 0.2);
    }

    moveCallback() {
        cc.tween(this.node)
            .to(0.5, { position: cc.v3(Math.random() * 600 - 300, Math.random() * 600 - 300) })
            // .call(() => { this.game.getComponent("Test").nextPlayerRound(); })
            .start();
    }
}
