
export default class Platform {

    isFunctionOverride(name: string) {
        let __proto__ = this['__proto__'];
        let constructor = __proto__.constructor;
        while (constructor !== Platform) {
            if (Object.prototype.hasOwnProperty.call(__proto__, name)) {
                return true;
            }
            __proto__ = __proto__.__proto__;
            constructor = __proto__.constructor;
        }
        return false;
    }

    loadSubpackage(param:pf.LoadSubpackageParam) {
        
    }

    getLaunchOptionsSync() {

    }

    getSystemInfoSync() {

    }
}

