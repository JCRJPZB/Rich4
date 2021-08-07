cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.uiMgr = cc.find("/Canvas/UI").getComponent("UIMgr"); // UI管理器

        this.scheduleOnce(() => { this.uiMgr.node.emit("ToolReady"); }, 1);
    },
});
