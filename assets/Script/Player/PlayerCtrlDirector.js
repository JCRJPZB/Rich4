cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function () {
        this.playerCtrl = {};
        this.pointMgr = cc.find("/SafeArea/Map").getComponent("PointMgr"); // 地图
        this.magicPane = cc.find("/Canvas/UI/MagicPane"); // 魔法屋
        this.alertMgr = cc.find("/Canvas/UI/AlertNode").getComponent("AlertMgr"); // 提示框管理器
        this.camera = cc.find("/SafeArea/Players/Main Camera"); // 摄像头
        this.node.on("MoveToPrison", (playerName, callBack) => { // 注册角色入狱监听事件
            this.camera.emit("changeFollow", this.playerCtrl[playerName].node); // 先切换摄像头跟随玩家
            let prison = this.pointMgr.getBuildingJson("Prison");
            this.playerCtrl[playerName].moveToPos(prison["pos"], this.pointMgr.pointArray[prison["pos"]].node, () => {
                this.playerCtrl[playerName].node.active = false;
                callBack();
            });
        }, this);

        this.magicPane.on("TurnBack", (playerName, callBack) => { // 调头
            this.camera.emit("changeFollow", this.playerCtrl[playerName].node); // 先切换摄像头跟随玩家
            this.scheduleOnce(() => {
                this.alertMgr.show("event", () => {
                    this.playerCtrl[playerName].reverseDire(); // 转向
                    this.scheduleOnce(callBack, 0.5); // 间隔一小段时间再执行转身操作
                }, "TurnBack", null, playerName);
            }, 0.5);
        });

        this.magicPane.on("Destroy", (playerName, callBack) => { // 发射就地拆除房屋消息
            this.camera.emit("changeFollow", this.playerCtrl[playerName].node); // 先切换摄像头跟随玩家
            this.pointMgr.node.emit("Destroy", playerName, this.playerCtrl[playerName].currentPos, callBack);
        });

        this.magicPane.on("Upgrade", (playerName, callBack) => { // 发射就地升级房屋消息
            this.camera.emit("changeFollow", this.playerCtrl[playerName].node); // 先切换摄像头跟随玩家
            this.pointMgr.node.emit("Upgrade", playerName, this.playerCtrl[playerName].currentPos, callBack);
        });
    },

    init: function (playerNames, players, callBack) {
        this.playerNames = playerNames;
        this.players = players;
        let playerStartPos = [-6, -6, -6, -6];
        if (this.players && this.players.length > 0 && this.playerNames && this.playerNames.length == this.players.length) {
            this.selectedPlayer = this.playerNames[0];
            for (let i = 0; i < this.playerNames.length; i++) {
                this.playerCtrl[playerNames[i]] = this.players[i].getComponent("PlayerCtrl");
                playerStartPos[i] = this.getRandomStartPos(playerStartPos, this.pointMgr.maxStartPos, i);
                // #################################################
                // if (i === 0) { playerStartPos[0] = 38; } // 测试用
                // #################################################
                let point = this.pointMgr.pointArray[playerStartPos[i]].node;
                this.playerCtrl[playerNames[i]].init(playerNames[i], this.changeSelectedPlayer.bind(this));
                this.playerCtrl[playerNames[i]].setPosition(playerStartPos[i], point);
            }
        } else {
            console.log("角色初始化出错，请检查PlayerMgr是否正确初始化角色");
        }
        callBack();
    },

    changeSelectedPlayer: function (playerName) {
        this.selectedPlayer = playerName;
    },

    getSelectPlayerName: function () { return this.selectedPlayer; },

    getRandomStartPos: function (arr, max, index) { // 随机获取位置
        let temp = Math.floor(Math.random() * max); // 生成[0-max)的随机数
        for (let i = 0; i < index; i++) {
            if (Math.abs(arr[i] - temp) < 7) { // 遍历数组，随机出来的数值与已经存在的初始点位距离过小则重新获取
                return this.getRandomStartPos(arr, max, index);
            }
        }
        return temp; // 获得符合条件的位置后将位置返回
    },

    getPlayerNextPos: function (currentPos, direction) { // 获取当前玩家的下一步的位置
        return this.pointMgr.findNextPoint(currentPos, direction);
    },

    setPlayerCurrPos: function (playerName, pos, point) { this.playerCtrl[playerName].setPosition(pos, point); },

    getPlayerCurrPos: function (playerName) { return this.playerCtrl[playerName].currentPos; }, // 获取角色当前位置

    getPlayerCoordinate: function (playerName) { // 获取角色当前坐标
        let node = this.playerCtrl[playerName].node;
        return [node.x, node.y];
    },

    move: function (playerName, moveDist, moveCallBack) {
        this.playerCtrl[playerName].moveDist = moveDist;
        // ###############################################
        // this.playerCtrl[playerName].moveDist = 1; // 测试用
        // ###############################################
        this.moveToNext(playerName, moveCallBack);
    },

    moveToNext: function (playerName, moveCallBack) {
        let player = this.playerCtrl[playerName];
        if (!player) { console.log("PlayerCtrlDirector报错，找不到名为" + playerName + "的角色！"); return; }
        if (player.moveDist > 0) { // 若还有剩余步数则继续前进
            let next = this.getPlayerNextPos(player.currentPos, player.direction);
            if (next.length < 1) { console.log("PointMgr出错，位置为PlayerDirector的movePlayer方法，调用下一步失败！"); return; }
            player.moveDist--;
            let target = next[0];
            if (next.length > 1) { // 多条路要玩家选择走哪条
                target = next[0]; //##### 但是还没有实现#####
            }
            player.moveToNext(target, this.moveToNext.bind(this), playerName, moveCallBack);
        } else {
            moveCallBack(playerName);
        }
    },

    showNotice: function (playerName, content, callBack) { // 显示提示并播放动画
        let player = this.playerCtrl[playerName];
        player.noticeLabel.active = true;
        player.noticeAnim.off("finished"); // 清除动画结束回调
        player.noticeAnim.on("finished", () => { player.noticeLabel.active = false; callBack(); }); // 添加动画结束回调
        player.node.getChildByName("Notice").getComponent(cc.Label).string = content;
        player.noticeAnim.playAdditive("LabelUpWard");
    },
});
