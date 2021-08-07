cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.playerRound = cc.find("/SafeArea/Players");
        this.playerRound.on("hospital", (playerName, callBack) => { callBack(); }); // 医院暂时还没做！
    },
});
