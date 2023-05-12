import DataManager from "./DataManager";
import GameManager from "./GameManager";
import LangManager from "./LangManager";
import ResManager from "./ResManager";
import TaskDispatcher from "./TaskDispatcher";

let ffb = {
    gameManager:new GameManager(),
    dataManager:new DataManager(),
    resManager:new ResManager(),
    langManager:new LangManager(),
    taskDispatcher:new TaskDispatcher(),
};

// cc.game.on(cc.game.EVENT_ENGINE_INITED, ()=>{
ffb.gameManager.init();

// });

window.ffb = ffb;