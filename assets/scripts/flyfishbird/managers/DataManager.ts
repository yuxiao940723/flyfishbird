import DataDealer from "../components/DataDealer";

class DataManager {

    commonData = {};
    nodeTaskTags = {};

    dealData(node: cc.Node, data: Object, priority: number, async: boolean, bundleName: string, dealerKey?: string) {
        if (!cc.isValid(node) || typeof data !== 'object') {
            return Promise.resolve();
        }
        let taskTag = 'DATA_MGR_PRIORITY_TAG_' + node.uuid;
        this.nodeTaskTags[node.uuid] = taskTag;
        return new Promise(async (resolve, reject) => {
            let progress = {
                count: 0,
                complelteOnce: function () {
                    this.count--;
                    // console.log(node.name, 'total', this.count);
                    if (this.count <= 0) {
                        delete this.nodeTaskTags[node.uuid];
                        resolve(null);
                    }
                }
            }
            progress.count++;
            this._dealDataToAllChildren(node, priority, data, async, taskTag, progress, dealerKey, bundleName);
            progress.complelteOnce();
        });
    }

    private _dealDataToAllChildren(node: cc.Node, priority: number, data, async: boolean, taskTag: string, asyncLoadProgress, dealerKey: string, bundleName: string) {
        let nodeInData = node.name in data;
        let nodeInCommonData = node.name in this.commonData;
        let nodeInLanguage = ffb.langManager.containKey(node.name, bundleName);
        if (nodeInData || nodeInCommonData || nodeInLanguage) {
            let comp = node.getComponent(DataDealer);
            if (!comp) {
                comp = node.addComponent(DataDealer);
            }
            asyncLoadProgress.count++;
            comp.dealData(data, this.commonData, nodeInLanguage, async, dealerKey, priority, taskTag, function () {
                if (asyncLoadProgress) {
                    asyncLoadProgress.complelteOnce();
                }
            }, bundleName);
        }
        let children = node.children;
        for (let i = 0, l = children.length; i < l; i++) {
            let c = children[i];
            this._dealDataToAllChildren(c, priority, data, async, taskTag, asyncLoadProgress, dealerKey, bundleName);
        }
    }

    changePriority(node: cc.Node, priority: number) {
        let tag: string = this.nodeTaskTags[node.uuid];
        if (tag) {
            ffb.taskDispatcher.changeQueenPriority(tag, priority);
        }
    }

    destroyDealers(node: cc.Node) {
        let tag: string = this.nodeTaskTags[node.uuid];
        if (tag) {
            ffb.taskDispatcher.clearTaskQueens(tag);
        }
        let dataDealers = node.getComponentsInChildren(DataDealer);
        for (let i = 0; i < dataDealers.length; ++i) {
            dataDealers[i].removeAll();
            dataDealers[i].destroy();
        }
        delete this.nodeTaskTags[node.uuid];
    }
}

export default DataManager;

