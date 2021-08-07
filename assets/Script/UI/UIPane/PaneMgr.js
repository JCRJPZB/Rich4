cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function () {
        this.playerMgr = cc.find("/SafeArea/Players").getComponent("PlayerMgr"); // 玩家管理器
        this.playerAttrDire = cc.find("/SafeArea/Players").getComponent("PlayerAttrDirector"); // 玩家属性

        this.fundPane = this.node.getChildByName("FundPane");
        this.LandPane = this.node.getChildByName("LandPane");
        this.StockPane = this.node.getChildByName("StockPane");
        this.OtherPane = this.node.getChildByName("OtherPane");
        this.paneDict = { "Fund": this.fundPane, "Land": this.LandPane, "Stock": this.StockPane, "Other": this.OtherPane };

        this.playerInfo = this.node.getChildByName("PlayerInfo").getComponent("PlayerInfo");

        this.exchangeBtnGroup = this.node.getChildByName("ExchangeBtnGroup");
        this.fundBtn = this.exchangeBtnGroup.getChildByName("FundBtn");
        this.landBtn = this.exchangeBtnGroup.getChildByName("LandBtn");
        this.stockBtn = this.exchangeBtnGroup.getChildByName("StockBtn");
        this.otherBtn = this.exchangeBtnGroup.getChildByName("OtherBtn");

        this.fundBtn.on("click", () => { this.exchangePane("Fund"); }, this);
        this.landBtn.on("click", () => { this.exchangePane("Land"); }, this);
        this.stockBtn.on("click", () => { this.exchangePane("Stock"); }, this);
        this.otherBtn.on("click", () => { this.exchangePane("Other"); }, this);

        this.activePaneName = "Fund";

        this.node.on("updateInfo", this.updateInfo, this); // 注册更新信息事件
    },

    updateInfo: function (playerName) {
        if (!this.paneDict[this.activePaneName]) { console.log("PaneMgr Error!"); return; }
        for (let pane in this.paneDict) {
            this.paneDict[pane].getComponent(pane + "Pane").updateInfo(playerName);
        }
        this.playerInfo.updateInfo(playerName);
    },

    exchangePane: function (paneName) {
        if (this.activePaneName === paneName) { return; }
        this.paneDict[this.activePaneName].active = false;
        this.paneDict[paneName].active = true;
        this.activePaneName = paneName;
    },
});
