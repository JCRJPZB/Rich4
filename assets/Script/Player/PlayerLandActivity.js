cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.playerAttrDire = this.node.getComponent("PlayerAttrDirector"); // 属性
        this.playerCtrlDire = this.node.getComponent("PlayerCtrlDirector"); // 控制
        this.pointMgr = cc.find("/SafeArea/Map").getComponent("PointMgr"); // 地图
        this.alertMgr = cc.find("/Canvas/UI/AlertNode").getComponent("AlertMgr"); // 提示框管理器
        this.playerRound = this.node.getComponent("PlayerRound"); // 回合管理器
        this.paneMgr = cc.find("/Canvas/UI/InfoPane").getComponent("PaneMgr"); // 面板管理器

        this.randomList = ["randomCash", "randomCard", "randomTool"]; // 随机事件类型列表
        this.node.on("random", this.randomEvent.bind(this), this); // 注册事件的监听
        this.node.on("zero", (playerName, callBack) => { this.ticketsEvent(0, playerName, callBack); }, this);
        this.node.on("ten", (playerName, callBack) => { this.ticketsEvent(10, playerName, callBack); }, this);
        this.node.on("thirty", (playerName, callBack) => { this.ticketsEvent(30, playerName, callBack); }, this);
        this.node.on("fifty", (playerName, callBack) => { this.ticketsEvent(50, playerName, callBack); }, this);
    },

    getPlayerName: function () { return this.playerRound.getPlayerName(); }, // 获取玩家名

    arriveBuilding: function () {
        let playerName = this.getPlayerName();
        let playerPos = this.playerCtrlDire.getPlayerCurrPos(playerName);
        let owner = this.pointMgr.getOwner(playerPos);
        if (owner === "N") { // 在自由的土地
            this.alertMgr.show("confirm", this.buyLand.bind(this), "buyLand"); // 购地
        } else if (owner === playerName) { // 抵达自己的土地
            if (this.pointMgr.getIsPointMaxLv(playerPos)) {
                this.alertMgr.show("notice", this.playerRound.roundOver.bind(this.playerRound), "maxLv"); // 土地已满级
            } else {
                this.alertMgr.show("confirm", this.upgradeLand.bind(this), "upgradeLand"); // 升级
            }
        } else { // 抵达别人的土地
            let price = this.charge(owner); // 收取过路费
            if (price > 0) { // 被收取过路费
                this.alertMgr.show("notice", this.playerRound.roundOver.bind(this.playerRound), "charge", price.toString());
            } else { // 免费通过！
                this.alertMgr.show("notice", this.playerRound.roundOver.bind(this.playerRound), "freePass");
            }
        }
    },

    buyLand: function (ifBuy) { // 购地
        if (ifBuy) {
            let playerName = this.getPlayerName();
            let playerPos = this.playerCtrlDire.getPlayerCurrPos(playerName);
            let isMoneyEnough = this.playerAttrDire.changePlayerMoney(playerName, -this.pointMgr.getLandPrice(playerPos), 0, 0);
            if (!isMoneyEnough) {
                console.log(playerName + " have not enough money!");
                this.alertMgr.show("notice", this.playerRound.roundOver.bind(this.playerRound), "buyLandFailed"); // 现金不足
            } else { // 购买成功
                console.log(playerName + " have bought land:" + playerPos);
                this.pointMgr.buyLand(playerName, playerPos);
                this.alertMgr.show("notice", this.playerRound.roundOver.bind(this.playerRound), "buyLandSuccess");
            }
            return;
        };
        this.playerRound.roundOver(); // 不购买，直接结束回合
    },

    upgradeLand: function (ifUpgrade) { // 加盖土地
        if (ifUpgrade) {
            let playerName = this.getPlayerName();
            let playerPos = this.playerCtrlDire.getPlayerCurrPos(playerName);
            this.pointMgr.changeLandLv(true, playerPos, playerName);
            this.alertMgr.show("notice", this.playerRound.roundOver.bind(this.playerRound), "upgradeLand");
            return;
        }
        this.playerRound.roundOver();
    },

    charge: function (owner) { // 过路费
        let playerName = this.getPlayerName();
        let playerPos = this.playerCtrlDire.getPlayerCurrPos(playerName);
        let chargePrice = this.pointMgr.getChargePrice(playerPos);
        this.playerAttrDire.changePlayerMoney(owner, 0, chargePrice, 0);
        let isMoneyEnough = this.playerAttrDire.changePlayerMoney(playerName, -chargePrice, 0, 0); // 扣钱
        if (!isMoneyEnough) { this.playerAttrDire.lose(playerName); } // 若现金不足，则玩家淘汰
        return chargePrice;
    },

    arriveFacility: function () {
        let playerName = this.getPlayerName();
        let playerPos = this.playerCtrlDire.getPlayerCurrPos(playerName);
        let owner = this.pointMgr.getOwner(playerPos);
        let lv = this.pointMgr.getPointLv(playerPos);
        if (owner === "N") {
            this.alertMgr.show("confirm", this.buyLand.bind(this), "buyLand"); // 购地
        } else if (owner === playerName && lv === 1) {
            this.alertMgr.show("facility");
        } else if (owner === playerName && lv > 1 && lv < 5) {
            this.alertMgr.show("confirm", this.upgradeFacility.bind(this), "upgradeFacility"); // 升级设施
        } else if (owner === playerName && lv === 5) {
            this.alertMgr.show("notice", this.playerRound.roundOver.bind(this.playerRound), "maxLv");
        } else {
            let price = this.charge(owner); // 收取过路费
            if (price > 0) {
                this.alertMgr.show("notice", this.playerRound.roundOver.bind(this.playerRound), "charge", price.toString()); // 被收取过路费
            }
        }
    },

    chooseFacility: function (ifBuild, facilityName) { // 选择建造哪种设施
        if (ifBuild) {
            let playerName = this.getPlayerName();
            let playerPos = this.playerCtrlDire.getPlayerCurrPos(playerName);
            this.pointMgr.buildFacility(playerPos, facilityName);
        }
        this.playerRound.roundOver();
    },

    upgradeFacility: function (ifUpgrade) {
        if (ifUpgrade) {
            let playerName = this.getPlayerName();
            let playerPos = this.playerCtrlDire.getPlayerCurrPos(playerName);
            this.pointMgr.changeFacilityLv(playerPos, true);
            this.alertMgr.show("notice", this.playerRound.roundOver.bind(this.playerRound), "upgrade");
            return;
        }
        this.playerRound.roundOver();
    },

    arriveEvent: function (eventName, callBack) { // 各个节点的事件
        this.node.emit(eventName, this.getPlayerName(), callBack); // 触发相应的事件
    },

    randomEvent: function (playerName, callBack) {
        // 目前暂时只给出现金、卡片、道具相关的随机事件，其余事件有待丰富
        let event = this.randomList[parseInt(Math.random() * this.randomList.length)];
        let isPositive = Math.random() > 0.5; // 随机正面或负面影响，默认概率是1:1
        // ################################################
        // console.log(event, playerName, isPositive); // # 测试用
        // event = "randomCash"; isPositive = false;   // #
        // ################################################
        // ##########################################################################
        if (event === "randomTool") { callBack(); return; } // 道具暂时还没做
        // ##########################################################################
        this.node.emit(event, playerName, isPositive, callBack); // 发射随机事件，附参数玩家名以及是正面还是负面
    },

    ticketsEvent: function (ticketNum, playerName, callBack) { // 点券事件
        if (!ticketNum || ticketNum === 0) { callBack(); return; }
        this.playerAttrDire.changeTicket(playerName, ticketNum); // 添加点券
        let noticeStr = ticketNum.toString() + "点券";
        this.playerCtrlDire.showNotice(playerName, noticeStr, callBack); // 跳出提示
    },
});
