cc.Class({
    extends: cc.Component,

    properties: {
        total: 0,
        loading: 0,
        finished: 0,
    },

    onLoad: function () {
        this.game = cc.find("/Canvas").getComponent("Game");
    },

    // startListen: function () { // 开始监听
    //     this.schedule(this.checkAllResLoaded, 0.1);
    // },

    // checkAllResLoaded: function () { // 检查资源是否全部加载完
    //     if (this.total > 0 && this.total === this.finished && this.loading === 0 && !this.game.gameState) {
    //         this.game.gameStart(); // 资源加载完毕后开始游戏
    //         this.unschedule(this.checkAllResLoaded, this);
    //     }
    // },

    loadRes: function (path, type, callback, param) { // 加载资源
        cc.resources.load(path, type, (err, res) => { callback(err, res, param); })
    },

    loadResWithCount: function (path, type, callback, param) { // 带计数的加载资源
        this.total++; // 资源总数计数
        this.loading++; // 正在加载的资源计数
        cc.resources.load(path, type, (err, res) => { this.loadFinished(); callback(err, res, param); });
    },

    loadFinished: function () {
        this.loading--;
        this.finished++; // 加载完成的资源计数
    },
});
