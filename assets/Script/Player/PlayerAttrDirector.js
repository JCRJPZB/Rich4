cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function () {
        this.playerAttr = {};
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.paneMgr = cc.find("/Canvas/UI/InfoPane").getComponent("PaneMgr"); // 面板管理器
        this.alertMgr = cc.find("/Canvas/UI/AlertNode").getComponent("AlertMgr"); // 提示框管理器
        this.camera = cc.find("/SafeArea/Players/Main Camera"); // 摄像头
        this.magicPane = cc.find("/Canvas/UI/MagicPane"); // 魔法屋
        this.loader.loadResWithCount("/config/settings", cc.JsonAsset, (err, json) => {
            if (err) { console.log(err); return; }
            let settings = json.json;
            this.initialCash = settings["InitialCash"]; // 初始现金 
            this.initialDeposit = settings["InitialDeposit"]; // 初始存款
            this.node.emit("SettingLoaded"); // 设置加载完成后发射消息
        });
        this.statusDict = { "Normal": "", "Jailed": "Released" }; // 角色状态字典

        this.node.on("randomCash", (playerName, isPositive, callBack) => {
            let eventStr = "randomCashPosi";
            let num = parseInt(Math.random() * 10000); // 随机金额
            if (!isPositive) { eventStr = "randomCashNegt"; num = -num; } // 负面则金额为负

            this.alertMgr.show("event", () => { // 弹出提示框
                let money = this.getPlayerMoney(playerName);
                if (money[0] + num >= 0) { // 加钱或者钱足够扣钱
                    this.changePlayerMoney(playerName, num, 0, 0);
                    callBack();
                } else { // 现金不足，玩家输掉
                    this.changePlayerMoney(playerName, -money[0], 0, 0);
                    this.lose(playerName);
                }
            }, eventStr, Math.abs(num));
        });

        this.magicPane.on("Jailed", (playerName, callBack) => {
            this.camera.emit("changeFollow", this.playerAttr[playerName].node); // 先切换摄像头跟随玩家
            this.alertMgr.show("event", () => {
                this.jailed(playerName, 3, callBack);
            }, "Jailed", null, playerName);
        }); // 魔法屋

        this.magicPane.on("SaveAll", (playerName, callBack) => { // 存入所有现金
            let money = this.getPlayerMoney(playerName);
            this.paneMgr.updateInfo(playerName);
            this.camera.emit("changeFollow", this.playerAttr[playerName].node); // 先切换摄像头跟随玩家
            this.alertMgr.show("event", () => {
                this.changePlayerMoney(playerName, -money[0], money[0], 0); // 存入所有现金
                this.paneMgr.updateInfo(playerName);
                this.scheduleOnce(callBack, 0.5); // 隔一小段时间
            }, "SaveAll", null, playerName);
        });

        this.node.on("ticketNum", (playerName, ticketNum) => { this.changeTicket(playerName, ticketNum); }); // 修改点券数量

        this.node.on("attrAdd", (playerName, attrName) => { this.changeAttrNum(playerName, attrName, true); }); // 某属性数量增加
        this.node.on("attrRemove", (playerName, attrName) => { this.changeAttrNum(playerName, attrName, false); }); // 某属性数量增加

        this.node.on("jailed", this.jailed.bind(this), this); // 坐牢
        this.node.on("newRound", this.updateStatus.bind(this), this); // 新的一天更新状态持续时间
        this.node.on("Released", this.released.bind(this), this); // 角色出狱

        this.node.on("Male", (callBack) => { callBack("Male", this.getPlayerBySex("Male")); }); // 获得男性角色
        this.node.on("Female", (callBack) => { callBack("Female", this.getPlayerBySex("Female")); }); // 获得女性角色
        this.node.on("Ticket", (callBack) => { callBack("Ticket", this.getPlayerByMax("Ticket")); }); // 获得点券最多的角色
        this.node.on("Cash", (callBack) => { callBack("Cash", this.getPlayerByMax("Cash")); }); // 获得现金最多的角色
        this.node.on("Deposit", (callBack) => { callBack("Deposit", this.getPlayerByMax("Deposit")); }); // 获得存款最多的角色
        this.node.on("Stock", (callBack) => { callBack("Stock", this.getPlayerByMax("Stock")); }); // 获得股值最高的角色
        this.node.on("Land", (callBack) => { callBack("Land", this.getPlayerByMax("Land")); }); // 获得股值最高的角色
        this.node.on("Total", (callBack) => { callBack("Total", this.getPlayerByMax("Total")); }); // 获得总资产最多的角色
    },

    init: function (playerNames, players) {
        this.playerNames = playerNames;
        this.players = players;
        this.loader.loadResWithCount("/config/settings", cc.JsonAsset, this.onPlayerLoaded.bind(this)); // 加载玩家信息
    },

    onPlayerLoaded: function (err, playerJson) {
        if (err) { console.log(err); return; }
        if (this.players && this.players.length > 0 && this.playerNames && this.playerNames.length == this.players.length) {
            for (let i = 0; i < this.playerNames.length; i++) { // 初始化角色属性
                this.playerAttr[this.playerNames[i]] = this.players[i].getComponent("PlayerAttr");
                this.players[i].getComponent("PlayerAttr").init(playerJson.json["Player"][this.playerNames[i]], this.initialCash,
                    this.initialDeposit, this.playerAttrLoaded.bind(this));
            }
        } else {
            console.log("角色初始化出错，请检查PlayerMgr是否正确初始化角色");
            return;
        }
    },

    playerAttrLoaded: function () {
        if (Object.keys(this.playerAttr).length === this.playerNames.length) {
            cc.find("/Canvas").emit("PlayerReady"); // 角色模块加载完成
        }
    },

    changePlayerMoney: function (playerName, cashAmount, depositAmount, stockAmount) {
        let money = this.getPlayerMoney(playerName);
        money[0] += cashAmount; // 先检查现金是否足够
        if (money[0] < 0) { return false; } // 不够则淘汰
        money[1] += depositAmount; // 再检查存款是否足够
        if (money[1] < 0) { // 不够
            money[0] += money[1]; // 存款不足使用现金抵扣
            if (money[1] < 0) { return false; } // 现金仍不足抵扣，淘汰
            money[1] = 0; // 现金足够
        }
        money[3] += stockAmount; // 股值
        if (money[3] < 0) { money[3] = 0; }
        this.setPlayerMoney(playerName, money[0], money[1], money[3]);
        this.paneMgr.updateInfo(playerName); // 更新信息到面板
        return true;
    },

    setPlayerMoney: function (playerName, cash, deposit, stockValue) {
        let player = this.playerAttr[playerName];
        player.attrDict["Cash"] = cash < 0 ? 0 : Math.round(cash);
        player.attrDict["Deposit"] = deposit < 0 ? 0 : Math.round(deposit);
        player.attrDict["Stock"] = stockValue < 0 ? 0 : Math.round(stockValue);
        player.attrDict["Total"] = player.attrDict["Cash"] + player.attrDict["Deposit"] + player.attrDict["Stock"];
    },

    getPlayerMoney: function (playerName) {
        let player = this.playerAttr[playerName];
        player.attrDict["Total"] == player.attrDict["Cash"] + player.attrDict["Deposit"] + player.attrDict["Stock"];
        return [player.attrDict["Cash"], player.attrDict["Deposit"], player.attrDict["Total"], player.attrDict["Stock"]];
    },

    changeTicket: function (playerName, ticketNum) { // 修改玩家点券数量
        if (this.playerAttr[playerName].attrDict["Ticket"] + ticketNum > 0) {
            this.playerAttr[playerName].attrDict["Ticket"] += ticketNum;
            return true;
        }
        return false; // 点券不足
    },

    changeAttrNum: function (playerName, attrName, isIncrease) { // 修改玩家某个属性的数量
        if (!isIncrease && this.playerAttr[playerName].attrDict[attrName] <= 0) { // 数量小于等于0，说明尚未拥有
            console.log("Error: " + playerName + " has not enough " + attrName + "!");
            return false;
        }
        if (isIncrease) { this.playerAttr[playerName].attrDict[attrName]++; }
        else { this.playerAttr[playerName].attrDict[attrName]--; }
        return true;
    },

    getAttrByName: function (playerName, attrName) { return this.playerAttr[playerName].attrDict[attrName]; }, // 获取玩家属性

    getTicketNum: function (playerName) { return this.playerAttr[playerName].attrDict["Ticket"]; }, // 获取玩家持有的点券数

    getPlayerStatus: function (playerName) {
        return this.playerAttr[playerName].status;
    },

    getPlayerPortraitUrl: function (playerName) { // 获取角色头像图片URL
        return this.playerAttr[playerName].portrait;
    },

    getSignImgUrl: function (playerName) { // 获取角色标记图片URL
        return this.playerAttr[playerName].signImgUrl;
    },

    getPlayerColor: function (playerName) { return this.playerAttr[playerName].color; },

    getPlayerBySex: function (sex) { // 获得对应性别的所有角色
        let players = [];
        for (let i in this.playerAttr) {
            if (this.playerAttr[i].attrDict["Sex"] === sex) { players.push(this.playerAttr[i].attrDict["PlayerName"]); } // 将对应性别的角色压入
        }
        return players;
    },

    getPlayerByMax: function (attrName) { // 获得某种属性最大的玩家角色
        let players = [];
        let max = 0;
        for (let i in this.playerAttr) {
            if (this.playerAttr[i].attrDict[attrName] > max) {
                max = this.playerAttr[i].attrDict[attrName];
                players = [this.playerAttr[i].attrDict["PlayerName"]];
            } else if (this.playerAttr[i].attrDict[attrName] === max) {
                players.push(this.playerAttr[i].attrDict["PlayerName"]);
            }
        }
        return players;
    },

    isPlayerBot: function (playerName) { return this.playerAttr[playerName].isBot; },

    isSkip: function (playerName) { // 暂时如此
        if (this.playerAttr[playerName].status != "Normal") { return true; }
        else { return false; }
    },

    showUnusualStatus: function (playerName, callBack) { // 提示异常状态
        let status = this.playerAttr[playerName].status;
        if (status === "Normal") { return; }
        this.alertMgr.show("notice", callBack, status,
            this.playerAttr[playerName].attrDict["Duration"].toString() + "天", ["[角色名]", playerName]);
    },

    jailed: function (playerName, duration, callBack) { // 坐牢
        if (this.playerAttr[playerName].status === "Jailed" || this.playerAttr[playerName].status === "Normal") {
            if (this.playerAttr[playerName].status === "Normal") {
                this.node.emit("MoveToPrison", playerName, callBack); // 发送消息，角色移动到监狱门口
            }
            this.playerAttr[playerName].status = "Jailed";
            this.playerAttr[playerName].attrDict["Duration"] += duration;
        }
    },

    updateStatus: function () { // 更新角色状态持续时间
        for (let index in this.playerAttr) {
            let player = this.playerAttr[index]
            if (player.status !== "Normal") { // 若不处于正常状态
                if (player.attrDict["Duration"] > 0) { // 若异常状态尚未结束
                    player.attrDict["Duration"]--; // 持续时间减一
                } else {
                    this.node.emit(this.statusJson[player.status], player); // 异常状态结束
                }
            }
        }
    },

    released: function (player) { // 角色出狱
        player.node.active = true;
        player.status = "Normal";
        player.attrDict["Duration"] = 0;
    },

    lose: function (playerName) { // 玩家输掉以后做的操作
        this.node.emit("playerLose", playerName); // 发射玩家淘汰消息
        delete this.playerAttr[playerName]; // 移除该角色
        // this.playerAttr[playerName].status = "Lose";
    },
});