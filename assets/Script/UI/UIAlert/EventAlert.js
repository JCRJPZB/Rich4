cc.Class({
    extends: cc.Component,
    properties: {},

    onLoad: function () {
        this.node.active = false; // 首次加载调整为隐藏状态
        this.contentLbl = this.node.getChildByName("Content").getComponent(cc.Label); // 内容文本标签
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.playerLandActivity = cc.find("/SafeArea/Players"); // 角色停留自定事件节点
        this.bg = this.node.getChildByName("Background").getComponent(cc.Sprite);
        this.node.scale = 0.1; // 初始化缩放
    },

    init: function (json, callBack) {
        this.loader.loadRes(json["bgImgUrl"], cc.SpriteFrame, (err, res) => {
            if (err) { console.log(err); return; }
            this.bg.spriteFrame = res; // 设置图片
            callBack(); // 加载完成回调
        });
        this.replaceSign = json["replaceSign"]
        this.content = json["content"]; // 内容文本json
        this.delay = json["delay"]; // 提示框持续时间
    },

    show: function (callback, type, param, replacement) { // 缓动显示提示框
        this.contentLbl.string = this.content[type]; // 根据类型设置内容文本
        if (param) { this.contentLbl.string = this.content[type] + param; } // 若有参数则附加
        if (replacement) { this.contentLbl.string = this.contentLbl.string.replace(this.replaceSign, replacement); } // 若有替换则替换
        this.node.active = true;
        cc.tween(this.node)
            .to(0.3, { scale: 1 }, { easing: "sineInOut" })
            .call(() => { this.scheduleOnce(() => { this.hide(callback); }, this.delay); })// 持续一段时间后自动消失！
            .start();
    },

    hide: function (callback) { // 缓动隐藏提示框
        cc.tween(this.node)
            .to(0.3, { scale: 0.1 }, { easing: "sineInOut" })
            .call(() => { callback(); this.node.active = false; })
            .start();
    },
});
