cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.isFollowed = false;
        this.map = cc.find("/SafeArea/Map").getComponent("Map"); // 地图管理器
        this.followingPlayer = null;
        this.activePlayer = null;
        this.node.x = 320;
        this.node.y = 240;

        this.node.on("changeFollow", this.changeFollowing, this); // 注册切换跟随玩家事件
    },

    changeFollowing: function (player) { // 切换跟随玩家
        this.followingPlayer = player;
    },

    changeActivePlayer: function (activePlayer, callback) { // 更新激活玩家
        this.disableFollowPlayer();
        this.followingPlayer = activePlayer;
        this.activePlayer = activePlayer;
        this.update(); // 生成this.pos
        cc.tween(this.node)
            .to(0.5, { position: cc.v2(this.posX, this.posY) })
            .call(() => { this.enableFollowPlayer(); callback(); }) // 摄像头就位后调用
            .start();
    },

    enableFollowPlayer: function () { // 激活跟随玩家
        this.followingPlayer = this.activePlayer;
        this.isFollowed = true;
    },

    disableFollowPlayer: function () { // 禁用跟随玩家
        this.isFollowed = false;
    },

    update: function (dt) { // 镜头跟随角色
        if (this.followingPlayer) {
            this.posX = this.followingPlayer.x + 100; // +100是为了保证人物居中
            this.posY = this.followingPlayer.y + 55; // +55是为了保证每次回到玩家控制角色回合时按钮位置在人物正上方
        }
        if (this.posX < 320) this.posX = 320; // 保证摄像头不会出地图
        if (this.posX > this.map.maxX - 320) this.posX = this.map.maxX - 320;
        if (this.posY < 240) this.posY = 240;
        if (this.posY > this.map.maxY - 240) this.posY = this.map.maxY - 240;
        if (this.followingPlayer && this.isFollowed) { // 当前跟随正确玩家且跟随状态激活
            this.node.x = this.posX;
            this.node.y = this.posY;
        }
    },
});
