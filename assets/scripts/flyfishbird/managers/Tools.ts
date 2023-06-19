
class Counter {

    private count = 1;
    private complete:Function = null;

    constructor(complete:()=>any) {
        this.complete = complete;
    }

    addCount() {
        this.count ++;
    }

    complelteOnce () {
        this.count--;
        // console.log(node.name, 'total', this.count);
        if (this.count <= 0 && this.complete) {
            this.complete();
            this.complete = null;
        }
    }
}

export default {Counter}

