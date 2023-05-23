import MutilpleDefineProperties, { DefineProperties } from "../managers/MutilpleDefineProperties";

const { ccclass, disallowMultiple } = cc._decorator;
const mutilpleDefineProperties = new MutilpleDefineProperties();

interface DataDefines {
    data: Object;
    props: DefineProperties;
    compName: string;
}

interface DefineData {
    set?: Function;
    data?: { object: Object, key: string };
}

function createDefineSetget(defineData: DefineData) {
    let setter = defineData.set;
    let object = defineData.data.object;
    let key = defineData.data.key;
    if (object) {
        return {
            set: function (v) {
                object[key] = v;
            },
            get: function () {
                return object[key];
            }
        };
    } else {
        let value = null;
        return {
            set: function (v) {
                value = v;
                setter && setter(v);
            },
            get: function () {
                return value;
            }
        };
    }
}

@ccclass
@disallowMultiple
export default class DataDealer extends cc.Component {

    dataParent = null;
    comDataParent = null;

    dealerKey = "";
    dispatchPriority = 0;
    loadEndCallback: Function = null;

    loadingType = {};

    dataDefines: DataDefines[] = null;

    bundleName = undefined;

    dealData(dataParent: Object, comDataParent: Object, nodeInLanguage: boolean, async: boolean, dealerKey: string, priority: number, taskTag: string, loadEndCallback: Function, bundle: string) {
        if (this.dataParent) {
            console.error('不能重复绑定节点的数据');
            loadEndCallback && loadEndCallback();
            return;
        }

        if (dealerKey) {
            this.dealerKey = dealerKey;
        }

        if (bundle) {
            this.bundleName = bundle;
        }

        this.dispatchPriority = priority;
        this.loadEndCallback = loadEndCallback;

        this.dataParent = dataParent;
        this.comDataParent = comDataParent;

        if (async) {
            ffb.taskDispatcher.addTaskToPriorityQueens(this.dispatchPriority, taskTag, this.dealData, this);
        } else {
            this._dealData();
        }
    }

    bindLanguage() {
        let comp = this.node.getComponent(cc.Label) || this.node.getComponent(cc.RichText);
        ffb.langManager.bindLanguage(comp, ffb.langManager.getLaugange(this.bundleName), this.bundleName);
    }

    unBindLanguage() {
        let comp = this.node.getComponent(cc.Label) || this.node.getComponent(cc.RichText);
        ffb.langManager.unBindLanguage(comp);
    }

    removeAll() {
        this.unBindLanguage();
        for (let i = 0; i < this.dataDefines.length; ++i) {
            let dataDefine = this.dataDefines[i];
            mutilpleDefineProperties.removeValueProps(dataDefine.data, Object.keys(dataDefine.props), this.node.name, dataDefine.compName, this.node.uuid);
        }
    }

    private containBindData(parent: Object) {
        if (!parent) {
            return false;
        }
        return this.node.name in parent;
    }

    private dealDefineNode(dataParent: Object, isRemove: boolean) {
        let contain = this.containBindData(dataParent);
        if (!contain) {
            return;
        }
        let bindData = dataParent[this.node.name];
        if (typeof bindData === 'object' && 'node' in bindData) {
            if (isRemove) {
                if (bindData.node instanceof cc.Node) {
                    Object.defineProperty(bindData, 'node', { writable: true, value: null });
                } else {
                    for (const key in bindData['node']) {
                        Object.defineProperty(bindData['node'], key, { writable: true, value: null });
                    }
                }
            } else {
                if (bindData['node'] == null) {
                    Object.defineProperty(bindData, 'node', {
                        get: () => {
                            return this.node;
                        },
                        set: () => {
                            console.error('node is readonly');
                        }
                    });
                } else {
                    for (const key in bindData['node']) {
                        let comp = this.getComponent(key);
                        Object.defineProperty(bindData['node'], key, {
                            get: () => {
                                //可能是后面才加进去的组件
                                if (!comp) {
                                    comp = this.getComponent(key);
                                }
                                return comp;
                            },
                            set: () => {
                                console.error('node[' + key + '] is readonly');
                            }
                        });
                    }
                }
            }
        }
    }

    private _dealData() {

        this.dealDefineNode(this.dataParent, false);

        let contain = this.containBindData(this.dataParent);
        if (contain) {
            this._dealDataWithDataParent(this.dataParent);
        }

        contain = this.containBindData(this.comDataParent);
        if (contain) {
            this._dealDataWithDataParent(this.comDataParent);
        }
    }

    private _dealDataWithDataParent(dataParent) {
        let data = dataParent[this.node.name];
        let dataType = typeof data;
        let dataDefines: DataDefines[] = [];
        if (dataType === 'object') {
            for (const key in data) {
                if (key === 'node') {
                    continue;
                }
                let classObj: any = cc.js.getClassByName(key);
                if (CC_DEBUG && cc.js.isChildClassOf(classObj, cc.Component)) {
                    console.error(key + '不是 cc.Component 类型');
                    continue;
                }
                if (!classObj) {
                    continue;
                }
                let comp = this.addComponent(classObj);
                let compData = data[key];
                let props: DefineProperties = {};
                for (const name in compData) {
                    if (name in comp) {
                        props[name] = createDefineSetget({ data: { object: compData, key: name } });
                    }
                }
                if (Object.keys(props).length > 0) {
                    dataDefines.push({ data: compData, props: props, compName: key });
                }
            }
        } else {
            let compDataDefines: DataDefines = { data: dataParent, props: {}, compName: '' };
            let keys = this.node.name.split('_');
            if (keys.indexOf('sprite') >= 0) {
                let comp = this.node.getComponent(cc.Sprite);
                compDataDefines.compName = 'cc.Sprite';
                compDataDefines[this.node.name] = createDefineSetget({
                    set: async (v) => {
                        let spriteFrame = await ffb.resManager.loadRes<cc.SpriteFrame>(v, this.bundleName);
                        if (!cc.isValid(comp)) {
                            return;
                        }
                        comp.spriteFrame = spriteFrame;
                    }
                });
            } else if (keys.indexOf('label') >= 0) {
                let comp = this.node.getComponent(cc.Label);
                ffb.langManager.bindLanguage(comp, dataParent, this.bundleName);
            } else if (keys.indexOf('progressBar') >= 0) {
                let comp = this.node.getComponent(cc.ProgressBar);
                compDataDefines.compName = 'cc.ProgressBar';
                compDataDefines[this.node.name] = createDefineSetget({ data: { object: comp, key: 'progress' } });
            } else if (keys.indexOf('button') >= 0) {
                let comp = this.node.getComponent(cc.Button);
                compDataDefines.compName = 'cc.Button';
                compDataDefines[this.node.name] = createDefineSetget({ data: { object: comp, key: 'interactable' } });
            } else if (keys.indexOf('skeleton') >= 0) {
                let comp = this.node.getComponent(sp.Skeleton);
                compDataDefines.compName = 'sp.Skeleton';
                compDataDefines[this.node.name] = createDefineSetget({
                    set: async (v) => {
                        let skeletonData = await ffb.resManager.loadRes<sp.SkeletonData>(v, this.bundleName);
                        if (!cc.isValid(comp)) {
                            return;
                        }
                        comp.skeletonData = skeletonData;
                    }
                });
            } else if (keys.indexOf('toggle') >= 0) {
                let comp = this.node.getComponent(cc.Toggle);
                compDataDefines.compName = 'cc.Toggle';
                compDataDefines[this.node.name] = createDefineSetget({ data: { object: comp, key: 'isChecked' } });
            } else if (keys.indexOf('slider') >= 0) {
                let comp = this.node.getComponent(cc.Slider);
                compDataDefines.compName = 'cc.Slider';
                compDataDefines[this.node.name] = createDefineSetget({ data: { object: comp, key: 'progress' } });
            } else if (keys.indexOf('richText') >= 0) {
                let comp = this.node.getComponent(cc.RichText);
                compDataDefines.compName = 'cc.RichText';
                compDataDefines[this.node.name] = createDefineSetget({ data: { object: comp, key: 'string' } });
            } else {
                console.error(this.node.name + '节点绑定的数据无法处理');
            }
            if (compDataDefines.compName !== '') {
                dataDefines.push(compDataDefines);
            }
        }
        for (let i = 0; i < dataDefines.length; ++i) {
            let prop = dataDefines[i];
            mutilpleDefineProperties.addValueProps(prop.data, prop.props, this.node.name, prop.compName, this.node.uuid);
        }
        this.dataDefines = dataDefines;
    }

}
