cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function () {
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr");
        this.color = { "r": 255, "g": 255, "b": 255, "a": 255 }; // RGB颜色
        this.isBot = false;
    },

    init: function (playerJson, initialCash, initialDeposit, callBack) {
        this.loader.loadRes(playerJson["imgUrl"], cc.SpriteFrame, (err, sf) => {
            if (err) { console.log(err); return; }
            this.node.getChildByName("PlayerImg").getComponent(cc.Sprite).spriteFrame = sf; // 设置角色图片
        });
        this.loader.loadRes(playerJson["imgUrl"], cc.SpriteFrame, (err, sf) => {
            if (err) { console.log(err); return; }
            this.node.getChildByName("PlayerImg_rev").getComponent(cc.Sprite).spriteFrame = sf; // 设置反向角色图片
        });
        this.attrDict = { // 属性字典
            "PlayerName": playerJson["name"], "Sex": playerJson["sex"], "Cash": initialCash,
            "Card": 0, "Deposit": initialDeposit, "Tool": 0, "Stock": 0, "Land": 0,
            "Total": initialCash + initialDeposit, "Ticket": 0, "Duration": 0
        }
        // this.playerName = playerJson["name"];
        // this.sex = playerJson["sex"];
        this.portrait = playerJson["portrait"]; // 头像
        // this.cash = initialCash; // 现金
        // this.deposit = initialDeposit; // 存款
        // this.stockValue = 0; // 股值
        // this.totalMoney = this.cash + this.deposit + this.stockValue; // 总资金
        // this.ticketNum = 0; // 点券数量
        // this.landNum = 0; // 土地数量
        // this.toolNum = 0; // 道具数量
        // this.cardNum = 0; // 卡片数量
        // this.statusDuration = 0; // 状态持续时间
        this.signImgUrl = playerJson["signImgUrl"];
        for (let color in playerJson["color"]) { // 获取角色代表色
            this.color[color] = playerJson["color"][color];
        }
        this.status = "Normal" // Jailed
        callBack(); // 加载完成
    },
});