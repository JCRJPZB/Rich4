cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.playerRound = cc.find("/SafeArea/Players");
        this.playerRound.on("number", (playerName, callBack) => { callBack(); }); // 这玩意暂时还没做！
    },
});
