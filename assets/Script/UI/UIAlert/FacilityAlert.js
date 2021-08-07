cc.Class({
    extends: cc.Component,

    properties: {
        lblPrefab: cc.Prefab,
    },

    onLoad: function () {
        this.node.active = false; // 首次加载调整为隐藏状态
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.playerLandActivity = cc.find("/SafeArea/Players"); // 角色停留自定事件节点
        this.confirmBtn = this.node.getChildByName("Btn").getChildByName("Confirm"); // 确认按钮
        this.cancelBtn = this.node.getChildByName("Btn").getChildByName("Cancel"); // 确认按钮
        this.chooseNode = this.node.getChildByName("Choose"); // 选择框节点
        this.facilityLbl = this.node.getChildByName("Facilities"); // 设施标签节点
        this.bg = this.node.getChildByName("Background").getComponent(cc.Sprite);
        this.node.scale = 0.1; // 初始化缩放

        this.confirmBtn.on("click", () => { this.hide(true); }, this);
        this.cancelBtn.on("click", () => { this.hide(false); }, this);

        this.chooseDict = {},
        this.choose = null;
    },

    init: function (json, callback) {
        this.loader.loadRes(json["bgImgUrl"], cc.SpriteFrame, (err, res) => {
            if (err) { console.log(err); return; }
            this.bg.spriteFrame = res; // 设置图片
        });
        this.loader.loadRes(json["chooseImgUrl"], cc.SpriteFrame, (err, sf) => {
            if (err) { console.log(err); return; }
            this.chooseNode.getComponent(cc.Sprite).spriteFrame = sf; // 设置图片
            callback(); // 加载完成回调
        });
        let lblStrJson = json["lblStr"]; // 标签文本内容
        let lblPos = json["lblPos"]; // 标签摆放位置
        for (var lblStr in lblStrJson) {
            if (!lblPos[lblStr]) { console.log("选择建造设施提示框配置错误！"); return; }
            this.generateLabel(lblStrJson[lblStr], lblPos[lblStr], lblStr); // 根据配置生成标签
        }
        for (var lblStr in lblStrJson) { this.exchangeChoose(lblStr); break; } // 初始化选择框位置
        this.confirmBtn.getChildByName("Label").getComponent(cc.Label).string = json["confirmStr"];
        this.cancelBtn.getChildByName("Label").getComponent(cc.Label).string = json["cancelStr"];
    },

    generateLabel: function (name, pos, lblStr) {
        let newLbl = cc.instantiate(this.lblPrefab);
        newLbl.parent = this.facilityLbl;
        newLbl.getComponent(cc.Label).string = name;
        newLbl.x = pos[0];
        newLbl.y = pos[1];
        this.chooseDict[lblStr] = newLbl;
        newLbl.on(cc.Node.EventType.MOUSE_UP, () => { this.exchangeChoose(lblStr); }, this);
    },

    exchangeChoose: function (name) { // 更换当前选择的设施
        this.choose = name;
        this.chooseNode.x = this.chooseDict[name].x;
        this.chooseNode.y = this.chooseDict[name].y;
    },

    show: function () { // 缓动显示提示框
        this.node.active = true;
        cc.tween(this.node)
            .to(0.3, { scale: 1 }, { easing: "sineInOut" })
            .start();
    },

    hide: function (TOF) { // 缓动隐藏提示框
        cc.tween(this.node)
            .to(0.3, { scale: 0.1 }, { easing: "sineInOut" })
            .call(() => {
                this.playerLandActivity.emit("chooseFacility", TOF, this.choose); // 传递是否新建设施以及新建何种设施
                this.node.active = false;
            })
            .start();
    },
});
