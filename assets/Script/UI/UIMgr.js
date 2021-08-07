cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.loadDict = { "Stock": false, "Tool": false, "Alert": false};
        this.loadNum = Object.keys(this.loadDict).length;
        this.node.on("StockReady", () => { this.resLoaded("Stock"); }, this); // 股票模块加载完成
        this.node.on("ToolReady", () => { this.resLoaded("Tool"); }, this); // 工具模块加载完成
        this.node.on("AlertReady", () => { this.resLoaded("Alert"); }, this); // 提示框模块加载完成
        // this.on("PaneReady", () => { this.resLoaded("Pane"); }, this); // 面板界面模块加载完成
    },

    resLoaded: function (modelName) { // 加载完成回调函数
        this.loadDict[modelName] = true;
        this.loadNum--;
        if (this.loadNum === 0) { // 当所有待加载模块均加载完毕则发出通知
            cc.find("/Canvas").emit("UIReady");
        }
    },
});
