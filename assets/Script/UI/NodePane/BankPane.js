cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.node.active = false;
        this.node.scale = 0.1; // 初始化缩放
        this.playerAttrDire = cc.find("/SafeArea/Players").getComponent("PlayerAttrDirector"); // 玩家属性管理器

        this.numBtns = [];
        for (let i = 0; i < 10; i++) {
            this.numBtns[i] = this.node.getChildByName("Btns").getChildByName(i.toString()); // 获取数字按钮
            this.numBtns[i].on("click", () => { this.pressedNumBtn(i); }, this);
        }
        this.maxBtn = this.node.getChildByName("Btns").getChildByName("max"); // 最大值按钮
        this.maxBtn.on("click", this.turnToMax.bind(this), this);
        this.enterBtn = this.node.getChildByName("Btns").getChildByName("enter"); // 确认按钮
        this.enterBtn.on("click", this.confirmNum.bind(this), this);
        this.clearBtn = this.node.getChildByName("Btns").getChildByName("clear"); // 清除按钮
        this.clearBtn.on("click", this.clear.bind(this), this);
        this.backBtn = this.node.getChildByName("Btns").getChildByName("backspace"); // 退格按钮
        this.backBtn.on("click", this.backspace.bind(this), this);
        this.number = 0;
        this.takeBtn = this.node.getChildByName("TopBtn").getChildByName("Take"); // 取钱按钮
        this.takeBtn.on("click", this.takeMoney.bind(this), this); // 注册取钱事件
        this.saveBtn = this.node.getChildByName("TopBtn").getChildByName("Save"); // 存钱按钮
        this.saveBtn.on("click", this.saveMoney.bind(this), this); // 注册存钱事件
        this.exitBtn = this.node.getChildByName("TopBtn").getChildByName("Exit"); // 退出按钮

        this.numberLbl = this.node.getChildByName("Count").getComponent(cc.Label); // 数字Label

        this.playerAttrDire.node.on("bank", (playerName, callBack) => { this.show(playerName, callBack); }, this);

        this.takeOrSave = true; // 默认是取钱的状态
        this.saveBtn.getChildByName("Choose").active = false;

        this.updateNum(); // 更新
    },

    takeMoney: function () { // 取钱按钮
        this.takeOrSave = true;
        this.takeBtn.getChildByName("Choose").active = true;
        this.saveBtn.getChildByName("Choose").active = false;
    },

    saveMoney: function () {
        this.takeOrSave = false;
        this.takeBtn.getChildByName("Choose").active = false;
        this.saveBtn.getChildByName("Choose").active = true;
    },

    turnToMax: function () {
        let money = this.playerAttrDire.getPlayerMoney(this.playerName);
        if (this.takeOrSave) { this.number = money[1]; }
        else { this.number = money[0]; }
        this.updateNum();
    },

    pressedNumBtn: function (num) { // 按下数字按钮
        if (this.numberLbl.string.length < 11) {
            this.number *= 10;
            this.number += num;
            let money = this.playerAttrDire.getPlayerMoney(this.playerName);
            let cash = money[0];
            let deposit = money[1];
            if (this.takeOrSave && this.number > deposit) { this.number = deposit; }
            if (!this.takeOrSave && this.number > cash - 1) { this.number = cash - 1; }
            this.updateNum();
        }
    },

    confirmNum: function () {
        let cashAmount = 0;
        let depositAmount = 0;
        if (this.takeOrSave) { cashAmount = this.number; depositAmount = -this.number; }
        else { depositAmount = this.number; cashAmount = -this.number; }
        let result = this.playerAttrDire.changePlayerMoney(this.playerName, cashAmount, depositAmount, 0);
        if (!result) { console.log("存取款失败，检查BankPane类。"); }
        this.clear();
    },

    clear: function () { // 清零
        this.number = 0;
        this.updateNum();
    },

    backspace: function () {
        if (this.number > 0) {
            if (this.number < 10) { this.clear(); return; }
            this.number = parseInt(this.number / 10);
            this.updateNum();
        }
    },

    updateNum: function () { // 更新数字
        this.numberLbl.string = this.number.toString();
    },

    show: function (playerName, callBack) {
        if (!playerName) { console.log("Error: BankPane can't read playerName!"); return; }
        this.playerName = playerName;
        this.money = this.playerAttrDire.getPlayerMoney(this.playerName);
        if (!this.money) { console.log("Error: BankPane can't read playerMoney!"); return; }
        this.exitBtn.on("click", () => { this.hide(callBack); }, this); // 注册退出按钮事件
        this.node.active = true;
        cc.tween(this.node)
            .to(0.3, { scale: 1 }, { easing: "sineInOut" })
            .start();
    },

    hide: function (callBack) {
        this.exitBtn.off("click"); // 注销退出按钮点击事件
        cc.tween(this.node)
            .to(0.3, { scale: 0.1 }, { easing: "sineInOut" })
            .call(() => {
                this.node.active = false;
                this.clear();
                if (callBack) { callBack(); }
            })
            .start();
    },
});
