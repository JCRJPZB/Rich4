cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.playerRound = cc.find("/SafeArea/Players");
        this.playerRound.on("prison", (playerName, callBack) => { callBack(); }); // 监狱暂时还没做！
    },
});
