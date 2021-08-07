cc.Class({
    extends: cc.Component,

    properties: {
        stockPrefab: cc.Prefab,
        holdingsPrefab: cc.Prefab,
    },

    onLoad: function () {
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.playerRound = cc.find("/SafeArea/Players").getComponent("PlayerRound"); // 回合管理器
        this.playerAttrDire = cc.find("/SafeArea/Players").getComponent("PlayerAttrDirector"); // 玩家属性管理器
        this.cardMgr = cc.find("/Canvas/UI/CardPane").getComponent("CardMgr"); // 卡片管理器
        this.news = cc.find("/Canvas/UI/NewsPane").getComponent("News"); // 新闻管理器
        this.stockNode = this.node.getChildByName("StockInfo").getChildByName("StockNode"); // 股票根节点
        this.holdingsNode = this.node.getChildByName("HoldingsPane").getChildByName("HoldingsNode"); // 持有数根节点
        this.stockDict = {};
        this.holdingsDict = {};
        this.chairmanDict = {}; // 董事长字典
        this.maxNumPerPage = 0; // 每页显示多少股票
        this.offsetY = 0; // 初始的Y轴偏移量
        this.intervalY = 0; // 两支股票的Y轴间隔

        this.selected = null; // 当前选中

        this.playerName = null; // 当前玩家
        this.deposit = 0; // 当前玩家存款金额

        this.redOrBlack = null; // 使用的是红卡还是黑卡

        this.playerRound.node.on("newRound", this.priceTrend.bind(this), this); // 注册监听新回合消息
        this.cardMgr.node.on("red", (duration, callback) => { this.enableHover(true, duration, callback); }); // 使用红卡
        this.cardMgr.node.on("black", (duration, callback) => { this.enableHover(false, duration, callback); }); // 使用黑卡
        this.cardMgr.node.on("stockRise", (duration, callback) => { this.allRiseOrFall(true, duration, callback); }); // 使用大红卡
        this.cardMgr.node.on("stockFall", (duration, callback) => { this.allRiseOrFall(false, duration, callback); }); // 使用大黑卡
        this.news.node.on("stockCrash", (content, delay, callBack, success, failed) => { // 股市大崩盘
            for (let id in this.stockDict) {
                this.forcePrice(this.stockDict[id], false);
            }
            this.scheduleOnce(callBack, delay);
            success(); // 可行，调用回调
        });
        this.news.node.on("bullMarket", (content, delay, callBack, success, failed) => { // 牛市
            for (let id in this.stockDict) {
                this.forcePrice(this.stockDict[id], true);
            }
            this.scheduleOnce(callBack, delay);
            success(); // 可行，调用回调
        });

        this.news.node.on("jailed", (content, delay, callBack, success, failed) => { // 坐牢
            let stockIds = [];
            for (let id in this.chairmanDict) {
                if (this.chairmanDict[id] !== null) { stockIds.push(id); }
            }
            if (stockIds.length === 0) { failed(); return; } // 没有人成为董事长，故不可行，调用回调
            let index = Math.floor(Math.random() * stockIds.length);
            this.scheduleOnce(() => { // 延迟消息发射时间以等待新闻界面关闭
                this.playerAttrDire.node.emit("jailed", this.chairmanDict[stockIds[index]], 5, callBack); // 随机选出一位坐牢
            }, delay);
            content = this.stockDict[stockIds[index]].stockName + content.replace("[角色名]", this.chairmanDict[stockIds[index]]);
            success(content); // 可行，调用回调
        });

        this.playerRound.node.on("playerLose", (playerName) => { // 注册玩家淘汰监听
            for (let id in this.stockDict) {
                let holdings = this.stockDict[id].holdings[playerName];
                if (holdings > 0) {
                    this.stockDict[id].tradingVolume += holdings; // 玩家被淘汰后归还所有股票的股份
                    this.stockDict[id].holdings[playerName] = 0;
                }
            }
        });
    },

    init: function (mapName) {
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.loader.loadRes("/config/" + mapName, cc.JsonAsset, this.onJsonLoaded.bind(this));
        this.node.getComponent("StockPanel").init(mapName);
    },

    onJsonLoaded: function (err, json) {
        if (err) { console.log(err); return; }
        let stockJson = json.json["Stock"];
        this.offsetY = stockJson["offsetY"]; // 股票纵轴偏移量
        this.intervalY = stockJson["intervalY"]; // 股票纵轴间隔
        this.maxNumPerPage = stockJson["maxNumPerPage"]; // 每页显示多少股票
        this.maxFloat = stockJson["maxFloat"]; // 股票价格最大浮动
        this.min = stockJson["min"]; // 股票最低价
        this.tradeVol = stockJson["tradeVol"]; // 股票的交易量
        let index = 0; // 下标
        for (let stock in stockJson["stock"]) { // 读取配置并生成股票
            this.generateStock(stockJson["stock"][stock], index++, stockJson["selectBorder"]);
        }
    },

    generateStock: function (json, index, selectBorderImgUrl) { // 生成股票节点
        let newStock = cc.instantiate(this.stockPrefab);
        newStock.parent = this.stockNode;
        newStock.getComponent("Stock").init(json, index); // 初始化
        newStock.getComponent("Stock").min = this.min; // 股票最低价
        newStock.getComponent("Stock").setCoordinate(this.offsetY - index * this.intervalY);
        this.stockDict[json["id"]] = newStock.getComponent("Stock");
        this.loader.loadRes(selectBorderImgUrl, cc.SpriteFrame, (err, sf) => { // 加载选中框背景图
            if (err) { console.log(err); return; }
            newStock.getComponent("Stock").triggerBg.getComponent(cc.Sprite).spriteFrame = sf;
        });
        newStock.getComponent("Stock").trigger.on("mousedown", (event) => { this.selectStock(event, newStock); }, this);
    },

    initPlayerHoldings: function (playerNames) { // 初始化玩家持有股票的数量
        this.node.getComponent("StockPanel").initPlayerNames(playerNames); // 初始化持有数表玩家名显示
        let index = 0;
        for (let stock in this.stockDict) {
            this.chairmanDict[stock] = null; // 初始化董事长字典
            this.stockDict[stock].initPlayerHoldings(playerNames); // 初始化玩家持有数
            this.generateHoldings(stock, playerNames, index++); // 初始化持有数表数量显示
        }
        this.updateDisplay(); // 初始化显示
    },

    generateHoldings: function (stockId, playerNames, index) {  // 初始化持有数表数量显示
        let newHoldings = cc.instantiate(this.holdingsPrefab);
        newHoldings.parent = this.holdingsNode;
        newHoldings.y = -index * this.intervalY; // Y轴偏移量
        newHoldings.getChildByName("Name").getComponent(cc.Label).string = this.stockDict[stockId].stockName;
        this.holdingsDict[stockId] = {};
        index = 0;
        for (let player in playerNames) {
            let playerHoldings = newHoldings.getChildByName("Player" + (index++ + 1).toString());
            if (playerHoldings) {
                this.holdingsDict[stockId][playerNames[player]] = playerHoldings;
                this.holdingsDict[stockId][playerNames[player]].getChildByName("Label").getComponent(cc.Label).string = 0;
            }
        }
    },

    updateDisplay: function () { // 更新面板显示
        this.playerName = this.getPlayerName();
        this.deposit = this.playerAttrDire.getPlayerMoney(this.playerName)[1];
        for (let stock in this.stockDict) {
            this.stockDict[stock].updateDisplay(this.playerName);
            let max = 0, chairman = null;
            for (let player in this.stockDict[stock].holdings) {
                if (this.holdingsDict[stock][player]) {
                    let holdingLbl = this.holdingsDict[stock][player].getChildByName("Label").getComponent(cc.Label)
                    holdingLbl.string = this.stockDict[stock].holdings[player].toString();
                    if (this.stockDict[stock].holdings[player] > max) {
                        max = this.stockDict[stock].holdings[player];
                        chairman = player;
                    }
                }
            }
            if (chairman && this.chairmanDict[stock] !== chairman) {
                if (this.chairmanDict[stock]) {
                    this.holdingsDict[stock][this.chairmanDict[stock]].getChildByName("Chairman").opacity = 0;
                }
                this.chairmanDict[stock] = chairman;
                this.holdingsDict[stock][this.chairmanDict[stock]].getChildByName("Chairman").opacity = 255;
            }
            if (!chairman && this.chairmanDict[stock]) {
                this.holdingsDict[stock][this.chairmanDict[stock]].getChildByName("Chairman").opacity = 0;
                this.chairmanDict[stock] = null;
            }
        }
    },

    selectStock: function (event, stock) { // 选中股票
        if (this.redOrBlack === null) {
            if (event.getButton() === 0) {
                if (stock === this.selected) { this.node.getComponent("StockPanel").showDetail(stock); return; }
                if (this.selected) { this.selected.getComponent("Stock").unSelected(); }
                stock.getComponent("Stock").selected();
                this.selected = stock;
            } else if (event.getButton() === 2) {
                this.node.getComponent("StockPanel").hide();
            }
        }
    },

    cleanSelected: function () { // 清空选中股票
        if (this.selected) { this.selected.getComponent("Stock").unSelected(); }
        this.selected = null;
    },

    trade: function (buyOrSell, playerName, volume) { // 交易股票
        let stock = this.selected.getComponent("Stock");
        let tradeMoney = 0;
        if (buyOrSell) { tradeMoney = -volume * stock.finalPrice; }
        else { tradeMoney = volume * stock.finalPrice; }
        // console.log(this.playerAttrDire.getPlayerMoney(playerName));
        this.playerAttrDire.changePlayerMoney(playerName, 0, tradeMoney, -tradeMoney);
        // console.log(playerName, 0, tradeMoney, -tradeMoney)
        // console.log(this.playerAttrDire.getPlayerMoney(playerName));
        stock.trade(buyOrSell, playerName, volume);
        this.updateDisplay();
    },

    priceTrend: function () { // 股价走势
        for (let id in this.stockDict) {
            let stock = this.stockDict[id];
            let isRise = Math.random() < stock.upside; // 获取涨跌
            let floatRange = Math.round(Math.random() * this.maxFloat * 100) / 100; // 获取涨跌幅度
            floatRange += 0.3 * (0.1 - floatRange); // 让幅度尽可能大一些
            // if (isRise && stock.finalPrice >= stock.max) { isRise = !isRise; floatRange = -floatRange; } // 超过或达到上限就让它跌下去一点
            // else if (!isRise && (1 - this.min / this.finalPrice) < floatRange) { isRise = !isRise; floatRange = -floatRange; } // 反之亦然
            if (stock.forceRise > 0) { // 红卡影响
                isRise = true;
                floatRange = 0.1;
                // if (stock.finalPrice >= stock.max) { isRise = false; floatRange = -0.01;}
            } else if (stock.forceFall > 0) { // 黑卡影响
                isRise = false;
                floatRange = 0.1;
                // if ((1 - this.min / this.finalPrice) < floatRange) { isRise = true; floatRange = 0.01; }
            }
            stock.limitUp = stock.limitDown = false; // 初始化涨跌停板
            let oldPrice = stock.finalPrice; // 记录原本股价
            if (isRise) {
                stock.finalPrice = parseFloat((stock.finalPrice * (1 + floatRange)).toFixed(1)); // 涨
                if (0.1 - Math.abs(floatRange) < 1e-5) { stock.limitUp = true; } // 涨停板
            } else {
                stock.finalPrice = parseFloat((stock.finalPrice * (1 - floatRange)).toFixed(1)); // 跌
                if (0.1 - Math.abs(floatRange) < 1e-5) { stock.limitDown = true; } // 跌停板
            }
            stock.isRise = isRise; // 修改涨跌信息
            stock.riseAndFall = Math.round((stock.finalPrice - oldPrice) * 10) / 10; // 记录涨跌
            this.updatePlayerMoney(stock); // 更新玩家资产
        }
    },

    forcePrice: function (stock, riseOrFall) { // 红卡或黑卡的效果强制改变股票的状态
        let floatRange = 0.1; // 直接停板
        let oldPrice = stock.finalPrice - stock.riseAndFall; // 获取上次变化前的股价
        stock.limitUp = stock.limitDown = false; // 初始化涨跌停板
        if (riseOrFall) {
            stock.limitUp = true;
        } else {
            stock.limitDown = true;
            floatRange = -floatRange;
        }
        stock.finalPrice = parseFloat((oldPrice + floatRange * oldPrice).toFixed(1)); // 修改股价
        stock.isRise = riseOrFall; // 更新涨跌信息
        stock.riseAndFall = Math.round((stock.finalPrice - oldPrice) * 10) / 10; // 记录涨跌

        stock.updateDisplay(this.playerName);
        this.updatePlayerMoney(stock); // 更新玩家资产
    },

    enableHover: function (redOrBlack, duration, callback) { // 使用了小红卡黑卡，激活鼠标悬停事件，等待选择一个股票
        this.node.active = true;
        this.updateDisplay(this.getPlayerName());
        this.redOrBlack = redOrBlack;
        for (let id in this.stockDict) { // 激活鼠标事件
            this.stockDict[id].enableHover(); // 悬停
            this.stockDict[id].trigger.on("mousedown", (event) => { // 点击
                this.onStockSelected(event, this.stockDict[id], duration, callback);
            }, this);
        }
    },

    onStockSelected: function (event, stockNode, duration, callback) {
        this.node.active = false;
        stockNode.getComponent("Stock").unSelected();
        this.selected = null; // 重置选中

        for (let id in this.stockDict) { // 还原鼠标事件
            this.stockDict[id].disableHover(); // 取消悬停
            this.stockDict[id].trigger.off("mousedown"); // 注销所有鼠标点击事件
            this.stockDict[id].trigger.on("mousedown", (event) => { // 恢复正常状态的鼠标点击事件
                this.selectStock(event, this.stockDict[id].node);
            }, this);
        }

        if (event.getButton() === 0) { // 左键
            if (callback) { callback(); } // 确认使用了卡片，所以调用回调来移除使用的卡片
            this.forcePrice(stockNode.getComponent("Stock"), this.redOrBlack); // 强制股票涨跌变化
            let stock = stockNode.getComponent("Stock");
            if (this.redOrBlack) {
                this.redOrBlack = null;
                if (stock.forceFall > 0) { stock.forceFall = 0; return; } // 红卡黑卡相互抵消
                stock.forceRise = duration; // 使用卡片以后将持续一定的回合
            } else { // 反之亦然
                this.redOrBlack = null;
                if (stock.forceRise > 0) { stock.forceRise = 0; return; }
                stock.forceFall = duration;
            }
        } else { // 取消使用卡片，什么也不做
            this.redOrBlack = null;
        }
    },

    allRiseOrFall: function (riseOrFall, duration, callback) { // 大红卡大黑卡可以调整全部股票的涨跌
        if (riseOrFall) {
            for (let id in this.stockDict) { // 大红卡
                let stock = this.stockDict[id];
                this.forcePrice(stock, riseOrFall);
                if (stock.forceFall > 0) { stock.forceFall = 0; continue; }
                stock.forceRise = duration;
            }
        } else {
            for (let id in this.stockDict) { // 大黑卡
                let stock = this.stockDict[id];
                this.forcePrice(stock, riseOrFall);
                if (stock.forceRise > 0) { stock.forceRise = 0; continue; }
                stock.forceFall = duration;
            }
        }
        callback(); // 调用使用卡片成功的回调
    },

    update: function (dt) { // 更新玩家信息
        this.playerName = this.getPlayerName();
        this.deposit = this.playerAttrDire.getPlayerMoney(this.playerName)[1];
    },

    updatePlayerMoney: function (stock) {
        for (let playerName in stock.holdings) {
            if (stock.holdings[playerName] > 0) { // 更新玩家的股票资产
                let money = this.playerAttrDire.getPlayerMoney(playerName);
                let difference = Math.round(stock.finalPrice * stock.holdings[playerName]) - money[3];
                this.playerAttrDire.changePlayerMoney(playerName, 0, 0, difference);
            }
        }
    },

    getPlayerName: function () { return this.playerRound.getPlayerName(); },

    getStock: function (stockId) { return this.stockDict[stockId]; },
});
