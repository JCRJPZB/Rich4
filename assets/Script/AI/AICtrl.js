cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.cardMgr = cc.find("/Canvas/UI/CardPane").getComponent("CardMgr"); // 卡片管理器
        this.stockMgr = cc.find("/Canvas/UI/StockPane").getComponent("StockMgr"); // 股票管理器
        this.toolMgr = cc.find("/Canvas/UI/ToolPane").getComponent("ToolMgr"); // 道具管理器
        this.alertMgr = cc.find("/Canvas/UI/AlertNode").getComponent("AlertMgr"); // 提示框管理器
        this.attrDire = null; // 属性管理器
        this.aiJson = null;
        this.cardJson = null;
        this.toolJson = null;
        this.stocks = null;
        this.loader.loadRes("/config/settings", cc.JsonAsset, (err, json) => {
            if (err) { console.log(err); return; }
            this.aiJson = json.json["AI"]; // 获取配置
            this.cardJson = this.aiJson["Card"]; // 卡片及分类
            this.toolJson = this.aiJson["Tool"]; // 道具及分类
            this.stocks = this.aiJson["Stock"]; // 当前地图
        });

        this.node.on("aiLogic", (playerName, callBack) => { // 运行AI逻辑
            if (!this.attrDire) { console.log("Error: \"attrDire\" can't be null or undefined!"); return; }
            let setting = this.aiJson[playerName];
            if (this.attrDire.getAttrByName(playerName, "Card") > 0 && Math.random() < setting["cardProb"]) {
                // this.useCard(playerName); // AI使用卡片尚且不够完善，容后再议
                this.alertMgr.show("event", () => {
                    this.stockTrade(playerName, setting, callBack);
                }, "AITest", "AI已跳过卡片使用");
            }
        });
    },

    useCard: function (playerName) {
        // AI使用卡片较为复杂，需要考虑使用损人类型，利己类型，中立类型
        // 选择卡片类型需要首先考虑AI已有的卡片，若没有某种类型的卡片，则不需要考虑该类型
        // 根据已有卡片和概率确定需要使用的卡片的类型后，再随机获取该类型中的一张卡片
        // 同时，还需要获取该卡片在该玩家数组中的下标(可能有多张重复的卡片)，这一步目前较难实现，需多考虑
        let cardIds = this.cardMgr.getPlayerCards(playerName);
        if (cardIds.length <= 0) { console.log("Error: Player has no card with a mistake cardNum!"); return; }
        let index = Math.floor(Math.random() * cardIds.length);
        // 使用卡片也有较难处理之处
        // 1、部分卡片不是直接生效，而是需要作出选择，涉及到回调函数
        // 若调用与玩家完全相同的方法，则需要在各个脚本中实现AI自动选择的部分，且一旦涉及修改较为麻烦
        // 故倾向于在卡片管理器中重新写过专门的AI方法，此时则需要考虑如何处理演出效果
        // 初步想法是AI使用卡片后将使用的卡片名称以及选择的对象以提示框的形式显示，不再考虑其他演出效果
        this.cardMgr.useCard(cardIds[index], playerName, index);
        this.alertMgr.show("event", () => {
            this.stockTrade(playerName, setting, callBack);
        }, "AIUseCard", "AI已跳过卡片使用");
    },

    useTool: function (playerName, callBack) {},

    stockTrade: function (playerName, setting, callBack) {
        // 股票交易，暂且不考虑过深，仅仅根据概率和配置决定AI是否交易股票，交易哪一支
        let stockRate = setting["stockRate"];
        let prefStock = setting["prefStock"];
        let money = this.attrDire.getPlayerMoney();
        let d_value = stockRate * money[3] - money[2]; // 比例乘以总财产与当前股值的差值
        let vol = Math.round(Math.abs(d_value) / stock.finalPrice); // 差值对应的交易量
        console.log(d_value);
        let stock = this.stockMgr.getStock(prefStock);
        if (d_value > 0) {
            if (stock.tradingVolume * stock.finalPrice > d_value && d_value / stock.finalPrice > 0) {
                this.stockMgr.trade(true, playerName, Math.round(d_value / stock.finalPrice)); // 交易
                let tradeInfo = "买进" + stock.stockName + vol.toString() + "股";
                this.alertMgr.show("event", "AITradeStock", tradeInfo, playerName);
                ; // 剩余的股票的价值高于差值，直接交易至满足股票占比
            } else {
                let rest = d_value - vlo * stock.s
                ; // 低于差值，剩余的随机一个股票
            }
        } else {
            d_value = -d_value;
            // ######## 再考虑考虑，按prefStock定义，其应当在最后卖出
            if (stock.holdings[playerName] * stock.finalPrice > d_value) {
                ; // 持有的股票价值高于差值，直接交易
            } else {
                ; // 低于差值
            }
        }
    },

    init: function (playerAttrDire) {
        this.attrDire = playerAttrDire; // 属性管理器
    },
});
