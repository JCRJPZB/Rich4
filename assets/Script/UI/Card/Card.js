cc.Class({
    extends: cc.Component,

    properties: {
    },

    init: function (json, index, playerName, useCard, cardJson, currPage) {
        this.cardName = json["cardName"];
        this.cardId = json["cardId"];
        this.price = json["price"];
        this.duration = json["duration"];
        this.index = index; // 下标
        this.playerName = playerName; // 角色ID
        this.rowMax = cardJson["rowMax"]; // 每行的卡片数
        this.colMax = cardJson["colMax"]; // 每列的卡片数
        this.rowPadding = cardJson["rowPadding"]; // 卡片间横向间隔
        this.colPadding = cardJson["colPadding"]; // 卡片间纵向间隔
        this.startPos = cardJson["startPos"]; // 第一张卡片的位置
        this.pageIndex = parseInt(index / (this.rowMax * this.colMax)); // 页码
        this.realIndex = this.index % (this.rowMax * this.colMax); // 该卡片在当前页的下标
        this.node.getComponent(cc.Label).string = this.cardName; // 初始化卡片属性
        this.node.getChildByName("Trigger").on("click", () => { // 注册卡片点击事件
            useCard(this.cardId, this.playerName, this.index);
        }, this);
        this.setCardPos(this.realIndex, currPage); // 设置位置
    },

    setCardPos: function (index, currPage) { // 根据卡片的下标摆放卡片
        if (index < 0) { console.log("卡片下标出错！"); return; }
        this.node.x = this.startPos[0] + ((index % this.rowMax) * this.rowPadding);
        this.node.y = this.startPos[1] - (parseInt(index / this.rowMax) * this.colPadding);
        if (currPage !== this.pageIndex) { this.node.active = false; } // 若不在当前页则隐藏
        else { this.node.active = true; }
    },

    remove: function () { // 移除自身
        this.node.parent = null;
    },

    updatePos: function (index, currPage) { // 更新卡片位置
        this.index = index;
        this.realIndex = index % (this.rowMax * this.colMax);
        this.pageIndex = parseInt(this.index / (this.rowMax * this.colMax));
        this.setCardPos(this.realIndex, currPage);
    },
});
