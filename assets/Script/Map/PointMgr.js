cc.Class({
    extends: cc.Component,

    properties: {
        nodePrefab: cc.Prefab, // 节点预制体
        buildingPrefab: cc.Prefab, // 建筑预制体
        facilityPrefab: cc.Prefab, // 大型建筑预制体
        pointPrefab: cc.Prefab, // 点预制体
    },

    onLoad: function () {
        this.loadNum = 1; // 需要加载的数量(初始为1是因为还有init)
        this.prefabDict = {
            "node": this.nodePrefab, "building": this.buildingPrefab,
            "facility": this.facilityPrefab, "point": this.pointPrefab
        }; // 预制体字典
        this.alertMgr = cc.find("/Canvas/UI/AlertNode").getComponent("AlertMgr"); // 提示框管理器
        this.playerMgr = cc.find("/SafeArea/Players").getComponent("PlayerMgr"); // 玩家管理器
        this.playerRound = cc.find("/SafeArea/Players").getComponent("PlayerRound"); // 回合管理器
        this.playerRound.node.on("roundStart", (playerName) => { this.newRound(playerName) }, this); // 新回合处理
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.cardMgrNode = cc.find("/Canvas/UI/CardPane"); // 卡片管理器
        this.mainCamera = cc.find("/SafeArea/Players/Main Camera").getComponent(cc.Camera); // 主摄像头
        this.pointArray = new Array(); // 点位数组
        this.lineArray = new Array(); // 线段数组
        this.reverseLineArray = new Array(); // 反向线段数组
        this.pathArray = new Array(); // 路径数组
        this.reversePathArray = new Array(); // 反向路径数组
        this.pointCount = 0; // 节点数计数
        this.mapJson = null; // 初始化地图配置
        this.nodeImgs = null; // 初始化节点图片Atlas
        this.pointImgs = null; // 初始化点图片Atlas
        this.loadNum++; // 增加加载数量
        this.loader.loadResWithCount("/Texture/Map/Point/node", cc.SpriteAtlas, (err, atlas) => {
            if (err) { console.log(err); return; }
            this.nodeImgs = atlas; // 节点图片Atlas
            this.resLoaded(); // 加载完成
        });
        this.loadNum++; // 增加加载数量
        this.loader.loadResWithCount("/Texture/Map/Point/point", cc.SpriteAtlas, (err, atlas) => {
            if (err) { console.log(err); return; }
            this.pointImgs = atlas; // 节点图片Atlas
            this.resLoaded(); // 加载完成
        });
        this.loadNum++; // 增加加载数量
        this.loader.loadResWithCount("/Texture/Map/land", cc.SpriteAtlas, (err, atlas) => {
            if (err) { console.log(err); return; }
            this.landImgs = atlas; // 土地图片Atlas
            this.resLoaded(); // 加载完成
        });
        this.loadNum++; // 增加加载数量
        this.loader.loadResWithCount("/Texture/Map/facility", cc.SpriteAtlas, (err, atlas) => {
            if (err) { console.log(err); return; }
            this.facilityImgs = atlas; // 设施图片Atlas
            this.resLoaded(); // 加载完成
        });
        this.loadNum++; // 增加加载数量
        this.effectImgJson = null; // 效果图片配置
        this.loader.loadResWithCount("/config/settings", cc.JsonAsset, (err, json) => {
            if (err) { console.log(err); return; }
            this.effectImgJson = json.json["Effect"]; //
            this.resLoaded(); // 加载完成
        });

        this.cardMgrNode.on("rise", (duration, callback) => { this.useCard("rise", duration, callback); });
        this.cardMgrNode.on("close", (duration, callback) => { this.useCard("close", duration, callback); });
        this.cardMgrNode.on("monster", (duration, callback) => { this.useCard("monster", duration, callback); });

        this.node.on("Destroy", (playerName, pos, callback) => {
            let pointName = this.pointArray[pos].pointName;
            let owner = this.pointArray[pos].getOwner();
            if (pointName !== "building" && pointName !== 'facility' || owner === "N") { callback(); return; }
            this.alertMgr.show("event", () => {
                this.pointArray[pos].demolish();
                this.scheduleOnce(callback, 0.5); // 间隔一小段时间
            }, "Destroy", null, playerName);
        }); // 重置指定位置的土地

        this.node.on("Upgrade", (playerName, pos, callback) => {
            let pointName = this.pointArray[pos].pointName;
            let owner = this.pointArray[pos].getOwner();
            if (pointName !== "building" && pointName !== 'facility' || owner === "N") { callback(); return; }
            this.alertMgr.show("event", () => {
                this.changeLandLv(true, pos, playerName);
                this.scheduleOnce(callback, 0.5); // 间隔一小段时间
            }, "Upgrade", null, playerName);
        });

        this.selected = null;
    },

    resLoaded: function () {
        this.loadNum--;
        if (this.loadNum === 0) {
            cc.find("/Canvas").emit("MapReady"); // 全部加载完成后发出通知
        }
        if (this.loadNum === 1) { // 只剩下init的一次
            if (!this.mapJson) { console.log("Error: Map load failed"); return }
            this.init(this.mapJson); // 当地图图片加载完成后开始初始化地图
        }

    },

    setMapJson: function (mapJson) { // 获取地图配置
        this.mapJson = mapJson;
    },

    init: function (mapJson) {
        this.buildingPrice = mapJson["buildingPrice"]; // 地块价格
        this.facilityPrice = mapJson["facilityPrice"]; // 新建设施价格
        this.maxBuildLv = mapJson["maxBuildLv"]; // 建筑的最大等级
        this.maxStartPos = mapJson["maxStartPos"]; // 配置玩家起点
        this.tollFee = mapJson["tollFee"]; // 过路费
        this.buildingDict = {}; // 建筑字典
        for (let i = 0; i < mapJson["pointCount"]; i++) { // 生成点
            let pointJson = mapJson["point"][i.toString()];
            let point = this.generatePoint(pointJson, i).getComponent("Point");
            if (!point) { console.log("Error: Init point array failed!!!"); }
            this.pointArray[this.pointCount++] = point // 将点放入数组
        }
        for (let i = 0; i < mapJson["lineCount"]; i++) { // 获取路线段
            this.lineArray[i] = mapJson["line"][i.toString()]; // 正向
            this.reverseLineArray[i] = mapJson["reverseLine"][i.toString()]; // 逆向
            for (let j = 0; j < this.lineArray[i].length; j++) { // 将路线段序号赋值给该段内的点
                this.pointArray[this.lineArray[i][j]].setLineNum(i);
            }
        }
        for (let i = 0; i < mapJson["pathCount"]; i++) { // 获取路径
            this.pathArray[i] = mapJson["path"][i.toString()]; // 正向
            this.reversePathArray[i] = mapJson["reversePath"][i.toString()]; // 逆向
        }
        for (let i = 0; i < mapJson["buildingCount"]; i++) { // 获取建筑配置
            let building = mapJson["building"][i.toString()];
            this.buildingDict[building["bulidingName"]] = building;
        }
        this.playerMgr.node.on("playerLose", this.playerLose.bind(this), this); // 注册玩家淘汰监听
        this.resLoaded(); // 加载完成
    },

    playerLose: function (playerName) { // 玩家淘汰后摧毁该玩家所有建筑
        for (let i in this.pointArray) {
            if (this.pointArray[i].getOwner() === playerName) {
                this.pointArray[i].demolish();
            }
        }
    },

    newRound: function (playerName) { // 新玩家回合更新土地状态
        for (let i in this.pointArray) {
            if (this.pointArray[i].getOwner() === playerName) {
                this.pointArray[i].newRound();
            }
        }
    },

    findNextPoint: function (now, direction) { // 寻找下一个点
        let lineNum = this.pointArray[now].getLineNum();
        if (direction < 0) { var line = this.reverseLineArray; var path = this.reversePathArray; } // 根据前进方向选择对应路径
        else { var line = this.lineArray; var path = this.pathArray; }
        if (line[lineNum].indexOf(now) < line[lineNum].length - 1) { // 若该段路没走完则继续走
            return [this.pointArray[line[lineNum][line[lineNum].indexOf(now) + 1]].node];
        }
        let next = []; // 走完则换下一段路，将这段路的所有后继路段的首个点放进后继数组并返回
        for (let i = 0; i < path[lineNum].length; i++) { // 获取路径
            next[i] = this.pointArray[line[path[lineNum][i]][0]].node;
        }
        return next;
    },

    generatePoint: function (pointJson, num) { // 生成点
        let prefab = this.prefabDict[pointJson["pointName"]];
        let newPoint = cc.instantiate(prefab); // 预制体
        newPoint.parent = this.node.getChildByName("PointNode");
        newPoint.getComponent("Point").pointMgr = this;
        newPoint.getComponent("Point").init(pointJson, num);
        return newPoint;
    },

    getIsPointMaxLv: function (pos) { return this.pointArray[pos].isMaxLv(); },

    getPointLv: function (pos) { return this.pointArray[pos].getLv(); },

    getOwner: function (pos) { return this.pointArray[pos].getOwner(); },

    // 改变设施或地块(建筑)的归属
    changePointOwner: function (point, playerName) {
        if (point.getOwner() !== "N") { // 原本土地有主则减少原主人的土地数量
            this.playerRound.node.emit("attrRemove", point.getOwner(), "Land"); // 原主人土地数量减少
        }
        point.setOwner(playerName);
        if (point.getOwner() !== "N") {
            this.playerRound.node.emit("attrAdd", point.getOwner(), "Land"); // 现主人土地数量增加
        }
    },

    buyLand: function (playerName, pos) { // 购买土地
        let point = this.pointArray[pos];
        if (point.pointName !== "building" && point.pointName !== "facility") { // 不是可购买的土地类型
            console.log("Error: Land type error!");
            return;
        }
        if (point.getOwner() !== "N") { console.log("Error: Land owner error!"); return; } // 已经有主，购买土地出错
        this.changePointOwner(point, playerName);
        if (point.getPointName() != "facility") {
            let sf = this.landImgs.getSpriteFrame(playerName + "V" + point.lv.toString());
            if (!sf) { console.log("升级土地时图片素材缺失！"); return; }
            point.signImg.spriteFrame = sf;
        } else {
            point.changeSignImg("/Texture/Player/" + playerName + "-Sign");
        }
    },

    changeLandLv: function (isUpgrade, pos, playerName) { // 加盖
        let point = this.pointArray[pos];
        if (isUpgrade && !point.isMaxLv()) { point.lv++; }
        else if (!isUpgrade && point.lv > 1) { point.lv--; }
        else { console.log("土地等级出错！"); return; }
        let sf = this.landImgs.getSpriteFrame(playerName + "V" + point.lv.toString());
        if (!sf) { console.log("升级土地时图片素材缺失！"); return; }
        point.signImg.spriteFrame = sf;
    },

    buildFacility: function (pos, facilityName) { // 新建设施
        let point = this.pointArray[pos];
        let sf = this.facilityImgs.getSpriteFrame(facilityName + "V1");
        if (!sf) { console.log("新建设施时图片素材缺失！"); return; }
        point.signImg.spriteFrame = sf;
        this.point.facilityName = facilityName; // 添加到设施字典中，拆除时需要删除
    },

    changeFacilityLv: function (pos, isUpgrade) { // 升级设施
        let point = this.pointArray[pos];
        if (isUpgrade && !point.isMaxLv()) { point.lv++; }
        else if (!isUpgrade && point.lv > 1) { point.lv--; }
        else { console.log("设施等级出错!"); return; }
        let sf = this.facilityImgs.getSpriteFrame(this.point.facilityName + "V" + point.lv.toString());
        if (!sf) { console.log("升级设施时图片素材缺失！"); return; }
        point.signImg.spriteFrame = sf;
    },

    useCard: function (statusName, duration, callback) { // 使用卡片
        this.alertMgr.show("notice", () => { this.enableSelect(statusName, duration, callback); }, "choosePos");
    },

    clearSelect: function () {
        this.selected.unSelected(); // 取消高亮
        this.selected = null; // 置空
    },

    enableSelect: function (statusName, duration, callback) { // 激活土地选择
        this.node.getChildByName("MapBackground").on("mousemove", this.selectPoint, this);
        this.node.getChildByName("MapBackground").on("mousedown", () => {

            this.node.getChildByName("MapBackground").off("mousemove"); // 注销事件
            this.node.getChildByName("MapBackground").off("mousedown");
            if (this.selected === null) {
                this.alertMgr.show("notice", () => { // 没有选中任何点
                }, "selectNull"); return;
            }
            if (this.selected.getOwner() === "N") {
                this.alertMgr.show("notice", () => { // 没有建筑
                    this.clearSelect(); // 清除选中
                }, "noBuilding"); return;
            }

            let res = this.selected.addStatus(statusName, duration, this.effectImgJson[statusName]); // 卡片生效
            if (res) { this.alertMgr.show("notice", () => { }, res); } // 通知
            if (callback) { callback(); } // 确认使用了卡片，调用回调来移除
            this.clearSelect(); // 清除选中
        }, this);

    },

    selectPoint: function (event) {
        let coordinate = this.mainCamera.getScreenToWorldPoint(event.getLocation(), cc.v2(0, 0)); // 获取鼠标的世界坐标
        for (let point in this.pointArray) {
            point = this.pointArray[point];
            let pointName = point.pointName;
            if (pointName !== "building" && pointName !== "facility") { continue; }
            if (Math.abs(coordinate.x - point.node.x) < 35 && Math.abs(coordinate.y - point.node.y) < 35) {
                if (this.selected === point) { continue; }
                if (this.selected !== null) { this.selected.unSelected(); }
                this.selected = point;
                this.selected.selected();
                break;
            }
        }
    },

    getBuildingJson: function (buildingName) { // 获取建筑配置
        return this.buildingDict[buildingName];
    },

    isClose: function (pos) { // 返回土地是否查封
        return this.pointArray[pos].statusDict["close"] > 0;
    },

    getLandName: function (pos) { // 获取当前土地的类型
        return this.pointArray[pos].getPointName();
    },

    getEventName: function (pos) { // 获取当前土地的事件名
        return this.pointArray[pos].eventName;
    },

    getLandPrice: function (pos) { // 获取当前土地的价格
        return this.pointArray[pos].getPrice();
    },

    getChargePrice: function (pos) {
        let point = this.pointArray[pos];
        return point.getPrice() * point.getLv();
    },
});
