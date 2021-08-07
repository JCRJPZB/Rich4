cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.playerRound = cc.find("/SafeArea/Players");
        this.playerRound.on("park", (playerName, callBack) => { callBack(); }); // 公园暂时还没做！
    },
});
