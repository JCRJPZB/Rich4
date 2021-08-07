cc.Class({
    extends: cc.Component,

    properties: {
        playerPrefab: cc.Prefab,
    },

    onLoad: function () {
        this.playerNames = ["阿土伯", "沙隆巴斯", "钱夫人", "孙小美"]; // 后面要加入选择游戏角色的功能
        this.playerCount = this.playerNames.length; // 玩家数量
        this.players = new Array(); // 玩家数组
        this.game = cc.find("/Canvas").getComponent("Game"); // Game
        this.playerAttrDire = this.node.getComponent("PlayerAttrDirector");
        this.playerCtrlDire = this.node.getComponent("PlayerCtrlDirector");
        this.playerRound = this.node.getComponent("PlayerRound"); // 回合管理器
        this.initalized = false;
        this.prefabReady = false;
        this.settingReady = false;

        this.node.on("SettingLoaded", () => { this.settingReady = true; this.initPlayer(); });
    },

    initPrefab: function (playerNames) {
        if (playerNames) { this.playerNames = playerNames; this.playerCount = playerNames.length; }
        for (let i = 0; i < this.playerCount; i++) {
            let player = cc.instantiate(this.playerPrefab); // 使用预制体新建节点
            player.parent = this.node; // 设置父节点
            this.players[i] = player; // 将玩家放入玩家列表
        }
        this.prefabReady = true;
        this.initPlayer();
    },

    initPlayer: function () {
        if (!this.prefabReady || !this.settingReady) { return; } // 预制体以及设置均准备完毕后再初始化角色
        this.playerAttrDire.init(this.playerNames, this.players); // 初始化属性director
        this.playerRound.init(this.playerNames, this.players, this.playerAttrDire, this.playerCtrlDire);
        this.initalized = true;
    },

    gameStart: function () {
        this.playerCtrlDire.init(this.playerNames, this.players, () => { this.playerRound.gameStart(); }); // 初始化控制director
    },

    gameOver: function () {
        this.game.gameOver();
    },
});