cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.loader = this.node.getComponent("ResourcesMgr"); // 资源管理器
        this.loader.loadResWithCount("/config/settings", cc.JsonAsset, (err, json) => {
            if (err) { console.log(err); return; }
            this.settings = json.json;
        })
    },
});
