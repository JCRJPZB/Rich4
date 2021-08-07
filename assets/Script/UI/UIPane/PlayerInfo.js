cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.portrait = this.node.getChildByName("PlayerPortrait").getComponent(cc.Sprite);
        this.playerName = this.node.getChildByName("PlayerName").getComponent(cc.Label);
        this.color = this.node.getChildByName("PlayerColor");

        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.playerAttrDire = cc.find("/SafeArea/Players").getComponent("PlayerAttrDirector");
    },

    updateInfo: function (playerName) {
        this.loader.loadRes(this.playerAttrDire.getPlayerPortraitUrl(playerName), cc.SpriteFrame, (err, sf) => {
            if (err) { console.log(err); return; }
            this.portrait.spriteFrame = sf;
        });
        this.playerName.string = playerName;
        let color = this.playerAttrDire.getPlayerColor(playerName);
        this.color.color = cc.color(color.r, color.g, color.b, color.a);
    },
});
