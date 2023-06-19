import zh from "./lang/zh";

if (!CC_EDITOR) {
    cc.game.on(cc.game.EVENT_ENGINE_INITED, ()=>{
        ffb.resManager.addBundle(cc.resources);
        ffb.langManager.setLanguage(zh, 'resources');
        cc.game.on(ffb.langManager.UPDATE_LANGUAGE, ()=>{
            // 根据传过来的参数切换语言
        });
    });
}

