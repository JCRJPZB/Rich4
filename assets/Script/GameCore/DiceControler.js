cc.Class({
    extends: cc.Component,

    properties: {
        count: 1,
        max_count: 3,
        mode: 'single',
        multipleDice: { // 多个骰子的按钮
            default: null,
            type: cc.Node,
        },
        singleleDice: { // 单个骰子的按钮
            default: null,
            type: cc.Node,
        },
        activeDice: { // 已经激活的骰子的按钮
            default: null,
            type: cc.Node,
        },
        dice3D: { // 3D骰子数组
            default: [],
            type: cc.Node,
        },
        dice_anim: [], // 骰子动画数组
    },

    onLoad: function () {
        this.total = 0; // 点数总和
        this.throwDiceCallBack = null; // 掷骰子回调
        for (let i = 0; i < this.max_count; i++) { // 注册骰子动画
            this.dice_anim[i] = this.dice3D[i].getComponent(cc.Animation);
        }
        this.dice_anim[0].on('finished', this.onDiceStoped, this); // 添加动画结束回调
        this.game = cc.find("/Canvas").getComponent("Game");
        this.playerMgr = cc.find("/SafeArea/Players").getComponent("PlayerMgr"); // 玩家管理器
        this.cameraCtrl = cc.find("/SafeArea/Players/Main Camera").getComponent("CameraCtrl"); // 摄像头控制器
        this.miniMap = cc.find("/Canvas/UI/Minimap").getComponent("Minimap"); // 小地图
        this.node.getChildByName("Go").on("click", this.throwDice, this); // 绑定掷骰子函数
        this.node.on("throw", this.throwDice, this);
    },

    onDiceStoped: function () { // 骰子动画播放结束后等待1秒销毁骰子，并在回调中调用玩家的移动函数
        this.scheduleOnce(() => {
            for (let i = 0; i < this.count; i++) this.dice3D[i].active = false;
            this.returnPointCount();
        }, 1);
    },

    returnPointCount: function () {
        this.playerMgr.playerRound.receiveDicePoint(this.total); // 传回掷出的点数
    },

    throwDice: function () {
        this.cameraCtrl.enableFollowPlayer(); // 点击掷骰子后使主摄像头恢复跟随玩家
        this.miniMap.returnToPlayer(); // 点击掷骰子后使小地图恢复跟随玩家装态
        this.total = 0;
        for (let i = 0; i < this.count; i++) {
            this.dice3D[i].active = true; // 显示骰子
            let number = parseInt(Math.random() * 6 + 1); // 随机获取每个骰子点数
            this.total += number; // 统计点数
            this.dice_anim[i].playAdditive('roll_dice_' + number.toString()); // 播放掷骰子动画
        }
        this.node.active = false; // 失活自身节点
    },

    exchangeMode: function (mode) {
        if (this.mode != mode && ['single', 'multi'].indexOf(mode) != -1) {
            this.node = mode; // 修改骰子模式
        }
    },

    setDiceCount: function (event, count) {
        if (this.mode == 'single') return;
        else if (this.mode == 'multi') { // 修改红圈位置
            let dice_multi = this.node.getChildByName('Dice_multi');
            dice_multi.getChildByName('count_sign').y = dice_multi.getChildByName(count).y;
            this.count = parseInt(count); // 修改骰子个数
        }
    },

    onDestroy: function () {
        this.dice_anim[0].off("finished", this.onDiceStoped, this);
    },
});
