import Platform from "../Platform";


let platform = window.tt ? window.tt :  window.qq ? window.qq : window.wx;

export default class LittleGame extends Platform {

    getLaunchOptionsSync() {
        platform.getLaunchOptionsSync();
    }

}
