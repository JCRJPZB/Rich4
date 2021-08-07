cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        // this.node.active = false;
        this.playerRound = cc.find("/SafeArea/Players").getComponent("PlayerRound"); // 回合管理器
        this.cardMgr = cc.find("/Canvas/UI/CardPane").getComponent("CardMgr"); // 卡片管理器
        this.cards = this.cardMgr.cardJsonDict;
        this.cardBtn = this.node.getChildByName("Card"); // 卡片按钮
        this.cardBtn.on("click", this.card.bind(this), this); // 注册点击事件
        this.stockMgr = cc.find("/Canvas/UI/StockPane").getComponent("StockMgr"); // 股票管理器
        this.stockBtn = this.node.getChildByName("Stock"); // 股市按钮
        this.stockBtn.on("click", this.stock.bind(this), this); // 注册点击事件
        // this.newsPane = cc.find("/Canvas/UI/NewsPane").getComponent("News"); // 银行面板
        this.magicPane = cc.find("/Canvas/UI/MagicPane").getComponent("Magic"); // 魔法屋面板
        this.testBtn = this.node.getChildByName("Test"); // 红卡按钮
        this.testBtn.on("click", this.show.bind(this), this); // 注册点击事件
    },

    card: function () {
        for (let card in this.cards) { // 每种卡片添加一份
            this.cardMgr.addCard(this.playerRound.getPlayerName(), card);
        }
    },

    stock: function () { // 使游戏往前进一天
        this.playerRound.days++;
        this.playerRound.node.emit("newRound");
    },

    show: function () {
        // this.newsPane.generateNews(this.playerRound.getPlayerName(), () => { });
        this.playerRound.node.emit("magic", this.playerRound.getPlayerName(), () => { console.log("Over!") });
        //this.magicPane.playerEnter();
    }
});
