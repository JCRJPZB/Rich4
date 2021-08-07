cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function () {
        this.cashLbl = this.node.getChildByName("PlayerCash").getComponent(cc.Label);
        this.depositLbl = this.node.getChildByName("PlayerDeposit").getComponent(cc.Label);
        this.totalMoneyLbl = this.node.getChildByName("PlayerTotalMoney").getComponent(cc.Label);
        this.priceIndexLbl = this.node.getChildByName("PriceIndex").getComponent(cc.Label);

        this.playerAttrDire = cc.find("/SafeArea/Players").getComponent("PlayerAttrDirector");
        this.playeRound = cc.find("/SafeArea/Players").getComponent("PlayerRound"); // 回合管理器
    },

    getMoneyStr: function (num) { // 格式化显示金钱
        let numStr = num.toString();
        if (numStr.length > 3){ 
            for (let i = 0; i < (numStr.length - i) / 3 - 1; i++) {
                let place = numStr.length - (i + 1) * 3 - i;
                let temp = numStr.slice(0, place) + "," + numStr.slice(place);
                numStr = temp;
            }
        }
        return "$ " + numStr;
    },

    updateInfo: function (playerName) {
        let money = this.playerAttrDire.getPlayerMoney(playerName);
        if (money && money.length > 0) {
            this.cashLbl.string = this.getMoneyStr(money[0]);
            this.depositLbl.string = this.getMoneyStr(money[1]);
            this.totalMoneyLbl.string = this.getMoneyStr(money[2]);
        }
        this.priceIndexLbl.string = this.playeRound.getPriceIndex().toString(); // 物价指数
    },
});
