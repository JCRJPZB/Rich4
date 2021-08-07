const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    onLoad() {
        this.testAsync();
    }

    async testAsync() {
        try {
            const result = await this.testPromise();
            console.log(result)
        } catch {
            console.log("Async failed!")
        }
    }

    async testPromise() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve("Async success!");
            }, 1000);
        });
    }
}
