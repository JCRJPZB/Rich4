cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.node.active = false;
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.stockMgr = this.node.getComponent("StockMgr"); // 股票管理器
        this.uiMgr = cc.find("/Canvas/UI").getComponent("UIMgr"); // UI管理器
        this.holdingsPane = this.node.getChildByName("HoldingsPane"); // 股票详细信息面板
        this.holdingsPane.active = false;

        this.calculator = this.node.getChildByName("Calculator").getComponent("Calculator"); // 数字键盘
        this.bg = this.node.getChildByName("Background").getComponent(cc.Sprite); // 背景图片

        this.exitBtn = this.node.getChildByName("ExitBtn"); // 退出按钮
        this.exitBtn.on("click", this.hide.bind(this), this); // 注册点击事件，点击按钮关闭面板

        this.toolBarBtn = cc.find("/Canvas/UI/TopToolBar/Stock/Btn"); // 触发按钮
        this.toolBarBtn.on("click", this.show.bind(this), this); // 注册点击事件,显示面板

        this.topBar = this.node.getChildByName("TopBar"); // 顶部栏

        this.stockTabelBtn = this.topBar.getChildByName("HoldingsTab"); // 持有股数表按钮
        this.stockTabelBtn.on("click", this.swapHoldings.bind(this), this); // 显示持有股数表

        this.buyinBtn = this.topBar.getChildByName("BuyInBtn"); // 买进按钮
        this.buyinBtn.on("click", () => { // 显示数字键盘，将玩家存款信息传过去
            this.calculator.show(this.stockMgr.playerName, this.stockMgr.deposit, this.depositLbl, true);
        }, this);

        this.sellOutBtn = this.topBar.getChildByName("SellOutBtn"); // 卖出按钮
        this.sellOutBtn.on("click", () => { // 显示数字键盘
            this.calculator.show(this.stockMgr.playerName, this.stockMgr.deposit, this.depositLbl, false);
        }, this);

        this.depositLbl = this.topBar.getChildByName("Deposit"); // 玩家存款Label
        this.depositLbl.on("update", this.updateDeposit.bind(this), this);

        this.loadNum = 0;
    },

    init: function (mapName) {
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.loader.loadResWithCount("/config/" + mapName, cc.JsonAsset, this.onJsonLoaded.bind(this));
    },

    initPlayerNames: function (playerNames) { // 初始化持有股数表玩家名显示
        this.playerNames = playerNames;
        let top = this.holdingsPane.getChildByName("Top");
        for (let i = 0; i < playerNames.length; i++) {
            let playerName = top.getChildByName("Player" + (i + 1).toString());
            if (playerName) { playerName.getComponent(cc.Label).string = playerNames[i] }
        }
    },

    onJsonLoaded: function (err, json) { // 配置加载回调
        if (err) { console.log(err); return; }
        let stockJson = json.json["Stock"];
        this.loadNum++; // 加载数量+1
        this.loader.loadRes(stockJson["background"], cc.SpriteFrame, (err, sf) => {
            if (err) { console.log(err); return; }
            this.bg.spriteFrame = sf;
            this.resLoaded(); // 加载完成
        });
        this.loadNum++; // 加载数量+1
        this.loader.loadRes(stockJson["exitBtnImgUrl"], cc.SpriteFrame, (err, sf) => {
            if (err) { console.log(err); return; }
            this.exitBtn.getChildByName("Background").getComponent(cc.Sprite).spriteFrame = sf;
            this.resLoaded(); // 加载完成
        });
        this.loadNum++; // 加载数量+1
        this.loader.loadRes(stockJson["infoPaneBg"], cc.SpriteFrame, (err, sf) => {
            if (err) { console.log(err); return; }
            this.holdingsPane.getChildByName("Background").getComponent(cc.Sprite).spriteFrame = sf;
            this.resLoaded(); // 加载完成
        });
    },

    resLoaded: function () {
        this.loadNum--;
        if (this.loadNum === 0) { // 全部加载完毕以后发射消息
            this.uiMgr.node.emit("StockReady");
        }
    },

    show: function () { // 显示面板
        this.updateDeposit(); // 更新玩家的存款显示
        this.stockMgr.updateDisplay();
        this.node.active = true;
    },

    hide: function () { // 隐藏面板
        this.node.active = false;
        if (this.stockMgr.selected) { this.stockMgr.selected.getComponent("Stock").unSelected(); }
        this.stockMgr.selected = null; // 重置选中
        this.swapTrading();
    },

    updateDeposit: function () {
        this.stockMgr.updateDisplay();
        this.depositLbl.getComponent(cc.Label).string = this.getMoneyStr(this.stockMgr.deposit); // 更新玩家的存款显示
    },

    getMoneyStr: function (num) { // 格式化显示金钱
        let numStr = num.toString();
        if (numStr.length > 3) {
            for (let i = 0; i < (numStr.length - i) / 3 - 1; i++) {
                let place = numStr.length - (i + 1) * 3 - i;
                let temp = numStr.slice(0, place) + "," + numStr.slice(place);
                numStr = temp;
            }
        }
        return "$ " + numStr;
    },

    swapHoldings: function () { // 切换显示股票的持有数表
        this.holdingsPane.active = true;
        this.stockMgr.cleanSelected();
        this.stockTabelBtn.getChildByName("Label").getComponent(cc.Label).string = "交易";
        this.stockTabelBtn.off("click");
        this.stockTabelBtn.on("click", this.swapTrading.bind(this), this);
    },

    swapTrading: function () { // 切换显示交易股票面板
        this.holdingsPane.active = false;
        this.stockTabelBtn.getChildByName("Label").getComponent(cc.Label).string = "持有股数表";
        this.stockTabelBtn.off("click");
        this.stockTabelBtn.on("click", this.swapHoldings.bind(this), this);
    },

    showDetail: function (stock) {
        console.log("显示股票走势及详细信息");
    },
});
