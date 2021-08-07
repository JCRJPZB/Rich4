cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.node.active = false;
        this.node.scale = 0.1; // 初始化缩放
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); //资源管理器
        this.cardMgr = this.node.getComponent("CardMgr"); // 卡片管理器
        this.bg = this.node.getChildByName("Background").getComponent(cc.Sprite); // 背景
        this.toolBarBtn = cc.find("/Canvas/UI/TopToolBar/Cards/Btn"); // 触发按钮
        this.toolBarBtn.on("click", this.show.bind(this), this); // 注册点击事件,显示面板
        this.exitBtn = this.node.getChildByName("ExitBtn"); // 退出按钮
        this.exitBtn.on("click", this.hide.bind(this), this); // 注册点击事件，隐藏面板
        this.pageUpBtn = this.node.getChildByName("PageUp"); // 上一页按钮
        this.pageUpBtn.on("click", () => { this.cardMgr.turnPage(true); }, this); // 注册点击事件，切换到上一页卡片
        this.pageDownBtn = this.node.getChildByName("PageDown"); // 上一页按钮
        this.pageDownBtn.on("click", () => { this.cardMgr.turnPage(false); }, this); // 注册点击事件，切换到下一页卡片
        this.node.on("mousewheel", (event) => { // 注册滑动滚轮事件
            if (event.getScrollY() > 0) { this.cardMgr.turnPage(true); } // 上滑
            else { this.cardMgr.turnPage(false); } // 下滑
        }, this);
        this.loader.loadResWithCount("/config/settings", cc.JsonAsset, this.onJsonLoaded.bind(this)); // 加载配置
    },

    onJsonLoaded: function (err, json) {
        if (err) { console.log(err); return; }
        let cardJson = json.json["Card"];
        let imgArray = ["background", "exitBtnImgUrl", "pgUpBtnImgUrl", "pgDownBtnImgUrl"];
        let sfArray = [this.bg, this.exitBtn.getChildByName("Background").getComponent(cc.Sprite),
                        this.pageUpBtn.getChildByName("Background").getComponent(cc.Sprite),
                        this.pageDownBtn.getChildByName("Background").getComponent(cc.Sprite)];
        for (let index in imgArray) {
            this.loader.loadRes(cardJson[imgArray[index]], cc.SpriteFrame, (err, sf) => { // 加载背景图片
                if (err) { console.log(err); return; }
                sfArray[index].spriteFrame = sf;
            });
        }
    },

    show: function () { // 显示本面板
        if (this.node.active) { return; } // 若已显示则不做处理
        this.node.active = true;
        this.cardMgr.show();
        cc.tween(this.node)
            .to(0.3, { scale: 1 }, { easing: "sineInOut" })
            .start();
    },

    hide: function () { // 隐藏本面板
        if (!this.node.active) { return; } // 若已隐藏则不做处理
        cc.tween(this.node)
            .to(0.3, { scale: 0.1 }, { easing: "sineInOut" })
            .call(() => {
                this.node.active = false;
                this.cardMgr.hide();
            })
            .start();
    },
});
