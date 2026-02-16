import * as THREE from 'three';

export class Quadtree {
    constructor(boundary, capacity) {
        this.boundary = boundary; // { x, z, width, height }
        this.capacity = capacity;
        this.points = [];
        this.divided = false;
    }

    subdivide() {
        const x = this.boundary.x;
        const z = this.boundary.z;
        const w = this.boundary.width / 2;
        const h = this.boundary.height / 2;

        const ne = { x: x + w, z: z - h, width: w, height: h };
        const nw = { x: x - w, z: z - h, width: w, height: h };
        const se = { x: x + w, z: z + h, width: w, height: h };
        const sw = { x: x - w, z: z + h, width: w, height: h };

        this.northeast = new Quadtree(ne, this.capacity);
        this.northwest = new Quadtree(nw, this.capacity);
        this.southeast = new Quadtree(se, this.capacity);
        this.southwest = new Quadtree(sw, this.capacity);

        this.divided = true;
    }

    insert(point) {
        if (!this.contains(this.boundary, point)) {
            return false;
        }

        if (this.points.length < this.capacity) {
            this.points.push(point);
            return true;
        }

        if (!this.divided) {
            this.subdivide();
        }

        if (this.northeast.insert(point)) return true;
        if (this.northwest.insert(point)) return true;
        if (this.southeast.insert(point)) return true;
        if (this.southwest.insert(point)) return true;

        return false;
    }

    query(range, found) {
        if (!found) found = [];

        if (!this.intersects(this.boundary, range)) {
            return found;
        }

        for (let p of this.points) {
            if (this.contains(range, p)) {
                found.push(p);
            }
        }

        if (this.divided) {
            this.northeast.query(range, found);
            this.northwest.query(range, found);
            this.southeast.query(range, found);
            this.southwest.query(range, found);
        }

        return found;
    }

    contains(rect, point) {
        return (point.position.x >= rect.x - rect.width &&
                point.position.x <= rect.x + rect.width &&
                point.position.z >= rect.z - rect.height &&
                point.position.z <= rect.z + rect.height);
    }

    intersects(rect1, rect2) {
        return !(rect2.x - rect2.width > rect1.x + rect1.width ||
                 rect2.x + rect2.width < rect1.x - rect1.width ||
                 rect2.z - rect2.height > rect1.z + rect1.height ||
                 rect2.z + rect2.height < rect1.z - rect1.height);
    }
    
    clear() {
        this.points = [];
        this.divided = false;
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;
    }
}
