class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }
    sub(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }
    mul(n) {
        return new Vector(this.x * n, this.y * y);
    }
    div(n) {
        return new Vector(this.x / n, this.y / y);
    }
    mag() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    norm() {
        return this.mag() === 0 ? new Vector(0, 0) : this.div(this.mag());
    }
}