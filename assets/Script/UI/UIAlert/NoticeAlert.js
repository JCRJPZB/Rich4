cc.Class({
    extends: cc.Component,
    properties: {},

    onLoad: function () {
        this.node.active = false; // 首次加载调整为隐藏状态
        this.contentLbl = this.node.getChildByName("Content").getComponent(cc.Label); // 内容文本标签
        this.confirmBtn = this.node.getChildByName("Btn").getChildByName("Confirm"); // 确认按钮
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
        this.content = json["content"]; // 内容文本json
        this.confirmBtn.getChildByName("Label").getComponent(cc.Label).string = json["confirmStr"];
    },

    show: function (callback, type, param, substitute, replacement) { // 缓动显示提示框
        this.contentLbl.string = this.content[type]; // 根据类型设置内容文本
        if (param) { this.contentLbl.string = this.content[type] + param; } // 若有参数则附加
        if (replacement && substitute.length === 2) { this.contentLbl.string.replace(substitute[0], substitute[1]); } // 若有替代则替代
        this.confirmBtn.on("click", () => { this.hide(callback); }, this);
        this.node.active = true;
        cc.tween(this.node)
            .to(0.3, { scale: 1 }, { easing: "sineInOut" })
            .start();
    },

    hide: function (callback) { // 缓动隐藏提示框
        this.confirmBtn.off("click");
        cc.tween(this.node)
            .to(0.3, { scale: 0.1 }, { easing: "sineInOut" })
            .call(() => {
                callback();
                this.node.active = false;
            })
            .start();
    },
});
