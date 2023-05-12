import MutilpleDefineProperties, { DefineProperties } from "../managers/MutilpleDefineProperties";

const { ccclass, disallowMultiple } = cc._decorator;
const mutilpleDefineProperties = new MutilpleDefineProperties();

interface DataDefines {
    data:Object;
    props:DefineProperties;
    compName:string;
}

interface DefineData {
    setter?:Function;
    data?:{object:Object, key:string};
}

function createDefineSetget(defineData:DefineData) {
    let setter = defineData.setter;
    let object = defineData.data.object;
    let key = defineData.data.key;
    if (object) {
        return {
            set:function(v) {
                object[key] = v;
            },
            get:function() {
                return object[key];
            }
        };
    } else {
        let value = null;
        return {
            set:function(v) {
                value = v;
                setter && setter(v);
            },
            get:function() {
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
    loadEndCallback:Function = null;

    loadingType = {};

    dataDefines:DataDefines[] = null;


    dealData(dataParent:Object, comDataParent:Object, nodeInLanguage:boolean, async:boolean, dealerKey:string, priority:number, taskTag:string, loadEndCallback:Function) {
        if (this.dataParent) {
            console.error('不能重复绑定节点的数据');
            loadEndCallback && loadEndCallback();
            return;
        }

        if (dealerKey) {
            this.dealerKey = dealerKey;
        }

        this.dispatchPriority = priority;
        this.loadEndCallback = loadEndCallback;

        this.dataParent = dataParent;
        this.comDataParent = comDataParent;

        this.addLoad('__AsyncLoad__');
        if (async) {
            ffb.taskDispatcher.addTaskToPriorityQueens(this.dispatchPriority, taskTag, this.dealData, this).then(() => {
                this.loadEnd('__AsyncLoad__');
            });
        } else {
            this._dealData();
            this.loadEnd('__AsyncLoad__');
        }
    }

    dealLanguage() {

    }

    removeAll() {

    }

    addLoad(compName: string) {
        if (!this.loadingType[compName]) {
            this.loadingType[compName] = 0;
        }
        this.loadingType[compName]++;
    }

    loadEnd(compName: string) {
        this.loadingType[compName]--;
        if (this.loadingType[compName] === 0) {
            delete this.loadingType[compName];
        }
        if (Object.keys(this.loadingType).length == 0 && this.loadEndCallback) {
            this.loadEndCallback();
            this.loadEndCallback = null;
        }
    }

    private containBindData(parent:Object) {
        if (!parent) {
            return false;
        }
        return this.node.name in parent;
    }

    private dealDefineNode(dataParent:Object, isRemove:boolean) {
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
        let dataDefines:DataDefines[] = [];
        if (dataType === 'object') {
            for (const key in data) {
                if (key === 'node') {
                    continue;
                }
                let classObj:any = cc.js.getClassByName(key);
                if (CC_DEBUG && cc.js.isChildClassOf(classObj, cc.Component)) {
                    console.error(key + '不是 cc.Component 类型');
                    continue;
                }
                let comp = this.addComponent(classObj);
                for (const name in data[key]) {
                    
                }
            }
        } else {
            let compDataDefines:DataDefines = {data:dataParent, props:{}, compName:''};
            let keys = this.node.name.split('_');
            if (keys.indexOf('Sprite') >= 0) {
                let comp = this.node.getComponent(cc.Sprite);
                compDataDefines.compName = 'cc.Sprite';
                compDataDefines[this.node.name] = createDefineSetget({
                    
                });
            } else if (keys.indexOf('Label') >= 0) {
                let comp = this.node.getComponent(cc.Label);
                compDataDefines.compName = 'cc.Label';
                compDataDefines[this.node.name] = createDefineSetget({data:{object:comp, key:'string'}});
            } else if (keys.indexOf('ProgressBar') >= 0) {
                let comp = this.node.getComponent(cc.ProgressBar);
                compDataDefines.compName = 'cc.ProgressBar';
                compDataDefines[this.node.name] = createDefineSetget({data:{object:comp, key:'progress'}});
            } else if (keys.indexOf('Button') >= 0) {   
                let comp = this.node.getComponent(cc.Button);
                compDataDefines.compName = 'cc.Button';
                compDataDefines[this.node.name] = createDefineSetget({data:{object:comp, key:'interactable'}});
            } else if (keys.indexOf('Skeleton') >= 0) {   
                let comp = this.node.getComponent(sp.Skeleton);
                compDataDefines.compName = 'sp.Skeleton';
                compDataDefines[this.node.name] = createDefineSetget({
                    
                });
            } else if (keys.indexOf('ToggleContainer') >= 0) {   
                let comp = this.node.getComponent(cc.ToggleContainer);
                compDataDefines.compName = 'cc.ToggleContainer';
                compDataDefines[this.node.name] = createDefineSetget({
                    
                });
            } else if (keys.indexOf('Toggle') >= 0) {   
                let comp = this.node.getComponent(cc.Toggle);
                compDataDefines.compName = 'cc.Toggle';
                compDataDefines[this.node.name] = createDefineSetget({data:{object:comp, key:'isChecked'}});
            } else if (keys.indexOf('Slider') >= 0) {   
                let comp = this.node.getComponent(cc.Slider);
                compDataDefines.compName = 'cc.Slider';
                compDataDefines[this.node.name] = createDefineSetget({data:{object:comp, key:'progress'}});
            } else if (keys.indexOf('RichText') >= 0) {
                let comp = this.node.getComponent(cc.RichText);
                compDataDefines.compName = 'cc.RichText';
                compDataDefines[this.node.name] = createDefineSetget({data:{object:comp, key:'string'}});
            } else {
                console.error('数据无法处理，节点名：', this.node.name);
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
