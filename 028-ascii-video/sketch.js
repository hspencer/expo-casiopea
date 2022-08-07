let video;
let asciiDiv;
const W = 120;
const H = 30;


function setup() {
  noCanvas();
  video = createCapture(VIDEO);
  video.size(W,H);
  video.hide();
  asciiDiv = createDiv('');
  asciiDiv.id('ascii');
}
function draw() {
  const txt = '  ·.:=+*#%@';

  background(255);
  fill(0);
  video.loadPixels();

  let output = '';
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      let index = (i + j * W) * 4;
      let r = video.pixels[index + 0];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];
      let bright = (r + g + b) / 3;
      let bindex = map(bright, 0, 255, 0, txt.length);
      let ch = txt.charAt(floor(bindex));
      if (ch == ' ') {
        output += '&nbsp;';
      } else {
        output += ch;
      }
      // let x = i * dim;
      // let y = j * dim;
      // fill(255);
      // textSize(dim);
      // text(ch, x, y);
    }
    output += '<br/>';
  }
  asciiDiv.html(output);
}

function keyTyped(){
  let w = document.getElementById('ascii').offsetWidth;
  let h = document.getElementById('ascii').offsetHeight;
  print("width = "+w+"\theight = "+h);
}