cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.node.active = false;
        this.node.scale = 0.1; // 初始化缩放
        this.stockMgr = cc.find("/Canvas/UI/StockPane").getComponent("StockMgr"); // 股票管理器
        this.nums = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
        this.numBtns = [];
        for (let i = 0; i < 10; i++) {
            this.numBtns[i] = this.node.getChildByName(this.nums[i] + "Btn"); // 获取数字按钮
            this.numBtns[i].on("click", () => { this.pressedNumBtn(i); }, this);
        }
        this.maxBtn = this.node.getChildByName("MaxBtn"); // 最大值按钮
        this.maxBtn.on("click", this.turnToMax.bind(this), this);
        this.enterBtn = this.node.getChildByName("EnterBtn"); // 确认按钮
        this.enterBtn.on("click", this.confirmNum.bind(this), this);
        this.clearBtn = this.node.getChildByName("ClearBtn"); // 清除按钮
        this.clearBtn.on("click", this.clear.bind(this), this);
        this.backBtn = this.node.getChildByName("BackBtn"); // 退格按钮
        this.backBtn.on("click", this.backspace.bind(this), this);
        this.number = 0;
        this.exitBtn = this.node.getChildByName("ExitBtn"); // 退出按钮
        this.exitBtn.on("click", this.hide.bind(this), this);
        this.numberLbl = this.node.getChildByName("Number").getComponent(cc.Label); // 数字Label
        this.updateNum();
    },

    pressedNumBtn: function (num) { // 按下数字键
        if (this.numberLbl.string.length < 11) {
            this.number *= 10;
            this.number += num;
            let stock = this.stockMgr.selected.getComponent("Stock");
            let deposit = this.stockMgr.deposit;
            if (this.buyOrSell) { // 买
                if (this.number > stock.tradingVolume) { this.number = stock.tradingVolume; } // 不能超过交易量
                if (stock.finalPrice * this.number > deposit) { // 不能买不起
                    this.number = parseInt(deposit / stock.finalPrice);
                }
            } else { // 卖
                if (this.number > stock.holdings[this.playerName]) { // 不能超出持有量
                    this.number = stock.holdings[this.playerName];
                }
            }
            this.updateNum();
        }
    },

    clear: function () { // 清除数字
        this.number = 0;
        this.updateNum();
    },

    backspace: function () { // 退格
        if (this.number > 0) {
            if (this.number < 10) { this.clear(); return; }
            this.number = parseInt(this.number / 10);
            this.updateNum();
        }
    },

    turnToMax: function () { // 调整至最大值
        let stock = this.stockMgr.selected.getComponent("Stock");
        let deposit = this.stockMgr.deposit;
        let max = 0;
        if (this.buyOrSell) { // 买
            if (stock.tradingVolume * stock.finalPrice < deposit) { max = stock.tradingVolume; }
            else { max = parseInt(deposit / stock.finalPrice); }
        } else { // 卖
            max = stock.holdings[this.playerName];
        }
        this.number = max;
        this.updateNum();
    },

    confirmNum: function () { // 确认数字
        if (!this.depositLbl) { console.log("存款Label出错，请检查Calculator类"); return; }
        this.stockMgr.trade(this.buyOrSell, this.playerName, this.number); // 调用交易函数
        this.depositLbl.emit("update"); // 消息通知更新存款余额
        this.hide();
    },

    updateNum: function () { // 更新数字
        this.numberLbl.string = this.number.toString();
    },

    show: function (playerName, deposit, depositLbl, buyOrSell) { // 显示数字键盘并更新玩家信息
        if (this.node.active) { return; }
        if (!this.stockMgr.selected) { return; }
        this.playerName = playerName;
        this.deposit = deposit;
        this.depositLbl = depositLbl; // 存款Label
        this.buyOrSell = buyOrSell; // 买或卖
        this.node.active = true;
        cc.tween(this.node)
            .to(0.3, { scale: 1 }, { easing: "sineInOut" })
            .start();
    },

    hide: function () { // 隐藏数字键盘
        if (!this.node.active) { return; }
        cc.tween(this.node)
            .to(0.3, { scale: 0.1 }, { easing: "sineInOut" })
            .call(() => { this.node.active = false; this.number = 0; this.updateNum(); })
            .start();
    },
});
