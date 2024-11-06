function drawAndInterpolate(){
  let A = 0.925;
  let B = 1.0 - A;

  for (let i = 0; i < 6; i++){
    current.xlocs[i] = A*current.xlocs[i] + B*goal.xlocs[i];
    current.ylocs[i] = A*current.ylocs[i] + B*goal.ylocs[i];
    current.rots[i] = A*current.rots[i]  + B*goal.rots[i];
    opac = 200;
  }
  fill(0, opac);
  current.render();
}
