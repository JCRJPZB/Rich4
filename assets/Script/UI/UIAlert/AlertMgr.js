cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器

        this.noticeAlert = this.node.getChildByName("NoticeAlert").getComponent("NoticeAlert"); // 通知提示框
        this.eventAlert = this.node.getChildByName("EventAlert").getComponent("EventAlert"); // 事件提示框
        this.confirmAlert = this.node.getChildByName("ConfirmAlert").getComponent("ConfirmAlert"); // 购地提示框
        this.facilityAlert = this.node.getChildByName("FacilityAlert").getComponent("FacilityAlert"); // 选择要建造的设施类型
        this.alertDict = {
            "NoticeAlert": this.noticeAlert, "ConfirmAlert": this.confirmAlert,
            "FacilityAlert": this.facilityAlert, "EventAlert": this.eventAlert
        }; // 提示框字典
        this.activityDict = {
            "notice": "NoticeAlert", "confirm": "ConfirmAlert",
            "facility": "FacilityAlert", "event": "EventAlert"
        }; // 事件名字典

        this.loadNum = 0;
        this.loader.loadResWithCount("/config/settings", cc.JsonAsset, this.onJsonLoaded.bind(this)); // 加载提示框配置
    },

    onJsonLoaded: function (err, alertJson) {
        if (err) { console.log(err); return; }
        let json = alertJson.json["Alert"];
        for (let alert in json) {
            this.loadNum++;
            this.alertDict[alert].init(json[alert], this.resLoaded.bind(this));
        }
    },

    resLoaded: function () {
        this.loadNum--;
        if (this.loadNum === 0) { // 全部加载完成以后发射消息
            cc.find("/Canvas/UI").emit("AlertReady");
        }
    },

    show: function (alertName, callback, type, param, replacement) {
        if (!this.alertDict[this.activityDict[alertName]]) { console.log("Alert pane not find!"); return; }
        this.alertDict[this.activityDict[alertName]].show(callback, type, param, replacement);
    },
});
