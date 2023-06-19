import ExtBase from "./ExtBase";

const { ccclass } = cc._decorator;

@ccclass
class TableView extends ExtBase {
    items = [];

    async updateItems(items:[]) {
        
    }
}

if (!CC_EDITOR) {
    cc.game.on(cc.game.EVENT_GAME_INITED, () => {
        ffb.dataManager.registeAttributes('TableView', 'items', (comp:TableView, value)=>{
            return comp.updateItems(value);
        });
    });
}