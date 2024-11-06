
Letter alphabet[];
Letter current;
Letter goal;
float opac;
float Q = HALF_PI;

void setup(){
  size(420,480);
  smooth();
  alphabet = new Letter[26];
  initializeLetters();
}

void draw(){
  background(255);
  pushMatrix();
  {
    scale(2,2);
    grid();
    translate(70,80); //move everything to the upper corner of the grid  
    pushMatrix();
    {
      drawAndInterpolate();
    }
    popMatrix();
  }
  popMatrix();
}
