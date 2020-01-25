import Simulation from './simulation';
class Hive {

  private id;
  private x;
  private y;

  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
  }

  getID() { return this.id }
  getX() { return this.x }
  getY() { return this.y }
}

export default Hive;