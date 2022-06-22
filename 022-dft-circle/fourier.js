class Complex {
  constructor(real, imag) {
    this.real = real;
    this.imag = imag;
  }
  
  mult(c) {
    const real = this.real * c.real - (this.imag * c.imag);
    const imag = this.real * c.imag + this.imag * c.real;
    return new Complex(real, imag);
  }
  
  add(c) {
    this.real += c.real;
    this.imag += c.imag;
  }
}

function dft(x) {
  
  let X = [];
  const N = x.length;
  
  for (let k = 0; k < N; k++) {
    let sum = new Complex(0,0)
    
    for (let n = 0; n < N; n++) {
      const phi = (TWO_PI * k * n) / N;
      const c = new Complex(cos(phi), - sin(phi));
      sum.add(x[n].mult(c));
    }
    sum.real = sum.real / N;
    sum.imag = sum.imag / N;
    
    let freq = k;
    let amp = sqrt(sum.real * sum.real + sum.imag * sum.imag);
    let phase = atan2(sum.imag, sum.real);
    
    X[k] = { real: sum.real, imag: sum.imag, freq, amp, phase};
  }
  
  return X;
}