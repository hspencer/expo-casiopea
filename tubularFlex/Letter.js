class Letter {

  constructor(car, xl, yl, rt) {

    this.xlocs = [];
    this.ylocs = [];
    this.rots =  [];
    this.c = car;

    for (let i=0; i<6; i++) {
      this.xlocs[i] = xl[i];
      this.ylocs[i] = yl[i];
      this.rots[i] = rt[i];
    }
  }

  render(){
    for (let i=0; i<6; i++) {
      push();

      translate(this.xlocs[i], this.ylocs[i]);
      rotate(this.rots[i]);
      switch(i) {
      case 0: 
        p1();
        break;
      case 1:
        p2();
        break;
      case 2:
        p3();
        break;
      case 3:
        p4();
        break;
      case 4:
        p5();
        break;
      case 5:
        p6();
        break;
      }

      pop();
    }
  }
}
