let  currKey = 0;
let  clickCount = 0;

function keyPressed(){


  let tmpKey = key;

  if ((key >= 'a') && (key <= 'z')){
    tmpKey -= ('a' - 'A');


    // our goal is for currKey to be 0..26, NOT A..Z
    tmpKey = tmpKey - 'A';
    if ((tmpKey >=0) && (tmpKey < 26)){
      currKey = tmpKey;
    }

    goal = alphabet[currKey];
    clickCount = 0;
    currKey = key - 'a';

  }
}

function mousePressed(){

  currKey = (currKey + 1)%26;
  goal = alphabet[currKey];

}
