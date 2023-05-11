
namespace ffb {

    interface GameManager {

        /**
         * 是否要等所有资源加载完毕后再显示layer
         */
        showLayerWhenAllResLoaded:boolean;

        /**
         * 添加某个函数到cocos的update阶段执行
         * @param fun 要执行的函数，当前帧的所有update执行完了才会执行
         * @param frame 延迟执行的帧数。0为当前帧，1为下一帧，以此类推
         */
        addToAfterUpdate(fun:Function, frame:number = 0);

        /**
         * 预加载预制，节点在加载完后会被销毁，返回一个Promise对象
         * @param name 
         * @param bundle 
         */
        preLoadPrefab(name: string, bundle?: string):Promise<unknown>;
        
        /**
         * 加载rootLayer（主界面）。注意主界面只能通过此方法替换，无法通过popLayer删除
         * @param nameOrNode rootLayer的预制名或者节点对象
         * @param data rootLayer需要绑定的数据对象
         * @param bundle rootLayer所在的bundle，默认为resources
         */
        setRootLayer(nameOrNode: string | cc.Node, data: object, bundle?: string):Promise<cc.Node>;

        /**
         * 插入一个layer到layer栈（弹窗）中
         * @param name layer名
         * @param data layer要绑定的数据
         * @param bundle layer所在的bundle，默认为resources
         * @param index layer插入到哪一层弹窗，默认为顶部位置
         */
        insertLayer(name: string, data: Object, bundle?: string, index?: number):Promise<cc.Node>;

        /**
         * 从layer栈（弹窗）删除一个layer。注意：rootLayer无法通过此方法删除，只能通过setRootLayer替换
         * @param nameOrIndex 弹窗的名称或者所在位置的索引，默认为顶部layer
         */
        popLayer(nameOrIndex?: string | number);

        /**
         * 移除所有layer栈里面的内容（弹窗）
         */
        clearAllPopLayer();

        /**
         * 获取所有layer栈（弹窗）的名称
         */
        getLayerNames():string[];

        /**
         * 有数据绑定的节点都要通过此方法销毁。传父节点也行。
         * 调用popLayer后不需要再调用此方法。
         * @param node 要销毁的节点
         */
        destroyNode(node: cc.Node);
    }

    interface DataManager {
        dealData(node: cc.Node, data: Object, priority: number, async: boolean, dealerKey?: string);
        changePriority(node: cc.Node, priority: number);
        destroyDealers(node: cc.Node);
    }

    interface ResManager {
        loadAndInstantiatePrefab(prefabName: string, bundle:string, isPreLoad?: boolean): Promise<cc.Node>;
    }

    interface LangManager {
        containKey(key:string):boolean;
    }

    /**
     * 调度任务管理。任务将在每帧渲染结束后根据性能执行。
     */
    interface TaskDispatcher {

        static MAX_PRIORITY: number = 10;
        static MIN_PRIORITY: number = 0;

        init();

        /**
         * 添加到调度任务队列
         * @param priority 任务的优先级，取值范围为 MAX_PRIORITY 到 MIN_PRIORITY。值越大，越先被执行
         * @param tag 任务队列的tag
         * @param func 调度任务执行的函数
         * @param thisObj func中的this对象
         * @param argArray func的参数
         * @returns 返回一个Promise对象，处理func返回的数据
         */
        addTaskToPriorityQueens<T>(priority: number, tag: string, func: (...argArray: any[]) => T, thisObj?: any, ...argArray: any[]): Promise<T>

        /**
         * 根据priority、tag清空度任务队列
         * @param priority 调度任务执行的函数
         * @param tag func中的this对象
         * @param argArray func中的参数数组
         */
        clearTaskQueens<T>(tag: string);

        changeQueenPriority(tag: string, newPriority: number, index?: number);
    }

    let gameManager:GameManager;
    let dataManager:DataManager;
    let resManager:ResManager;
    let langManager:LangManager;
    let taskDispatcher:TaskDispatcher;
}
