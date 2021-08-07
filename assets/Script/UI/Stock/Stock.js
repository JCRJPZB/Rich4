cc.Class({
    extends: cc.Component,

    properties: {
    },

    init: function (json, index) {
        if (!json && index < 0) { console.log("初始化股票出错！"); return; }
        this.stockName = json["name"];
        this.stockId = json["id"];
        this.max = json["max"]; // 股票最高成交价
        this.min = 10; // 股票最小成交价
        this.finalPrice = json["inital"]; // 成交价
        this.upside = json["upside"]; // 股票上涨概率
        this.riseAndFall = 0; // 涨跌
        this.tradingVolume = 1500 + parseInt(Math.random() * 1500); // 交易量
        this.holdings = {}; // 股票持有数据
        this.averageCost = {}; // 平均成本数据
        this.limitUp = false; // 涨停板
        this.limitDown = false; // 跌停板
        this.forceRise = 0; // 红卡剩余回合
        this.forceFall = 0; // 黑卡剩余回合
        this.isRise = false; // 涨跌标记
        this.fPriceColor = this.node.getChildByName("FinalPrice"); // 成交价底色
        this.fPriceLbl = this.node.getChildByName("FinalPriceLbl").getComponent(cc.Label); // 成交价Label
        this.RAFLbl = this.node.getChildByName("RiseAndFall").getComponent(cc.Label); // 涨跌Label
        this.tradeVolLbl = this.node.getChildByName("TradingVolume").getComponent(cc.Label); // 交易量Label
        this.holdingsLbl = this.node.getChildByName("Holdings").getComponent(cc.Label); // 持有量Label
        this.averageCostLbl = this.node.getChildByName("AverageCost").getComponent(cc.Label); // 平均成本Label
        this.trigger = this.node.getChildByName("Trigger"); // 鼠标点击触发器
        this.triggerBg = this.trigger.getChildByName("Background"); // 选中框
        this.triggerBg.active = false;
        this.node.getChildByName("Name").getComponent(cc.Label).string = this.stockName; // 初始化名称显示
        this.playerRound = cc.find("/SafeArea/Players"); // 回合管理器
        this.playerRound.on("newRound", () => { // 新回合计数器减少一回合
            if (this.forceRise > 0) { this.forceRise--; }
            if (this.forceFall > 0) { this.forceFall--; }
        });
    },

    initPlayerHoldings: function (playerNames) { // 初始化玩家的股票持有量
        if (!playerNames || playerNames.length < 2) { console.log("初始化股票时获取玩家名数组失败！"); return; }
        for (let player in playerNames) {
            this.holdings[playerNames[player]] = 0;
            this.averageCost[playerNames[player]] = 0;
        }
    },

    setCoordinate: function (offsetY) { // 初始化股票的坐标位置
        if (!offsetY) { console.log("初始化股票位置出错！"); return; }
        this.node.y = offsetY;
    },

    updateDisplay: function (playerName) { // 更新面板显示
        // 数字颜色
        let color = null;
        if (this.isRise) { color = cc.color(200, 18, 17); } // 涨 红色
        else { color = cc.color(16, 197, 16); } // 跌 绿色
        this.fPriceLbl.node.color = this.RAFLbl.node.color = this.tradeVolLbl.node.color = color; // 根据涨跌修改颜色

        // 涨跌停板颜色
        this.fPriceColor.opacity = 255;
        if (this.limitUp) { // 涨停板
            this.fPriceColor.color = cc.color(200, 18, 17); // 修改底色
            this.fPriceLbl.node.color = cc.color(0, 0, 0); // 修改数字颜色，否则颜色一样就看不到数字
        } else if (this.limitDown) { // 跌停板
            this.fPriceColor.color = cc.color(16, 197, 16); // 修改底色
            this.fPriceLbl.node.color = cc.color(255, 255, 255); // 修改数字颜色
        } else { this.fPriceColor.opacity = 0; } // 都没有则透明

        // 更新数字
        this.fPriceLbl.string = this.finalPrice.toString(); // 更新成交价
        this.RAFLbl.string = this.riseAndFall.toString(); // 更新涨跌
        this.tradeVolLbl.string = this.tradingVolume.toString(); // 更新交易量
        this.holdingsLbl.string = this.holdings[playerName].toString(); // 更新持有量
        this.averageCostLbl.string = this.averageCost[playerName].toFixed(1).toString(); // 更新平均成本
        if (this.holdings[playerName] === 0) {
            this.holdingsLbl.string = this.averageCostLbl.string = ""; // 如果持有量为零则不显示文本
        }
    },

    selected: function () { // 选中
        this.triggerBg.active = true;
    },

    unSelected: function () { // 取消选中
        this.triggerBg.active = false;
    },

    trade: function (buyOrSell, playerName, volume) { // 交易股票
        if (buyOrSell) {
            if (this.tradingVolume < volume) { console.log(playerName + " buy stock:" + this.stockName + " failed!"); return; }
            this.averageCost[playerName] = (this.averageCost[playerName] * this.holdings[playerName] + this.finalPrice * volume)
                / (this.holdings[playerName] + volume); // 计算平均成本
            this.holdings[playerName] += volume; // 更新持有量
            this.tradingVolume -= volume; // 更新交易量
        } else {
            if (this.holdings[playerName] < volume) { console.log(playerName + "sell stock:" + this.stockName + " failed"); return; }
            this.holdings[playerName] -= volume; // 更新持有量
            this.tradingVolume += volume; // 更新交易量
            if (this.holdings[playerName] === 0) { this.averageCost[playerName] = 0; } // 卖空清零平均成本
        }
    },

    enableHover: function () { // 激活鼠标悬浮事件
        this.trigger.on("mouseenter", this.selected.bind(this), this);
        this.trigger.on("mouseleave", this.unSelected.bind(this), this);
    },

    disableHover: function () { // 取消鼠标悬浮事件
        this.trigger.off("mouseenter");
        this.trigger.off("mouseleave");
    },
});
