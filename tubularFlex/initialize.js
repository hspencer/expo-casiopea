function initializeLetters() {
  current = new Letter('a', XL[0], YL[0], ROTS[0]);
  goal = new Letter('a', XL[0], YL[0], ROTS[0]);

  for (let i=0; i<26; i++) {
    let ch = (char)(i+'a');
    alphabet[i] = new Letter(ch, XL[i], YL[i], ROTS[i]);
  }
}
