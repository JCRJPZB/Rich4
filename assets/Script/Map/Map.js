cc.Class({
    extends: cc.Component,

    properties: {
        mapName: "",
        roadPrefab: cc.Prefab, // 道路预制体
    },

    onLoad: function () {
        // this.checkMap("testMap"); // 检查地图配置文件合法性
        this.loader = cc.find("/Canvas").getComponent("ResourcesMgr"); // 资源管理器
        this.pointMgr = cc.find("/SafeArea/Map").getComponent("PointMgr"); // 节点管理器
        // this.init("Japan"); // 初始化
    },

    init: function (mapName) {
        if (!mapName) { console.log("Error: MapName undefined!"); return; }
        this.mapName = mapName;
        this.loader.loadRes("/config/" + this.mapName, cc.JsonAsset, this.onMapLoaded.bind(this));
    },

    onMapLoaded: function (err, json) {
        if (err) { console.log(err); return; }

        let mapJson = json.json; // 地图

        this.pointMgr.setMapJson(mapJson); // 配置节点

        this.loader.loadRes(mapJson["background"], cc.SpriteFrame, this.onBackgroundLoaded.bind(this));
        this.mapName = mapJson["mapName"]; // 配置地图
        // 生成道路的功能最好还是让程序自己实现，目前姑且使用配置
        for (let i = 0; i < mapJson["roadCount"]; i++) { // 生成道路
            let roadJson = mapJson["road"][i.toString()];
            this.generateRoad(roadJson);
        }
        for (let i = 0; i < mapJson["buildingCount"]; i++) { // 生成建筑
            let buildingJson = mapJson["building"][i.toString()];
            let newBuildingNode = new cc.Node("Sprite");
            newBuildingNode.addComponent(cc.Sprite);
            newBuildingNode.parent = this.node;
            if (buildingJson["imgUrl"] === "null") { continue; }
            this.loader.loadResWithCount(buildingJson["imgUrl"], cc.SpriteFrame, (err, sf) => {
                if (err) { console.log(err); return; }
                newBuildingNode.getComponent(cc.Sprite).spriteFrame = sf;
                newBuildingNode.setPosition(cc.v2(buildingJson["position"][0], buildingJson["position"][1]));
            })
        }
    },

    onBackgroundLoaded: function (err, sf) {
        if (err) { console.log(err); return; }
        this.node.getChildByName("MapBackground").getComponent(cc.Sprite).spriteFrame = sf; // 加载底图
        this.maxX = sf.getRect().width; // 获取地图大小
        this.maxY = sf.getRect().height;
    },

    generateRoad: function (roadJson) { // 生成道路
        let newRoad = cc.instantiate(this.roadPrefab);
        newRoad.parent = this.node.getChildByName("PointNode");
        newRoad.width = roadJson[2];
        newRoad.setPosition(cc.v2(roadJson[0], roadJson[1]));
        newRoad.angle = roadJson[3];
    },
});