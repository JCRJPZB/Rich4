cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.playerLandActivity = this.node.getComponent("PlayerLandActivity"); // 玩家停留事件管理器
        this.pointMgr = cc.find("/SafeArea/Map").getComponent("PointMgr"); // 地图
        this.cameraCtrl = cc.find("/SafeArea/Players/Main Camera").getComponent("CameraCtrl"); // 主摄像头
        this.diceControler = cc.find("/Canvas/UI/DiceControler"); // 骰子控制器
        this.alertMgr = cc.find("/Canvas/UI/AlertNode").getComponent("AlertMgr"); // 提示框管理器
        this.paneMgr = cc.find("/Canvas/UI/InfoPane").getComponent("PaneMgr"); // 面板管理器
        this.aiCtrl = this.node.getComponent("AICtrl"); // AI控制器
    },

    init: function (playerNames, players, playerAttrDire, playerCtrlDire) {
        this.playerNames = playerNames;
        this.players = players;
        this.isBot = {};
        for (let i in this.playerNames) {
            if (this.getPlayerBot(this.playerNames[i])) {
                this.isBot[this.playerNames[i]] = true;
            } else {
                this.isBot[this.playerNames[i]] = false;
            }
        }
        this.activeIndex = -1;
        this.maxIndex = this.playerNames.length;
        this.playerAttrDire = playerAttrDire;
        this.playerCtrlDire = playerCtrlDire;
        this.priceIndex = 1; // 物价指数
        this.days = 0; // 初始化游戏时间计数
        this.handTime = 0; // 游戏手数（第几手）
        this.aiCtrl.init(playerNames, players, playerAttrDire, playerCtrlDire); // 初始化AI控制器
    },

    gameStart: function () {
        this.node.on("playerLose", this.playerLose.bind(this), this); // 注册玩家淘汰监听
        this.mainLoop();
    },

    mainLoop: function () {
        this.handTime++;
        this.activeIndex = (this.activeIndex + 1) % this.maxIndex;
        // activeIndex === 0 保证是一个大游戏回合结束
        if (this.activeIndex === 0) { this.node.emit("newRound"); this.days++; } // 新游戏回合消息&&游戏时间计数增加
        this.paneMgr.updateInfo(this.playerNames[this.activeIndex]); // 新回合更新玩家信息
        console.log(this.playerNames[this.activeIndex] + " start!");
        this.scheduleOnce(() => { // 延迟0.5秒给初始化角色回合时间
            if (this.getPlayerBot(this.getPlayerName())) { // AI回合
                this.roundStartAI();
            } else { // 人类玩家回合
                this.roundStart();
            }
        }, 0.5);
    },

    // #############################
    roundStartAI: function () { // #
        if (this.playerAttrDire.isSkip(this.playerNames[this.activeIndex])) { // 需要的话展示一下异常的状态及剩余时间
            this.playerAttrDire.showUnusualStatus(this.playerNames[this.activeIndex], this.roundOver.bind(this));
            return;
        }
        this.node.emit("roundStart", this.playerNames[this.activeIndex]); // 发射玩家新回合消息
        this.node.emit("aiLogic", this.playerNames[this.activeIndex], () => { // 走AI逻辑，走完后再掷骰子
            this.moveCamera(() => { this.diceControler.emit("throw"); });
        });
    }, //                          #
    // #############################

    roundStart: function () {
        // 判定玩家状态是否需要跳过回合
        if (this.playerAttrDire.isSkip(this.playerNames[this.activeIndex])) { // 需要的话展示一下异常的状态及剩余时间
            this.playerAttrDire.showUnusualStatus(this.playerNames[this.activeIndex], this.roundOver.bind(this));
            return;
        }
        this.node.emit("roundStart", this.playerNames[this.activeIndex]); // 发射玩家新回合消息
        this.moveCamera(null);
    },

    moveCamera: function (callBack) {
        this.cameraCtrl.changeActivePlayer(this.players[this.activeIndex], () => { this.waitForOperation(callBack); });
    },

    waitForOperation: function (callBack) { // 等待玩家操作
        if (callBack) { callBack(); return; }
        this.diceControler.active = true; // 激活骰子
    },

    receiveDicePoint: function (point) {
        this.playerCtrlDire.move(this.playerNames[this.activeIndex], point, () => { this.landActivity(); });
    },

    landActivity: function () {
        let pos = this.playerCtrlDire.getPlayerCurrPos(this.playerNames[this.activeIndex]);
        let landName = this.pointMgr.getLandName(pos);
        let eventName = this.pointMgr.getEventName(pos);
        if (landName === "building") { this.playerLandActivity.arriveBuilding(); }
        else if (landName === "facility") { this.playerLandActivity.arriveFacility(); }
        else {
            this.playerLandActivity.arriveEvent(eventName, this.roundOver.bind(this));
            //this.alertMgr.show("notice", this.roundOver.bind(this), "working");
        }
    },

    roundOver: function () {
        console.log(this.playerNames[this.activeIndex] + " Over!")
        this.scheduleOnce(() => {
            // 这里还需要结算（也可以在开始回合的时候结算）
            // resetTimer();
            // …………
            this.mainLoop();
        }, 0.5);
    },

    playerLose: function (playerName) { // 有玩家被淘汰
        this.alertMgr.show("notice", this.mainLoop.bind(this), "playerLose", playerName);
        let index = this.playerNames.indexOf(playerName); // 找到淘汰玩家的下标
        this.players[index].active = false; // 从游戏中移除该玩家
        this.players[index].parent = null;
        this.players.splice(index, 1);
        this.playerNames.splice(index, 1);
        this.maxIndex--;
        this.activeIndex = (this.activeIndex + this.maxIndex - 1) % this.maxIndex; // 将当前指针往回退一个
        if (this.maxIndex < 2) { // 若只剩一个玩家则决出胜者，游戏结束
            this.gameOver(this.playerNames[0]);
        }
        if (this.activeIndex === this.maxIndex - 1) { this.days--; } // 为了防止重复计算日期
    },

    gameOver: function (playerName) {
        this.node.emit("GameOver", playerName); // 发射“GameOver”
    },

    getPlayerName: function () { return this.playerNames[this.activeIndex]; },

    getPlayerBot: function (playerName) { return this.isBot[playerName];},

    getDays: function () { return this.days; }, // 返回当前游戏时间计数

    getPriceIndex: function () { return this.priceIndex; }, // 返回当前物价指数
});
