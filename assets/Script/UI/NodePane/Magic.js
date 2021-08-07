cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.node.active = false;
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.playerRound = cc.find("/SafeArea/Players"); // 回合管理器
        this.playerRound.on("magic", (playerName, callBack) => { // 注册事件
            this.callBack = callBack;
            this.registEvent(); // 注册按钮事件
            this.playerEnter(); // 玩家进入魔法屋
        });

        this.settings = null;
        this.imgAtlas = null;
        this.randomType = null;
        this.talkContent = [];
        this.players = [];
        this.playerKindDict = {};
        this.callBack = null;

        this.loader.loadRes("/config/settings", cc.JsonAsset, (err, json) => { // 加载设置
            if (err) { console.log(err); return; }
            this.settings = json.json["Magic"];
            this.randomType = this.settings["randomType"]; // 随机人物的方式
            this.restCount = 0; // 剩余需要更新的数量
            for (let i in this.randomType) { this.playerKindDict[this.randomType[i]] = []; } // 初始化玩家类别数组字典
            this.typeStr = this.settings["typeStr"]; // 类型对应说话内容
            for (let i = 0; i < this.settings["talkContent"]["count"]; i++) { // 加载说话内容
                this.talkContent.push(this.settings["talkContent"][i.toString()]);
            }
            this.loader.loadRes(this.settings["AtlasUrl"], cc.SpriteAtlas, (err, atlas) => { // 加载图片Atlas
                if (err) { console.log(err); return; }
                this.imgAtlas = atlas;
                this.init(); // 初始化魔法屋显示
            });
        });

        this.background = this.node.getChildByName("Background").getComponent(cc.Sprite); // 背景图片
        this.talkNode = this.node.getChildByName("TalkContent");
        this.talkNode.active = false;
        this.talkBg = this.talkNode.getChildByName("Background").getComponent(cc.Sprite); // 说话框背景图
        this.talkLbl = this.talkNode.getChildByName("Label").getComponent(cc.Label); // 说话内容Label
        this.eventBtns = this.node.getChildByName("EventBtns"); // 事件按钮数组
    },

    init: function () {
        this.background.spriteFrame = this.imgAtlas.getSpriteFrame(this.settings["bgImgUrl"]);
        this.talkBg.spriteFrame = this.imgAtlas.getSpriteFrame(this.settings["talkContentBg"]);
        this.node.getChildByName("EventBtns").active = true; // 激活按钮父节点
    },

    playerEnter: function () { // 玩家进入魔法屋
        this.restCount = Object.keys(this.playerKindDict).length; // 重置更新数量
        this.updateDict();
        // 等Update完成再调用
        // this.randomPlayer();
    },

    randomPlayer: function () { // 随机选择玩家角色
        let length = this.randomType.length;
        if (length <= 0) { console.log("Error: Magic error, random type is none."); return; }
        let index = Math.floor(Math.random() * length); // 随机下标
        let type = this.randomType[index];
        this.players = this.playerKindDict[type];
        if (this.players === []) { this.randomPlayer(); return; } // 如果该条件下没有玩家则重来
        let typeStr = this.settings["typeStr"][type];
        this.show(typeStr); // 显示
    },

    show: function (typeStr) { // 玩家角色进入魔法屋
        this.node.active = true;
        this.talkContent[this.settings["talkContent"]["replaceIndex"]] = typeStr; // 替换选中的人群类型字符串
        this.scheduleOnce(() => {
            this.talkNode.active = true;
            let delay = this.settings["talkContent"]["delay"];
            for (let i = 0; i < this.talkContent.length; i++) {
                this.scheduleOnce(() => {
                    this.talkLbl.string = this.talkContent[i.toString()];
                    if (i === this.talkContent.length - 1) { this.scheduleOnce(this.waitForSelect, 1); } // 说完最后一句就关掉对话框
                }, delay[i]);
            }
        }, 0.5);
    },

    waitForSelect: function () { // 等待选择命运
        this.talkNode.active = false;
    },

    updateDict: function () { // 更新玩家分类字典
        for (let i in this.randomType) {
            this.playerRound.emit(this.randomType[i], this.setDictPlayers.bind(this)); // 发射消息获取该分类下的玩家
        }
    },

    setDictPlayers: function (type, players) { // 获得玩家角色数组
        this.playerKindDict[type] = players;
        this.restCount--;
        if (this.restCount <= 0) {
            this.randomPlayer(); // 全部加载完成后再继续调用后续
        }
    },

    registEvent: function () { // 注册按钮点击事件
        for (let i in this.eventBtns.children) {
            let btn = this.eventBtns.children[i];
            btn.on("click", () => {
                this.node.active = false;
                this.emitEvent(btn.name);
                this.cancelEvent();
            });
        }
        // 已完成：就地拆除房屋、立刻坐牢三天、变卖所有卡片、向后转、就地加盖房屋、得一张卡片、存入所有现金
        // 待完成：抽取命运牌三张、住院检查三天、变卖所有道具
    },

    cancelEvent: function () { // 注销按钮点击事件
        for (let i in this.eventBtns.children) {
            this.eventBtns.children[i].off("click");
        }
    },

    emitEvent: function (eventName) {
        if (this.players.length <= 0) { this.callBack(); return; } // 没有角色需要执行了，调用完成回调
        let player = this.players[0];
        this.players.shift(); // 执行过的角色移除出数组
        this.node.emit(eventName, player, () => { this.emitEvent(eventName); }); // 按顺序执行每个角色的事件
    },
});