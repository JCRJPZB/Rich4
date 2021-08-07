cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.lineNum = 0; // 节点所在线段序号
        this.price = 0;
        this.lv = 1;
        this.statusDict = { "rise": 0, "close": 0, "monster": 0 } // 土地状态字典
        this.highLigetSf = null;
    },

    init: function (pointJson, num) {
        this.pointName = pointJson['pointName'];
        this.eventName = null;
        this.facilityName = null;
        this.num = num; // 节点序号

        if (this.pointName === "node") { // 加载节点图片
            this.onPointImgLoaded(null, this.pointMgr.nodeImgs.getSpriteFrame(pointJson['imgUrl']), this.node);
            this.eventName = pointJson['imgUrl']; // 事件名
        } else if (this.pointName === "point") {
            this.onPointImgLoaded(null, this.pointMgr.pointImgs.getSpriteFrame(pointJson['imgUrl']), this.node);
            this.eventName = pointJson['imgUrl']; // 事件名
        } else if (this.pointName === "building" || this.pointName === 'facility') {
            this.eventName = this.pointName; // 事件名
            this.effectSprite = this.node.getChildByName("Effect").getComponent(cc.Sprite); // 状态Sprite
            this.loader.loadRes(pointJson['imgUrl'], cc.SpriteFrame, this.onPointImgLoaded.bind(this), this.node.getChildByName("Border")); // 设置边框
            this.node.angle = pointJson['angle']; // 调整建筑摆放角度
            this.price = (this.pointName === "building") ? this.pointMgr.buildingPrice : this.pointMgr.facilityPrice; // 设置土地价格
            this.signImg = this.node.getChildByName("BuildingImg").getComponent(cc.Sprite); // 玩家标志
            this.loader.loadRes("/Texture/Map/selected-border", cc.SpriteFrame, (err, sf) => { // 高亮图片
                if (err) { console.log(err); return; }
                this.highLigetSf = sf;
            })
        } else { // 其他类型的直接使用默认设置
            this.loader.loadRes(pointJson['imgUrl'], cc.SpriteFrame, this.onPointImgLoaded.bind(this), this.node);
        }
        this.owner = "N"; // 节点归属 // "N" means neutral, other means player
        this.node.x = pointJson['position'][0]; // 修改坐标以放置该点
        this.node.y = pointJson['position'][1];
    },

    onPointImgLoaded: function (err, sf, target) {
        if (err) { console.log(err); return; }
        target.getComponent(cc.Sprite).spriteFrame = sf; // 加载图片
    },

    changeSignImg: function (imgUrl) { // 修改当前土地的玩家标志
        if (this.pointName !== "building" && this.pointName !== "facility") { return; }
        if (imgUrl == null) { this.signImg.spriteFrame = null; return; }
        this.loader.loadRes(imgUrl, cc.SpriteFrame, (err, sf) => {
            if (err) { console.log(err); return; }
            this.signImg.spriteFrame = sf;
        });
    },

    isMaxLv: function () { // 检查当前建筑是否达到最大等级
        if (this.lv === this.pointMgr.maxBuildLv) return true;
        else return false;
    },

    getLv: function () { return this.lv; },

    addStatus: function (statusName, duration, imgUrl) {
        if ((statusName === "rise" && this.statusDict["close"] > 0) ||
            (statusName === "close" && this.statusDict["rise"] > 0)) {
            this.statusDict["rise"] = this.statusDict["close"] = 0;
            this.setEffectImg(null); // 清除效果图片
            return "cardOffset";
        } else if (statusName === "monster") { // 被摧毁
            if (this.owner === "N") {
                return "noBuilding";
            }
            this.demolish();
            return "useSuccess";
        }
        if (imgUrl) { this.setEffectImg(imgUrl); } // 更新效果图片
        this.statusDict[statusName] = duration; // 更新状态持续时间
        return "useSuccess";
    },

    setEffectImg: function (imgUrl) { // 修改效果图片
        if (imgUrl === null) { this.effectSprite.spriteFrame = null; return; }
        this.loader.loadRes(imgUrl, cc.SpriteFrame, (err, sf) => {
            if (err) { console.log(err); return; }
            this.effectSprite.spriteFrame = sf;
            if (this.pointName === "facility") {
                this.effectSprite.node.scaleX = 2;
                this.effectSprite.node.scaleY = 2;
            }
        });
    },

    newRound: function () { // 每个回合都更新效果的持续时间
        if (this.pointName !== "building" && this.pointName !== "facility") { return; }
        for (let status in this.statusDict) {
            if (this.statusDict[status] > 0) {
                this.statusDict[status]--;
                if (this.statusDict[status] === 0) {
                    this.setEffectImg(null);
                    console.log(this.owner + "的" + this.pointName + "的" + status + "效果已结束");
                } else {
                    console.log(this.owner + "的" + this.pointName + "的" +
                        status + "效果还将持续" + this.statusDict[status].toString() + "回合。");
                }
            }
        }
    },

    demolish: function () { // 摧毁该建筑
        this.changeSignImg(null);
        this.lv = 1;
        this.pointMgr.changePointOwner(this, "N");
        this.setEffectImg(null);
        for (let status in this.statusDict) { this.statusDict[status] = 0; }
    },

    getPrice: function () {
        if (this.statusDict["rise"] > 0) { return this.price * 2; } // 涨价中
        if (this.statusDict["close"] > 0) { return 0; } // 查封中
        return this.price;
    },

    selected: function () { this.node.getComponent(cc.Sprite).spriteFrame = this.highLigetSf; }, // 播放闪烁动画

    unSelected: function () { this.node.getComponent(cc.Sprite).spriteFrame = null; }, // 停止播放闪烁动画

    getPointName: function () { return this.pointName; },

    getOwner: function () { return this.owner; },

    setOwner: function (playerName) { this.owner = playerName; },

    getNum: function () { return this.num; },

    setLineNum: function (lineNum) { this.lineNum = lineNum; },

    getLineNum: function () { return this.lineNum; },
});