cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function () {
        this.moveDist = this.currentPos = 0; // 移动距离以及初始位置
        this.direction = 1; // 前进方向
        this.noticeLabel = this.node.getChildByName("Notice"); // 提示Label
        this.noticeAnim = this.noticeLabel.getComponent(cc.Animation); // 提示动画
    },

    init: function (playerName, callBack) {
        this.noticeLabel.active = false;
        this.node.getChildByName("Trigger").on("click", () => { callBack(playerName); }, this);
    },

    reverseDire: function () { // 转换方向
        this.direction = -this.direction;
        if (this.direction > 0) {
            this.node.getChildByName("PlayerImg").active = true;
            this.node.getChildByName("PlayerImg_rev").active = false;
        } else {
            this.node.getChildByName("PlayerImg").active = false;
            this.node.getChildByName("PlayerImg_rev").active = true;
        }
    },

    setPosition: function (pos, point) { // 移动玩家
        this.currentPos = pos;
        this.node.x = point.x;
        this.node.y = point.y;
    },

    moveToPos: function (pos, point, callBack) { // 移动至指定位置
        this.currentPos = pos;
        let dist = Math.sqrt((point.x - this.node.x) ** 2 + (point.y - this.node.y) ** 2);
        let delay = dist / 65 * 0.05;
        cc.tween(this.node)
            .to(delay, { position: cc.v2(point.x, point.y) }) // 移动到指定位置
            .call(() => { if (callBack) { callBack(); } }) // 完成回调
            .start();
    },

    moveToNext: function (next, moveToNext, playerName, callBack) {
        this.currentPos = next.getComponent('Point').getNum(); // 刷新玩家当前位置标记
        cc.tween(this.node)
            .to(0.5, { position: cc.v2(next.x, next.y) }) // 移动到下一个点位
            .call(() => { moveToNext(playerName, callBack); }) // 使用回调调用下一步的移动
            .start();
    },
});
