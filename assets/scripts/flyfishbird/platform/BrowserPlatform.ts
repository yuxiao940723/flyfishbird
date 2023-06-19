import Platform from "./Platform";

export default class BrowserPlatform extends Platform {

    loadSubpackage(param:pf.LoadSubpackageParam) {
        setTimeout(() => {
            param.success && param.success();
        }, 100);
    }

}
