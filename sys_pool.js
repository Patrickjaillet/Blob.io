export class ObjectPool {
    constructor(createFn, resetFn) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];
    }

    get() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        this.resetFn(obj);
        this.active.push(obj);
        return obj;
    }

    release(obj) {
        const index = this.active.indexOf(obj);
        if (index > -1) {
            this.active.splice(index, 1);
            this.pool.push(obj);
        }
    }
    
    clear() {
        // Move all active to pool
        while(this.active.length > 0) {
            this.pool.push(this.active.pop());
        }
    }
}
