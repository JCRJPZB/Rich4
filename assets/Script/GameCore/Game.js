cc.Class({
    extends: cc.Component,

    properties: {
        gameManager: null, // 游戏管理器
    },

    onLoad: function () { // 初始化
        this.playerMgr = cc.find("/SafeArea/Players").getComponent("PlayerMgr"); // 玩家管理器
        this.map = cc.find("/SafeArea/Map").getComponent("Map"); // 地图
        this.miniMap = cc.find("/Canvas/UI/Minimap").getComponent("Minimap"); // 小地图
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.cardMgr = cc.find("/Canvas/UI/CardPane").getComponent("CardMgr"); // 卡片管理器
        this.stockMgr = cc.find("/Canvas/UI/StockPane").getComponent("StockMgr") // 股票管理器
        this.loadDict = { "Map": false, "Player": false, "UI": false }; // 加载内容字典
        this.loadNum = Object.keys(this.loadDict).length; // 需要加载的模块数
        this.node.on("MapReady", () => { this.modelLoaded("Map"); }, this); // 注册地图模块加载完成事件
        this.node.on("PlayerReady", () => { this.modelLoaded("Player"); }, this); // 注册玩家模块加载完成事件
        this.node.on("UIReady", () => { this.modelLoaded("UI") }, this); // 注册界面模块加载完成事件

        // ###########################
        this.map.init("Japan"); // 选择地图由此修改！
        this.stockMgr.init("Japan"); // 股票跟随地图变化
        // ###########################
        this.playerMgr.initPrefab(["阿土伯", "沙隆巴斯", "钱夫人", "孙小美"]); // 选择角色从此修改！
        // ###########################
        
        this.gameState = false; // 游戏状态

        this.playerMgr.node.on("GameOver", this.gameOver.bind(this), this); // 注册游戏结束响应
    },

    modelLoaded: function (modelName) {
        if (this.loadDict[modelName]) { return; } // 防止重复消息
        this.loadDict[modelName] = true;
        this.loadNum--;
        if (this.loadNum === 0) { // 若所有模块均加载完毕则开始游戏
            this.gameStart();
        }
    },

    gameStart: function () { // 开始游戏
        if (!this.playerMgr.initalized) { console.log("角色尚未初始化！"); return; }
        console.log("Game Start!");
        this.gameState = true;
        let playerNames = this.playerMgr.playerNames;
        this.cardMgr.init(playerNames); // 初始化卡片管理器
        this.playerMgr.gameStart(); // 开始游戏
        this.miniMap.init(); // 初始化小地图
        this.stockMgr.initPlayerHoldings(playerNames); // 初始化股票
    },

    gameOver: function (playerName) { // 游戏结束
        console.log("Game Over, " + playerName + " win!");
        // ######################## 游戏结束界面待编辑
        this.gameState = false;
    },
});
