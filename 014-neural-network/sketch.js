let colors = ["#F73B12", "#F88E13", "#E3C725", "#1DB499", "#06568B"];

let sliderA, sliderB, A, B;
let sliderM, m; // margin
let sliderG, g; // gross
let sliderO, o; // opacity
let sliderF, f; // frameRate
let sliderP, p; // probability
let blink;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight - 50);
  sliderA = createSlider(2, 77, 35, 1);
  sliderB = createSlider(2, 77, 27, 1);
  sliderM = createSlider(-height/2, height/2, 17, 1);
  sliderG = createSlider(.25, height/2, 0.5, 0.25);
  sliderO = createSlider(10, 99, 61, 1);
  sliderF = createSlider(0.1, 30, 5.7, 0.1);
  sliderP = createSlider(0, 1, 0.46, 0.001);
  blink   = createCheckbox('', true);
  
  sliderA.parent("controls");
  sliderB.parent("controls");
  sliderM.parent("controls");
  sliderG.parent("controls");
  sliderO.parent("controls");
  sliderF.parent("controls");
  sliderP.parent("controls");
  blink.parent("controls");
}

function draw() {
  frameRate(sliderF.value());
  background(255);
  A = sliderA.value();
  B = sliderB.value();
  m = sliderM.value();
  g = sliderG.value();
  o = sliderO.value();
  p = sliderP.value();
  
  //  create network positions
  
  let colA = [];
  
  for( let i = 0; i <= A; i++){
    let vs = (height - m*2) / A;
    append(colA, createVector(m, m + vs*i));
  }
  
    let colB = [];
  
  for( let i = 0; i <= B; i++){
    let vs = (height - m*2) / B;
    append(colB, createVector(width - m, m + vs*i));
  }
  
  // draw network
  
  stroke(colors[0]+o);
  

  for(let i = 0; i < colA.length; i++){
    for(let j = 0; j < colB.length; j++){
      if(blink.checked()){
        if(random(1) < p){
        strokeWeight(g*random(10));
      }else{
        strokeWeight(g);
      }
      }else{
        strokeWeight(g);
      }
      
      line(colA[i].x, colA[i].y, colB[j].x, colB[j].y);
    }
  }

  // draw neurons
  
  noStroke();
  fill(colors[0]+o);
  for (let i = 0; i < colA.length; i++){
    ellipse(colA[i].x, colA[i].y, 10, 10);
  }
  
    for (let i = 0; i < colB.length; i++){
    ellipse(colB[i].x, colB[i].y, 10, 10);
  }
}

function keyPressed() {
  if (key === 's') { // al apretar la tecla 's'
    console.log(`
  sliderA = createSlider(2, 77, ${sliderA.value()}, 1);
  sliderB = createSlider(2, 77, ${sliderB.value()}, 1);
  sliderM = createSlider(-height/2, height/2, ${sliderM.value()}, 1);
  sliderG = createSlider(.25, height/2, ${sliderG.value()}, 0.25);
  sliderO = createSlider(10, 99, ${sliderO.value()}, 1);
  sliderF = createSlider(0.1, 30, ${sliderF.value()}, 0.1);
  sliderP = createSlider(0, 1, ${sliderP.value()}, 0.001);
  blink   = createCheckbox('', ${blink.checked()});
    `);
  }
}