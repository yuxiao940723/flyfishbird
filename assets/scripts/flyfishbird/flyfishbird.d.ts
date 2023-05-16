
namespace ffb {

    interface GameManager {

        /**
         * 是否要等所有资源加载完毕后再显示layer
         */
        showLayerWhenAllResLoaded: boolean;

        /**
         * 添加某个函数到cocos的update阶段执行
         * @param fun 要执行的函数，当前帧的所有update执行完了才会执行
         * @param frame 延迟执行的帧数。0为当前帧，1为下一帧，以此类推
         */
        addToAfterUpdate(fun: Function, frame: number = 0);

        /**
         * 预加载bundle文件夹下的预制，节点在加载完后可能会被销毁，返回一个Promise对象
         * @param name 预制名
         * @param bundle 预制所在的bundle
         */
        preLoadPrefab(name: string, bundle?: string): Promise<unknown>;

        /**
         * 加载rootLayer（主界面）。注意主界面只能通过此方法替换，无法通过popLayer删除
         * @param nameOrNode rootLayer的预制名或者节点对象
         * @param data rootLayer需要绑定的数据对象
         * @param bundle rootLayer所在的bundle，默认为resources
         */
        setRootLayer(nameOrNode: string | cc.Node, data: object, bundle?: string): Promise<cc.Node>;

        /**
         * 插入一个layer到layer栈（弹窗）中
         * @param name layer名
         * @param data layer要绑定的数据
         * @param bundle layer所在的bundle，默认为resources
         * @param index layer插入到哪一层弹窗，默认为顶部位置
         */
        insertLayer(name: string, data: Object, bundle?: string, index?: number): Promise<cc.Node>;

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
        getLayerNames(): string[];

        /**
         * 有数据绑定的节点都要通过此方法销毁。传父节点也行。
         * 调用popLayer后不需要再调用此方法。
         * @param node 要销毁的节点
         */
        destroyNode(node: cc.Node);
    }

    interface DataManager {
        dealData(node: cc.Node, data: Object, priority: number, async: boolean, bundleName: string, dealerKey?: string);
        changePriority(node: cc.Node, priority: number);
        destroyDealers(node: cc.Node);
    }

    interface ResManager {

        /**
         * 根据名称加载并解析bundle
         * @param name bundle名
         */
        addBundleByName(name: string): Promise<boolean>;

        /**
         * 解析bundle
         * @param bundle bundle对象
         */
        addBundle(bundle: cc.AssetManager.Bundle);

        /**
         * 获取bundle对象
         * @param name bundle名
         */
        getBundle(name: string): cc.AssetManager.Bundle;

        /**
         * 加载bundle的资源，
         * @param fold bundle第一级目录文件，通常为类型。clips（动画文件）、res（资源文件）、audio（音频文件）、prefab（预制文件）
         * @param filename fold文件夹下的文件名
         * @param bundleName bundle名，默认为resources
         * @param type 文件类型
         * @param isPreLoad 是否预加载（注意：当预加载时，返回的就不是cc.Asset类型了）
         */
        loadResource<T extends cc.Asset>(fold: string, filename: string, bundleName: string, type?: { prototype: T }, isPreLoad?: boolean): Promise<T>;

        /**
         * 加载audio文件夹内音频文件,
         * @param audioName 音频文件名
         * @param bundleName bundle名，默认为resources
         */
        loadAudio(audioName: string, bundleName: string): Promise<cc.AudioClip>;

        /**
         * 加载prefab文件夹内的预制文件并实例化
         * @param prefabName 预制名
         * @param bundleName bundle名，默认为resources
         * @param isPreLoad 是否为预加载，默认为false
         */
        loadAndInstantiatePrefab(prefabName: string, bundleName: string, isPreLoad?: boolean): Promise<cc.Node>;

        /**
         * 加载prefab文件夹内的预制文件
         * @param prefabName 预制名
         * @param bundleName bundle名，默认为resources
         */
        loadPrefab(prefabName: string, bundleName: string): Promise<cc.Prefab>;

        /**
         * 加载res文件夹内的资源
         * @param filename 资源文件名
         * @param bundleName bundle名，默认为resources
         * @param type 资源类型。可选参数
         */
        loadRes<T extends cc.Asset>(filename: string, bundleName: string, type?: { prototype: T }): Promise<T>;

        /**
         * 获取 SpriteAtlas 下的 spriteFrame
         * @param atlas SpriteAtlas 文件名
         * @param filename spriteFrame 名
         * @param bundleName bundle名，默认为resources
         */
        loadSpriteFrameByAtlas(atlas: string, filename: string, bundleName: string): Promise<cc.SpriteFrame>;

        /**
         * 是否为网络资源
         * @param url  网络资源url
         */
        isNetResources(url: string): boolean;

        /**
         * 加载网络资源
         * @param url 网络资源url
         * @param options cc.assetManager.loadRemote 中的 options 参数
         */
        loadNetResource<T extends cc.Asset>(url: string, options?): Promise<T>;

        /**
         * 释放网络资源
         * @param url 网络资源url
         */
        releaseNetResource(url: string);

        /**
         * 根据文件名获取完整的路径
         * @param bundleName 所在的bundle
         * @param fold 所在的文件夹
         * @param filename 文件名
         */
        getFullPath(bundleName: string, fold: string, filename: string): string;

        /**
         * 根据完整的路径获取打包后的路径
         * @param bundleName 所在的bundle
         * @param fullPath 完整的路径
         * @param ext 扩展名
         */
        getPackFilePathByFullPath(bundleName: string, fullPath: string, ext: string): string;

        /**
         * 根据文件名获取打包后的路径
         * @param bundleName  所在的bundle
         * @param fold 所在的文件夹
         * @param filename 文件名
         * @param ext 扩展名
         */
        getPackFilePathByFileName(bundleName: string, fold: string, filename: string, ext: string): string;

        /**
         * 根据uuid获取文件路径
         * @param bundleName 所在的bundle
         * @param uuid uuid
         */
        getFileName(bundleName: string, uuid: string): string;
    }

    type LabelLike = cc.Component & { string: string };
    interface LanguageObject {
        [key: string]: string | number;
    }

    interface BundleLanguage {
        [key: string]: LanguageObject;
    }

    interface LangManager {
        /**
         * 所在的bundle的文本对象里面是否包含该key
         * @param key key
         * @param bundleName 所在的bundle
         */
        containKey(key: string, bundleName: string): boolean;

        /**
         * 设置文本对象
         * @param language 文本对象
         * @param bundleName 所在的bundle
         */
        setLanguage(language: LanguageObject, bundleName: string);

        /**
         * 获取文本对象
         * @param bundleName 所在的bundle
         */
        getLaugange(bundleName): LanguageObject;

        /**
         * 绑定文本对象
         * @param comp 绑定的组件
         * @param data 绑定的文本对象
         * @param bundleName 所在的bundle
         */
        bindLanguage(comp: ffb.LabelLike, data: ffb.LanguageObject, bundleName: string);

        /**
         * 解绑文本对象
         * @param comp 需要解绑的组件
         */
        unBindLanguage(comp: LabelLike);

        /**
         * 刷新文本对象。如果重设了语言，则需要调用此方法刷新文本对象。
         */
        updateLanguage();

        /**
         * 销毁所有文本对象的绑定
         */
        destroyAllBinding();
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

    let gameManager: GameManager;
    let dataManager: DataManager;
    let resManager: ResManager;
    let langManager: LangManager;
    let taskDispatcher: TaskDispatcher;
}
