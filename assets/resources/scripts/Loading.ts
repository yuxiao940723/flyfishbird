import HomeData from "./pages/HomeData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Loading extends cc.Component {

    @property(cc.Label) progressLabel: cc.Label = null;

    progress = 0;

    loadEnd = false;

    start() {
        this.progressLabel.string = '0%';
        this.loadingEnd();
    }

    async loadingEnd() {
        await ffb.gameManager.setRootLayer('PageHome', HomeData);
        this.node.destroy();
    }


    // update (dt) {}
}
