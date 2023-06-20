import DataDealer from "../components/DataDealer";

class DataManager {

    nodeTaskTags = {};

    registers: { [key: string]: { [key: string]: { set: ffb.AttrSetFun } } } = {};

    registeAttributes(compName: string, attrName: string, set: ffb.AttrSetFun) {
        let attributes = this.registers[compName]
        if (!attributes) {
            attributes = this.registers[compName] = {};
        }
        attributes[attrName] = { set: set };
    }

    getAttribute(compName: string, attrName: string,) {
        return this.registers[compName][attrName];
    }

    dealData(node: cc.Node, data: Object, priority: number, async: boolean, bundleName: string, dealerKey?: string) {
        if (!cc.isValid(node) || typeof data !== 'object') {
            return Promise.resolve();
        }
        let taskTag = 'DATA_MGR_PRIORITY_TAG_' + node.uuid;
        this.nodeTaskTags[node.uuid] = taskTag;
        return new Promise(async (resolve, reject) => {
            let counter = new ffb.Tools.Counter(() => {
                delete this.nodeTaskTags[node.uuid];
                resolve(null);
            });
            this._dealDataToAllChildren(node, priority, data, async, taskTag, counter, dealerKey, bundleName);
            counter.complelteOnce();
        });
    }

    private _dealDataToAllChildren(node: cc.Node, priority: number, data, async: boolean, taskTag: string, counter: ffb.Tools.Counter, dealerKey: string, bundleName: string) {
        let nodeInData = false;
        let dataParent = null;
        for (const key in data) {
            dataParent = data[key];
            if (node.name in dataParent) {
                nodeInData = true;
                break;
            }
        }
        let nodeInLanguage = ffb.langManager.containKey(node.name, bundleName);
        if (nodeInData || nodeInLanguage) {
            if (CC_DEBUG && node.getComponent(DataDealer)) {
                console.error('DataDealer 组件已存在');
            } else {
                let comp = node.addComponent(DataDealer);
                counter.addCount();
                comp.dealData(data, nodeInLanguage, async, dealerKey, priority, taskTag, bundleName).then(() => {
                    counter.complelteOnce();
                });
            }
        }
        let children = node.children;
        for (let i = 0, l = children.length; i < l; i++) {
            let c = children[i];
            this._dealDataToAllChildren(c, priority, data, async, taskTag, counter, dealerKey, bundleName);
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

