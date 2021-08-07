cc.Class({
    extends: cc.Component,

    properties: {
        cardPrefab: cc.Prefab,
        playerNodePrefab: cc.Prefab,
    },

    onLoad: function () {
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); //资源管理器
        this.playerRound = cc.find("/SafeArea/Players").getComponent("PlayerRound"); // 玩家回合管理器
        this.camera = cc.find("/SafeArea/Players/Main Camera"); // 摄像头
        this.magicPane = cc.find("/Canvas/UI/MagicPane"); // 魔法屋
        this.alertMgr = cc.find("/Canvas/UI/AlertNode").getComponent("AlertMgr"); // 提示框管理器
        this.cardNode = this.node.getChildByName("CardNode"); // 卡片节点
        this.cardJsonDict = {}; // 卡片字典
        this.playerCardDict = {}; // 玩家卡片字典
        this.loader.loadResWithCount("/config/settings", cc.JsonAsset, this.onJsonLoaded.bind(this));
        this.playerCardDict = {}; // 玩家卡片字典
        this.playerNodeDict = {}; // 玩家卡片节点字典
        this.cardJson = null; // 卡片属性
        this.currPage = 0; // 当前页码
        this.playerPageDict = {}; // 玩家页数字典
        this.currShowPlayer = null; // 当前显示卡片所属玩家（不一定是当前正在操作的玩家）

        this.playerRound.node.on("newRound", () => { this.node.getComponent("CardPane").hide(); }); // 切换玩家时关闭卡片管理器
        this.playerRound.node.on("playerLose", (playerName) => { this.playerCardDict[playerName] = []; }); // 玩家淘汰清空卡片

        this.playerRound.node.on("randomCard", this.randomCardEvent.bind(this), this); // 注册卡片随机事件监听
        this.playerRound.node.on("card", (playerName, callBack) => { // 注册获得卡片事件监听
            this.randomCardEvent(playerName, true, callBack);
        }, this);

        this.magicPane.on("SellCard", (playerName, callBack) => { // 变卖卡片
            this.scheduleOnce(() => {
                this.alertMgr.show("event", () => { // 弹出事件提示框
                    let cards = this.playerCardDict[playerName];
                    while (cards.length > 0) {
                        this.sellCard(playerName, cards[0]); // 迭代卖出所有卡片
                    }
                    callBack(); // 完成回调
                }, "SellCard", null, playerName);
            }, 0.5);
        });

        this.magicPane.on("GetCard", (playerName, callBack) => {
            this.scheduleOnce(() => {
                let index = parseInt(Math.random() * Object.keys(this.cardJsonDict).length); // 随机一个下标
                let cardId = Object.keys(this.cardJsonDict)[index];
                this.alertMgr.show("event", () => {
                    this.addCard(playerName, cardId);
                    this.scheduleOnce(callBack, 0.5); // 间隔一小段时间
                }, "GetCard", this.cardJsonDict[cardId]["cardName"], playerName);
            }, 0.5);
        });
    },

    onJsonLoaded: function (err, json) {
        if (err) { console.log(err); return; }
        this.cardJson = json.json["Card"];
        for (let card in this.cardJson["cards"]) { // 读取卡片属性配置
            this.cardJsonDict[card] = this.cardJson["cards"][card];
        }
    },

    init: function (playerNames) {
        if (!playerNames || playerNames.length < 1) {
            console.log("初始化卡片管理器出错！玩家数组不能为空！");
            return false;
        }
        for (let index in playerNames) {
            this.playerCardDict[playerNames[index]] = []; // 初始化玩家卡片字典
            this.playerPageDict[playerNames[index]] = 0; // 初始化玩家页数字典
            let newPlayerNode = cc.instantiate(this.playerNodePrefab); // 初始化玩家卡片节点
            newPlayerNode.parent = this.cardNode;
            this.playerNodeDict[playerNames[index]] = newPlayerNode; // 将玩家卡片节点存入字典
        }
    },

    randomCardEvent: function (playerName, isPositive, callBack) { // 卡片随机事件
        let eventStr = "randomCardPosi";
        let cardNum = this.playerCardDict[playerName].length;
        if (!isPositive && cardNum > 0) { // 负面
            eventStr = "randomCardNegt";
            let index = parseInt(Math.random() * cardNum); // 下标
            let cardId = this.playerCardDict[playerName][index].getComponent("Card").cardId; // 卡片ID
            let cardName = this.cardJsonDict[cardId]["cardName"]; // 卡片名称
            this.alertMgr.show("event", () => { // 弹出提示框
                this.removeCard(playerName, index); // 移除卡片
                callBack();
            }, eventStr, cardName);
        } else { // 正面
            let index = parseInt(Math.random() * Object.keys(this.cardJsonDict).length); // 随机一个下标
            let count = 0; // 计数器
            let cardId = null; // 卡片ID
            for (let id in this.cardJsonDict) { // 找到下标对应的卡片ID
                cardId = id;
                if (count === index) { break; }
                count++;
            }
            if (cardId) {
                this.alertMgr.show("event", () => { // 弹出提示框
                    this.addCard(playerName, cardId); // 添加卡片
                    callBack();
                }, eventStr, this.cardJsonDict[cardId]["cardName"]);
            } else {
                callBack();
            }
        }
    },

    addCard: function (playerName, cardId) { // 添加卡片
        let newCard = cc.instantiate(this.cardPrefab);
        newCard.parent = this.playerNodeDict[playerName]; // 放入对应玩家的节点下
        // 根据配置文件初始化卡片
        newCard.getComponent("Card").init(this.cardJsonDict[cardId], this.playerCardDict[playerName].length,
            playerName, this.useCard.bind(this), this.cardJson, this.currPage);
        this.playerCardDict[playerName].push(newCard); // 将卡片添加到字典中对应玩家的数组中
        newCard.active = false; // 初始默认隐藏

        this.playerRound.node.emit("attrAdd", playerName, "Card"); // 卡片数量增加

        let numPerPage = this.cardJson["rowMax"] * this.cardJson["colMax"]; // 每页的卡片数量
        this.playerPageDict[playerName] = parseInt((this.playerCardDict[playerName].length - 1) / numPerPage); // 更新玩家卡片页数
    },

    useCard: function (cardId, playerName, index) { // 使用并移除卡片
        if (index < 0) { console.log("卡片下标溢出，请查看CardMgr！"); return; }
        if (this.playerCardDict[playerName].length < 1) { console.log("该玩家卡片数组长度错误，请查看CardMgr！"); return; }
        this.node.emit(cardId, this.getCardDuration(cardId), () => { this.removeCard(playerName, index); }); // 发出使用卡片消息
        // this.cardFuncMgr.cardFunc(cardId, playerName); // 根据卡片ID调用对应方法
        this.node.getComponent("CardPane").hide();
    },

    sellCard: function (playerName, card) {
        let index = this.playerCardDict[playerName].indexOf(card); // 获取下标
        this.removeCard(playerName, index); // 移除卡片
        this.playerRound.node.emit("ticketNum", playerName, card.getComponent("Card").price); // 换取点券
    },

    removeCard: function (playerName, index) { // 成功使用掉卡片
        this.playerRound.node.emit("attrReturn", playerName, "Card"); // 卡片数量减少

        this.playerCardDict[playerName][index].getComponent("Card").remove(); // 从游戏界面移除被使用的卡片
        this.playerCardDict[playerName].splice(index, 1); // 从玩家卡片数组中移除被使用的卡片
        // ########################################################################
        for (let index in this.playerCardDict[playerName]) { // 姑且使用迭代器迭代每个卡片来调整位置，待优化
            this.playerCardDict[playerName][index].getComponent("Card").updatePos(index, this.currPage);
        }
        // ########################################################################

        let numPerPage = this.cardJson["rowMax"] * this.cardJson["colMax"]; // 每页的卡片数量
        this.playerPageDict[playerName] = parseInt((this.playerCardDict[playerName].length - 1) / numPerPage); // 更新玩家卡片页数
        if (this.playerCardDict[playerName].length % numPerPage === 0 &&
            playerName === this.currShowPlayer) { // 若该卡片是该页最后一张，且使用卡片的是当前显示的玩家，则回到上一页
            this.turnPage(true);
        }
    },

    turnPage: function (isUp) { // 翻页
        if ((isUp && this.currPage === 0) ||
            (!isUp && this.currPage === this.playerPageDict[this.currShowPlayer])) { return; } // 如果已经抵达边界则不做任何操作
        this.changeVisByPage(false, this.currShowPlayer); // 先隐藏当前页的所有卡片
        if (isUp) { this.currPage--; } // 根据翻页方向改变当前页码
        else { this.currPage++; }
        this.changeVisByPage(true, this.currShowPlayer); // 再显示要翻到的页的所有卡片
    },

    changeVisByPage: function (TOF, playerName) { // 显示或隐藏指定页码的卡片
        let numPerPage = this.cardJson["rowMax"] * this.cardJson["colMax"]; // 每页的卡片数量
        for (let i = 0; i < numPerPage; i++) {
            if (!this.playerCardDict[playerName][i + (this.currPage * numPerPage)]) { break; } // 该页不满，迭代到空位时跳出循环
            this.playerCardDict[playerName][i + (this.currPage * numPerPage)].active = TOF;
        }
    },

    show: function (playerName) { // 显示第一页
        if (!playerName) { this.currShowPlayer = this.getActivePlayer(); } // 没有给出则默认当前操作的玩家
        else { this.currShowPlayer = playerName; }
        this.playerNodeDict[this.currShowPlayer].active = true;
        this.currPage = 0;
        this.changeVisByPage(true, this.currShowPlayer);
    },

    hide: function () { // 隐藏该玩家的所有卡片
        this.playerNodeDict[this.currShowPlayer].active = false
        for (let i = 0; i < this.playerCardDict[this.currShowPlayer].length; i++) {
            this.playerCardDict[this.currShowPlayer][i].active = false;
        }
    },

    getActivePlayer: function () { return this.playerRound.getPlayerName(); }, // 获取当前操作的玩家

    getCardDuration: function (cardId) { return this.cardJsonDict[cardId]["duration"]; },

    getPlayerCards: function (playerName) { // 获取玩家所有卡片的Id
        let cardIds = [];
        let cards = this.playerCardDict[playerName];
        for (let i in cards) {
            cardIds.push(cards[i].getComponent("Card").cardId);
        }
        return cardIds;
    },
});