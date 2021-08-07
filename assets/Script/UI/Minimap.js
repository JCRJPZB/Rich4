cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.playerCtrlDire = cc.find("/SafeArea/Players").getComponent("PlayerCtrlDirector"); // 玩家控制管理器
        this.playerRound = cc.find("/SafeArea/Players").getComponent("PlayerRound"); // 玩家回合管理器
        this.mainCamera = cc.find("/SafeArea/Players/Main Camera"); // 主摄像头
        this.mainCmCtrl = this.mainCamera.getComponent("CameraCtrl"); // 主摄像头控制脚本
        this.map = cc.find("/SafeArea/Map").getComponent("Map"); // 地图管理器
        this.canvas = cc.find("/Canvas"); // 画布
        this.ui = cc.find("/Canvas/UI"); // UI节点
        this.currAreaBorder = this.node.getChildByName("CurrAreaBorder");
        this.currAreaBorder.getChildByName("Trigger").on("click", this.returnToPlayer, this); // 注册点击事件，回到当前角色视角
        this.moveAreaBorder = this.node.getChildByName("MoveAreaBorder");
        // this.moveAreaBorder.on("mousedown", this.onMouseDownOnMoveArea, this); // 注册点击事件
        this.moveAreaBorder.active = false;
        this.node.on("mousedown", this.enableMoveArea, this); // 注册鼠标事件，将视角移动到小地图点击位置对应的地图位置
        this.node.on("mousemove", this.onMoveAreaMove, this); // 
        this.node.on("mouseup", this.disableMoveArea, this); // 

        this.offsetX = this.canvas.getContentSize().width - this.node.width; // 鼠标点击偏移量
        this.offsetY = this.canvas.y + this.node.y; // 鼠标点击偏移量

        this.initalized = false;
        this.followMoveArea = false;
        this.isMouseDown = false;
    },

    init: function () {
        // 用可视区域设定比例
        this.miniScaleX = this.node.width / this.map.maxX;
        this.miniScaleY = this.node.height / this.map.maxY;
        this.initalized = true; // 初始化标记
    },

    returnToPlayer: function () { // 将主摄像头移回当前角色身上
        this.moveAreaBorder.active = false; // 隐藏红框
        this.followMoveArea = false; // 主摄像头不再跟随红框
        this.mainCmCtrl.enableFollowPlayer(); // 重新激活主摄像头跟随玩家
    },

    enableMoveArea: function (event) { // 按下鼠标
        this.moveBorder(this.moveAreaBorder, event.getLocation().x - this.offsetX, event.getLocation().y - this.offsetY);
        this.mainCmCtrl.disableFollowPlayer();
        this.followMoveArea = true;
        this.isMouseDown = true;
        this.moveAreaBorder.active = true;
    },

    onMoveAreaMove: function (event) { // 若正在拖动红框
        if (this.isMouseDown) {
            this.moveBorder(this.moveAreaBorder, event.getLocation().x - this.offsetX, event.getLocation().y - this.offsetY);
        }
    },

    disableMoveArea: function (event) { // 松开鼠标后红框不再跟随鼠标
        this.isMouseDown = false;
    },

    moveBorder: function (border, x, y) { // 限制框的移动边界
        let maxX = this.node.width - border.width / 2 - 3;
        let minX = border.width / 2 + 3;
        border.x = x < minX ? minX : (x > maxX ? maxX : x);
        let maxY = this.node.height - border.height / 2 - 3;
        let minY = border.height / 2 + 3;
        border.y = y < minY ? minY : (y > maxY ? maxY : y);
    },

    update: function (dt) {
        if (this.initalized) { // 初始化完成后，使白框始终跟随玩家位置在小地图上的投影
            let coordinate = this.getPlayerCoordinate();
            this.moveBorder(this.currAreaBorder, coordinate[0] * this.miniScaleX, coordinate[1] * this.miniScaleY);
        }
        if (this.followMoveArea) { // 操作红框时，使主摄像头跟随红框位置在大地图上的投影
            let posX = this.moveAreaBorder.x / this.miniScaleX;
            let posY = this.moveAreaBorder.y / this.miniScaleY;
            this.mainCamera.x = posX >= 320 ? posX : 320;
            this.mainCamera.y = posY >= 240 ? posY : 240;
        }
    },

    getPlayerCoordinate: function () { // 返回当前玩家角色名
        let coordinate = this.playerCtrlDire.getPlayerCoordinate(this.playerRound.getPlayerName());
        return [coordinate[0], coordinate[1]];
    },
});
