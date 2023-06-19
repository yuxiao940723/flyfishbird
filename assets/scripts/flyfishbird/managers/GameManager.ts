
interface UpdateFun {
    fun: Function,
    frame: number,
}

interface LayerLoading {
    [key: string]: {
        endCallbacks: Function[],
        isPreload: boolean,
        node: cc.Node
    }
}

const ROOT_LAYER_ZINDE = 100;
const DEFAULT_PRIORITY = 5;

class GameManager {

    staticBackground = true;

    private updateFuns: UpdateFun[] = [];
    private layers: cc.Node[] = [];

    private layerLoading: LayerLoading = {};

    init() {
        this.initUpdate();
        this.listenSceneChange();
    }

    private listenSceneChange() {
        cc.director.on(cc.Director.EVENT_BEFORE_SCENE_LOADING, () => {

        });
    }

    private initUpdate() {
        cc.director.on(cc.Director.EVENT_AFTER_UPDATE, this.afterUpdate, this);
    }

    private afterUpdate() {
        for (let i = 0; i < this.updateFuns.length;) {
            let fun = this.updateFuns[i];
            if (fun.frame <= 0) {
                fun.fun();
                this.updateFuns.splice(i, 1);
            } else {
                fun.frame--;
                i++;
            }
        }
    }

    private waitingPrefabLoadEnd(name: string, bundle: string, isPreload: boolean, data: Object): Promise<cc.Node> {
        return new Promise(async (resolve) => {
            let loading = this.layerLoading[name];
            if (!loading) {
                loading = this.layerLoading[name] = { endCallbacks: [], isPreload: isPreload, node: null };
                loading.endCallbacks.push(resolve);
            } else {
                loading.endCallbacks.push(resolve);
                if (!isPreload && loading.isPreload) {
                    loading.isPreload = isPreload;
                    if (loading.node) {
                        let priority = isPreload ? DEFAULT_PRIORITY - 1 : DEFAULT_PRIORITY;
                        ffb.dataManager.changePriority(loading.node, priority);
                        let extBases = loading.node.getComponentsInChildren('ExtBase');
                        for (let i = 0; i < extBases.length; ++i) {
                            extBases[i].dispatchPriority = priority;
                        }
                    } else {
                        ffb.resManager.loadAndInstantiatePrefab(name, bundle);
                    }
                }
                return;
            }
            let node = await ffb.resManager.loadAndInstantiatePrefab(name, bundle, loading.isPreload);
            if (node) {
                loading.node = node;
                node.parent = cc.find('Canvas');
                node.active = false;

                await this.makeSureRefResourcesLoaded(node);

                if (loading.isPreload) {
                    await ffb.dataManager.dealData(node, data, DEFAULT_PRIORITY - 1, true, bundle);
                    this.destroyNode(node);
                    node = null;
                } else {
                    await ffb.dataManager.dealData(node, data, DEFAULT_PRIORITY, false, bundle);
                    node.active = true;
                }

                let callbacks = this.layerLoading[name].endCallbacks;
                if (callbacks) {
                    for (let i = 0; i < callbacks.length; ++i) {
                        let callback = callbacks[i];
                        callback && callback(node);
                    }
                }
                delete this.layerLoading[name];
            }
        });
    }

    private makeSureRefResourcesLoaded(node: cc.Node) {
        return new Promise((resolve) => {
            let active = node.active;   //保存之前的状态
            node.active = true;         //设置为true，让组件初始化
            let pageviews = node.getComponentsInChildren(cc.PageView);
            for (let i = 0; i < pageviews.length; ++i) {
                let pageview = pageviews[i]
                let ext = pageview.node.getComponent('PageViewExt');
                if (ext && ext.pageIndex) {
                    pageview.scrollToPage(ext.pageIndex, 0);
                    pageview.setCurrentPageIndex(ext.pageIndex);
                    pageview['update'](1);
                }
            }
            let counter = new ffb.Tools.Counter(()=>{
                resolve(null);
            });
            let sprites = node.getComponentsInChildren(cc.Sprite);
            for (let i = 0; i < sprites.length; ++i) {
                let sp = sprites[i];
                if (sp.spriteFrame) {
                    counter.addCount();
                    sp.spriteFrame['onTextureLoaded'](function () {
                        counter.complelteOnce();
                    });
                }
            }
            let labels = node.getComponentsInChildren(cc.Label);
            for (let i = 0; i < labels.length; ++i) {
                let label = labels[i];
                if (label.font instanceof cc.BitmapFont) {
                    counter.addCount();
                    label.font['spriteFrame'].onTextureLoaded(function () {
                        counter.complelteOnce();
                    });
                }
            }
            node.active = false;        //设置为false，让组件暂停运行
            node.active = active;       //恢复之前的状态
            counter.complelteOnce();
        });
    }

    private async initLayer(layer: cc.Node) {
        
    }

    addToAfterUpdate(fun: Function, frame: number = 0) {
        this.updateFuns.push({ fun: fun, frame: frame });
    }

    async preLoadPrefab(name: string, bundle: string = 'resources') {
        return this.waitingPrefabLoadEnd(name, bundle, true, {});
    }

    async setRootLayer(nameOrNode: string | cc.Node, data: object, bundle: string = 'resources') {
        let layer: cc.Node;
        if (typeof nameOrNode === 'string') {
            layer = await this.waitingPrefabLoadEnd(nameOrNode, bundle, false, data);
        } else {
            layer = nameOrNode;
        }
        layer.zIndex = ROOT_LAYER_ZINDE;

        this.initLayer(layer);

        let oldRootLayer = this.layers[0];
        if (oldRootLayer) {
            this.destroyNode(oldRootLayer);
            this.layers[0] = layer;
        } else {
            this.layers.push(layer);
        }
        return layer;
    }

    async insertLayer(name: string, data: Object, bundle: string = 'resources', index?: number) {
        if (index === undefined) {
            index = this.layers.length;
        } else {
            index = Math.max(Math.min(index, this.layers.length), 1);
        }
        let layer = await this.waitingPrefabLoadEnd(name, bundle, false, data);
        this.initLayer(layer);
        this.layers.splice(index, 0, layer);
        for (let i = 0; i < this.layers.length; ++i) {
            this.layers[i].zIndex = ROOT_LAYER_ZINDE + i;
        }
        return layer;
    }

    popLayer(nameOrIndex?: string | number) {
        if (this.layers.length <= 1) {
            console.error('popLayer 调用失败：rootlayer无法被移除');
            return;
        }
        let layer: cc.Node;
        if (typeof nameOrIndex === 'string') {
            for (let i = this.layers.length - 1; i >= 1; --i) {
                if (this.layers[i].name === nameOrIndex) {
                    layer = this.layers.splice(i, 1)[0];
                    break;
                }
            }
        } else if (typeof nameOrIndex === 'number') {
            let index = Math.max(Math.min(nameOrIndex, this.layers.length), 1);
            layer = this.layers.splice(index, 1)[0];
        } else {
            layer = this.layers.pop();
        }

        if (!layer) {
            console.error('popLayer 调用失败，未找到要移除的layer：' + nameOrIndex);
            return;
        }

        this.destroyNode(layer);
        for (let i = 0; i < this.layers.length; ++i) {
            this.layers[i].zIndex = ROOT_LAYER_ZINDE + i;
        }
    }

    clearAllPopLayer() {
        let len = this.layers.length;
        for (let i = 1; i < len; ++i) {
            this.destroyNode(this.layers[i]);
        }
        this.layers = [this.layers[0]];
    }

    getLayerNames(): string[] {
        let names: string[] = [];
        for (let i = 0; i < this.layers.length; ++i) {
            names.push(this.layers[i].name);
        }
        return names;
    }

    destroyNode(node: cc.Node) {
        ffb.dataManager.destroyDealers(node);
        node.destroy();
    }
}

export default GameManager