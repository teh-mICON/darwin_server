class Tree {

  private food = 0;
  private x;
  private y;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  getX() { return this.x }
  getY() { return this.y }

  getFood() { return this.food }

  harvest() {
    const food = this.food;
    this.food = 0;
    return food;
  }
}

export default Tree;