/**
 * TubularFlex font by Herbert Spencer, Nov. 2006
 * This font was inspired by STUV font by Flor.o
 * and 'Supert Tipo Veloz' as an assembling principle
 * of building font from discrete units.
 */


let alphabet, current, goal, opac;

function setup() {
  createCanvas(420, 480);
  alphabet = [];
  initializeLetters();
}


function draw() {
  clear();
  push();
  {
    scale(2, 2);
    grid();
    translate(70, 80);
    push();
    {
      drawAndInterpolate();
    }
    pop();
  }
  pop();
}
