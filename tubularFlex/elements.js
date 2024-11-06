function grid() {
  for (let i = 0; i < width; i += 10) {
    strokeWeight(0.3);
    stroke('#CC000033');
    line (i, 0, i, width);
    line (0, i, height, i);
  }

  stroke('#CC000099');
  line (70, 80, 140, 80);
  line (70, 160, 140, 160);
  line (70, 30, 70, 210);
  line (140, 30, 140, 210);
  line (70, 30, 140, 30);
  line (70, 210, 140, 210);
  noStroke();
}

function p1() {
  //registrationMark("P1");
  beginShape();
  vertex (0, 0);
  vertex (30, 0);
  vertex (40, 10);
  vertex (-20, 10);
  vertex (-20, 0);
  vertex (0, 0);
  endShape();
}

function p2() {
  //registrationMark("P2");
  beginShape();
  vertex (0, 0);
  vertex (30, 0);
  vertex (40, 10);
  vertex (-20, 10);
  vertex (-20, 0);
  vertex (0, 0);
  endShape();
}

function p3() {
  //registrationMark("P3");
  beginShape();
  vertex (-20, -40);
  vertex (-10, -30);
  vertex (-10, 0);
  bezierVertex (-10, 5, -5, 10, 0, 10);
  vertex (20, 10);
  vertex (20, 20);
  vertex (0, 20);
  bezierVertex (-10, 20, -20, 10, -20, 0);
  vertex (-20, -40);
  endShape();
}

function p4() {
  //registrationMark("P4");
  beginShape();
  vertex (-20, -40);
  vertex (-10, -30);
  vertex (-10, 0);
  bezierVertex (-10, 5, -5, 10, 0, 10);
  vertex (20, 10);
  vertex (20, 20);
  vertex (0, 20);
  bezierVertex (-10, 20, -20, 10, -20, 0);
  vertex (-20, -40);
  endShape();
}

function p5() {
  //registrationMark("P5");
  beginShape();
  vertex (10, -30);
  vertex (20, -40);
  vertex (20, 0);
  bezierVertex (20, 10, 10, 20, 0, 20);
  vertex (-20, 20);
  vertex (-20, 10);
  vertex (0, 10);
  bezierVertex (5, 10, 10, 5, 10, 0);
  vertex (10, -30);
  endShape();
}

function p6() {
  //registrationMark("P6");
  beginShape();
  vertex (10, -30);
  vertex (20, -40);
  vertex (20, 0);
  bezierVertex (20, 10, 10, 20, 0, 20);
  vertex (-20, 20);
  vertex (-20, 10);
  vertex (0, 10);
  bezierVertex (5, 10, 10, 5, 10, 0);
  vertex (10, -30);
  endShape();
}

function registrationMark(pieceName) {
  stroke('#CC0000');
  line(-5, 0, 5, 0);
  line(0, -5, 0, 5);
  fill('#CC0000');
  noStroke();
  fill(0);
}
