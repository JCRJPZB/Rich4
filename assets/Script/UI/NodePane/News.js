cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.node.active = false;
        this.playerRound = cc.find("/SafeArea/Players").getComponent("PlayerRound"); // 回合管理器
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.bgSprite = this.node.getChildByName("Background").getComponent(cc.Sprite); // 背景图
        this.typeLbl = this.node.getChildByName("Type").getComponent(cc.Label); // 类型Label
        this.contentLbl = this.node.getChildByName("Content").getComponent(cc.Label); // 内容Label
        this.eventAtlas = null;
        this.eventSprite = this.node.getChildByName("EventSprite").getComponent(cc.Sprite); // 事件图片
        this.contentJson = null;
        this.loader.loadResWithCount("/config/settings", cc.JsonAsset, (err, json) => {
            if (err) { console.log(err); return; }
            let setting = json.json;
            this.loader.loadRes(setting["News"]["bgImgUrl"], cc.SpriteFrame, (err, sf) => {
                if (err) { console.log(err); return; }
                this.bgSprite.spriteFrame = sf; // 加载背景图
            });
            this.loader.loadRes(setting["News"]["eventAtlas"], cc.SpriteAtlas, (err, atlas) => {
                if (err) { console.log(err); return; }
                this.eventAtlas = atlas; // 加载事件图片图集
            });

            this.contentJson = setting["News"]["content"];
            this.delay = setting["News"]["delay"]; // 新闻显示的时间
        });

        this.playerRound.node.on("news", (playerName, callBack) => { this.generateNews(callBack); }); // 生成新闻
    },

    generateNews: function (callBack) {
        // 随机生成新闻类型
        let length = Object.keys(this.contentJson["type"]).length;
        let index = parseInt(Math.random() * length);
        let typeId = Object.keys(this.contentJson["type"])[index];
        // ########################
        // typeId = "financial"; // ## 测试用
        // ########################
        let type = this.contentJson["type"][typeId];
        // 在类型的基础上随机生成新闻内容
        length = Object.keys(this.contentJson[typeId]).length; // 获取长度
        index = parseInt(Math.random() * length); // 随机生成下标
        let contentId = Object.keys(this.contentJson[typeId])[index]; // 根据下标获取事件ID
        // ########################
        // contentId = "jailed"; // ## 测试用
        // ########################
        let content = this.contentJson[typeId][contentId]; // 获取新闻内容

        this.typeLbl.string = type; // 配置新闻类型
        this.contentLbl.string = content; // 配置新闻内容
        this.eventSprite.spriteFrame = this.eventAtlas.getSpriteFrame(contentId); // 配置事件图片
        this.node.emit(contentId, content, this.delay + 0.5, callBack,
            (content) => { if (content) { this.contentLbl.string = content; } this.show(); }, // 显示
            () => { this.generateNews(callBack); }); // 发出事件消息
    },

    show: function () {
        this.node.active = true;
        cc.tween(this.node)
            .to(0.3, { scale: 1 }, { easing: "sineInOut" })
            .call(() => { this.scheduleOnce(() => { this.hide(); }, this.delay); })
            .start();
    },

    hide: function () {
        cc.tween(this.node)
            .to(0.3, { scale: 0.1 }, { easing: "sineInOut" })
            .call(() => { this.node.active = false; })
            .start();
    },
});
