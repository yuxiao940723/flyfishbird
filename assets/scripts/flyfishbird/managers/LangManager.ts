
const KeyRegex = /\${([^}]*)}/g;

function isValidValue(v) {
    let type = typeof v;
    return type === 'number' || type === 'string'
}

class LanguageSetter {

    value: string | number = null;
    bundleName: string = 'resources';
    splitArray = [];
    lastBindKeys: { [key: string]: string | number | LanguageSetter } = {};

    components: { [key: string]: ffb.LabelLike } = {};

    languageObject: ffb.LanguageObject = {};

    valueChanged(v: string) {
        for (const key in this.components) {
            this.components[key].string = v;
        }
    }

    set(v: string | number) {
        this.value = v;
        this.dealString();
        this.valueChanged(this.toString());
    }

    get() {
        return this.value;
    }

    dealString() {
        const str = this.value.toString();
        const arr = str.split(KeyRegex);
        let len = arr.length;
        let bindKeys = {};
        let idx = 1;
        let languageObject = this.languageObject;
        while (idx < len) {
            let key = arr[idx];
            let value = languageObject[key];
            if (this.lastBindKeys[key] !== undefined) {
                delete this.lastBindKeys[key];
            } else {
                Object.defineProperty(languageObject, key, {
                    set: (v) => {
                        if (typeof v === 'string') {
                            if (v.match(KeyRegex)) {
                                let setter = new LanguageSetter();
                                setter.bundleName = this.bundleName;
                                this.lastBindKeys[key] = setter;
                            } else {
                                this.lastBindKeys[key] = v;
                            }
                        } else {
                            this.lastBindKeys[key] = v;
                        }
                        this.valueChanged(this.toString());
                    },
                    get: () => {
                        return this.lastBindKeys[key];
                    }
                });
            }
            bindKeys[key] = value;
            idx += 2;
        }

        this.removeLastBindKeys(languageObject);

        this.splitArray = arr;
        this.lastBindKeys = bindKeys;
    }

    toString() {
        let str = '';
        for (let i = 0; i < this.splitArray.length; ++i) {
            let key = this.splitArray[i];
            str += (i % 2 === 0 ? key : this.lastBindKeys[key].toString());
        }
        return str;
    }

    removeLastBindKeys(languageObject) {
        for (const bindKey in this.lastBindKeys) {
            const bindData = this.lastBindKeys[bindKey];
            if (bindData instanceof LanguageSetter) {
                bindData.destroy();
            } else {
                Object.defineProperty(languageObject, bindKey, {
                    writable: true,
                    value: bindData,
                });
            }
        }
        this.lastBindKeys = null;
    }

    destroy() {
        this.value = null;
        this.removeLastBindKeys(this.languageObject);
        this.components = null;
        this.splitArray = null;
        this.languageObject = null;
    }
}

interface BundleSetter {
    [key: string]: { [key: string]: LanguageSetter };
}

// ${} 在data里面找变量      @{} 在语言文件里面找key
class LangManager {

    language: ffb.BundleLanguage = {};
    setters: BundleSetter = {};

    setLanguage(language: ffb.LanguageObject, bundleName: string) {
        this.language[bundleName] = language;
    }

    getLaugange(bundleName: string) {
        return this.language[bundleName];
    }

    containKey(key: string, bundleName: string) {
        const element = this.language[bundleName];
        return key in element;
    }

    unBindLanguage(comp: ffb.LabelLike) {
        let nodeName = comp.node.name;
        let setter = this.setters[nodeName];
        if (!setter) {
            return;
        }
        delete setter.components[comp.uuid];
    }

    bindLanguage(comp: ffb.LabelLike, data: ffb.LanguageObject, bundleName: string) {
        let nodeName = comp.node.name;
        let value = data[nodeName];
        if (!isValidValue(value)) {
            return;
        }
        let setter = this.setters[bundleName][nodeName];
        if (!setter) {
            setter = this.setters[bundleName][nodeName] = new LanguageSetter();
            setter.bundleName = bundleName;
            setter.languageObject = data;
            setter.components[comp.uuid] = comp;
            setter.set(value);
        } else {
            setter.valueChanged(setter.toString());
        }
        setter.components[comp.uuid] = comp;
    }

    updateLanguage() {
        for (const bundleName in this.setters) {
            let setters = this.setters[bundleName];
            let languageObject = this.language[bundleName];
            for (const nodeName in setters) {
                setters[nodeName].set(languageObject[nodeName]);
            }
        }
    }

    destroyAllBinding() {
        for (const bundleName in this.setters) {
            let setters = this.setters[bundleName];
            for (const nodeName in setters) {
                setters[nodeName].destroy();
            }
        }
        this.setters = {};
    }
}

export default LangManager;
