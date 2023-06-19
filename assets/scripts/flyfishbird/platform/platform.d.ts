
namespace ffb {
    interface Platform {
        /**
         * Platform的方法为所有平台的合集，但是不实现任何方法。
         * 此函数返回此方法是否被子类实现。
         * @param name 方法名
         */
        isFunctionOverride(name: string): boolean;
        loadSubpackage(param: pf.LoadSubpackageParam);
        getLaunchOptionsSync(): Object;
        getSystemInfoSync(): { platform: string, model: string };
    }

    namespace PlatformTools {
        enum PlatformType {
            WX = 0,
            TT = 1,
            QQ = 2,
            Native = 3,
            Browser = 4,
            Others = 5,
        }
        enum OSSystem {
            iOS = 0,
            Android = 1,
            Windows = 2,
            Others = 3,
        }
    }

    class PlatformTools {
        static createPlatform(): Platform;
        static getCurrentPlatform(): PlatformTools.PlatformType;
        static getOSSystem(): PlatformTools.OSSystem;
    }

    class DataDealer extends cc.Component {
        valueChangeComponent: (compName: string, value: any) => any;
    }

    export let platform: Platform;

}

namespace pf {

    type NoneParmaFun = () => void;

    interface LoadSubpackageParam {
        name: string,
        success?: NoneParmaFun,
        fail?: NoneParmaFun,
    }
}