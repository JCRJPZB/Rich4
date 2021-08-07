const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    game: cc.Node = null;
    playerArray: Array<cc.Label> = [];

    onLoad () {
        this.game = cc.find("/SafeArea/Player/Main Camera");
        this.playerArray = this.game.getComponent("Test").playerArray;
    }
}
