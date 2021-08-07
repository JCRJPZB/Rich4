cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.playerRound = cc.find("/SafeArea/Players");
        this.playerRound.on("onSale", (playerName, callBack) => { callBack(); }); // 商店暂时还没做！
    },
});
