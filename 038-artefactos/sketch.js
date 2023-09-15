let pt = []; 
let sides;         
let radius;
let signA, signB;
let black, white, red, gold;
let strokeColor = [];
let font;

function preload(){
  font = loadFont("../data/Alegreya_Sans/AlegreyaSans-Regular.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  sides = 9;
  radius = width / 5.0;
  frameRate(14);
  // noCursor();
  pt = Array.from({length: sides}, () => createVector());

  for (let i = 0; i < sides; i++) {
    let inc = TWO_PI / sides;

    let xpos = cos(i * inc) * radius;
    let ypos = sin(i * inc) * radius;

    pt[i].x = xpos;
    pt[i].y = ypos;
  }

  black = color(0, 0, 0);
  white = color(0, 0, 0);
  red = color(200, 45, 0);
  gold = color(142, 127, 80);

  strokeColor[0] = white;
  strokeColor[1] = red;
  strokeColor[2] = gold;

  signA = new Sign(width * 0.333, height * 0.5);
  signB = new Sign(width * 0.666, height * 0.5);

  imageMode(CENTER);
  rectMode(CENTER);
}

function draw() {
  background(255);
  //blendMode(MULTIPLY);
  signA.render();
  signB.render();
  //blendMode(NORMAL);
}

class Line {
  constructor(a, b) {
    this.p1 = new Point(pt[a].x, pt[a].y);
    this.p2 = new Point(pt[b].x, pt[b].y);
    this.p1.s = random(0.1, 0.5);
    this.p2.s = random(0.1, 0.5);
    
    this.t = random(TWO_PI);
    this.tinc = random(-0.0002, 0.0002);

    this.c = strokeColor[Math.round(random(2))];
    this.sw = random(0.5, 3);

    if (random(1) > 0.5) {
      this.curve = true;
    } else {
      this.curve = false;
    }

    if (this.curve) {
      let d = dist(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
      let amp = map(d, 0, radius * 2, 1, 0);
      this.c1 = new Point(this.p1.x * amp + random(-d / 4, d / 4), this.p1.y * amp + random(-d / 4, d / 4));
      this.c2 = new Point(this.p2.x * amp + random(-d / 4, d / 4), this.p2.y * amp + random(-d / 4, d / 4));
    } else {
      let A = 0.8;
      let B = 1 - A;
      this.c1 = new Point(this.p1.x * A + this.p2.x * B, this.p1.y * A + this.p2.y * B);
      this.c2 = new Point(this.p1.x * B + this.p2.x * A, this.p1.y * B + this.p2.y * A);
    }
    
    this.c1.s = random(0.5, 1.5);
    this.c2.s = random(0.5, 1.5);
  }

  render(bm, a) {
    bm.rotate(this.t);
    bm.blendMode(OVERLAY);
    bm.stroke(this.c, a);
    bm.strokeWeight(this.sw);
    bm.noFill();
    bm.bezier(this.p1.x, this.p1.y, this.c1.x, this.c1.y, this.c2.x, this.c2.y, this.p2.x, this.p2.y);
    
    this.p1.move();
    this.p2.move();
    this.c1.move();
    this.c2.move();

    bm.blendMode(BLEND);
   
    this.t += this.tinc;
  }
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.t = random(TWO_PI);
    this.s = random(0.2, 1);
    
    this.seed = Math.round(random(100000));
    this.amp = random(1, 3);
    this.zoom = random(3000, 10000);
  }

  move() {
    noiseSeed(this.seed);
    let dif = 0.5 - noise(millis() / this.zoom) * this.amp;
    this.t += dif;
    
    this.x += Math.cos(this.t) * this.s;
    this.y += Math.sin(this.t) * this.s;
  }
}

class Sign {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.reset();
    this.randomWord = Math.round(random(spanish.length - 1));
    this.bitmap = createGraphics(Math.floor(radius * 3), Math.floor(radius * 3));
    this.maxalpha = 50;  // maximum line opacity
  }

  reset() {
    this.init = true;
    this.lifespan = Math.round(random(50, 150));
    this.existence = this.lifespan * 1.5;          // lifespan + blacktime
    this.tic = 0;
    this.fade = 255;
    this.numLines = Math.round(random(3, 6));
    this.lin = new Array(this.numLines);
    let count = 0;

    this.randomWord = Math.round(random(spanish.length - 1));
    this.bitmap = createGraphics(Math.floor(radius * 3), Math.floor(radius * 3));
    while (count < this.numLines) {
      this.start = Math.round(random(sides - 1));
      this.end = Math.round(random(sides - 1));
      if (this.start !== this.end) {
        this.lin[count] = new Line(this.start, this.end);
        count++;
      }
    }
  }

  drawText() {
    let lang = Math.floor(random(5));
    this.bitmap.textSize(15);
    this.bitmap.textFont(font);
    this.bitmap.fill(black);

    let k = radius * 0.666;
    let xpos = random(-2 * k, k / 2);
    let ypos = random(-k, k);

    switch(lang) {
      case 0: // spanish
        this.bitmap.text(spanish[this.randomWord], xpos, ypos);
        break;
      case 1: // english
        this.bitmap.text(english[this.randomWord], xpos, ypos);
        break;
      case 2: // german
        this.bitmap.text(german[this.randomWord], xpos, ypos);
        break;
      case 3: // greek
        this.bitmap.textFont(font);
        this.bitmap.text(greek[this.randomWord], xpos, ypos);
        break;
      case 4: // french
        this.bitmap.text(french[this.randomWord], xpos, ypos);
        break;
    }
  }

  updateGraphics() {
    this.bitmap.push();
    this.bitmap.translate(this.bitmap.width / 2, this.bitmap.height / 2);

    if (this.init) {
      this.drawText();
      this.init = false;
    }

    this.alpha = Math.sin(this.tic * PI / this.lifespan) * this.maxalpha;
    if (this.tic < this.lifespan) {
      for (let i = 0; i < this.lin.length; i++) {
        this.lin[i].render(this.bitmap, this.alpha);
      }
    } 
    
    this.bitmap.pop();
  }

  render() {
    this.updateGraphics();

    this.fade = Math.sin(this.tic * PI / this.existence) * 255;
    this.tic++;
    tint(255, this.fade);
    image(this.bitmap, this.x, this.y);

    if (this.tic >= this.existence) {
      this.reset();
    }
  }
}

spanish = ["américa","árbol","libertad","empatía","palma","viento","ave","pensamiento","perseverancia","sueño","grito","salto","sol","narval","cualquiera","sueños","gato","armonía","mar","autóctono","piedra","red","visión","subjetivo","no","flor","belleza","efímero","teatro","aire","flecha","confianza","paz","soperutano","paciencia","diseño","expresión","ascendente","pintura","travesía","lluvia","estrellas","caracol","nervio","cielo","acción","espacio","beso","nobleza","idea","luz ","ilusión","armonía","esfuerzo","luz","flor","luz","paz","crea","inventar","libre","sobra","niño","nuevo","amor","sol","renacer","creación","felicidad","mirada","flor","lejos","libertad","sol","dedicación","justo","suerte","luz","luz","aire","sueño","árbol","respeto","vida","universo","cielo","esperanza","nuevo","serenidad","felicidad","mar","pánico","nube","poesía","fuego","vida","justicia","Anglo","esperanza","vida","piano","sol","esfuerzo","familia","lucha","verso","contigo","árbol","flora","luna","esperanza","vida","altura","amabilidad","naturaleza","sol","sueño","camino","expresión","odisea","ideas","cambio","nuevo","andar","tonto","origen","noche","libertad","expansión","híbrida","la bandada","asincronía","elevada","el aro","fragmentar","la extensión","el cuerpo","descalce","ampliación","los perfiles","impulso","acorazado","el valle","elegancia","segmentada","el puño","vínculo","sinuoso","la flor","arritmia","dispar","el vuelo","distensión","palpitar","el pez"];
english = ["America","tree","freedom","empathy","palm","wind","bird","thought","perseverance","dream","scream","jump","Sun","narwhal","anyone","dreams","cat","harmony","sea","indigenous","stone","net","view","subjective","do not","flower","beauty","ephemeral","theater","air","arrow","trust","peace","fool","patience","design","expression","upward","painting","crossing","rain","Stars","snail","nerve","heaven","action","space","kiss","nobility","idea","light","delusion","harmony","effort","light","flower","light","peace","creates","invent","free","surplus","boy","new","love","Sun","be reborn","creation","happiness","look","flower","far","freedom","Sun","dedication","fair","luck","light","light","air","dream","tree","respect","lifetime","universe","heaven","hope","new","serenity","happiness","sea","panic","cloud","poetry","fire","life","justice","Anglo","hope","lifetime","piano","Sun","effort","family","fight","verse","with you","tree","flora","Moon","hope","lifetime","height","amiability","nature","Sun","dream","path","expression","Odyssey","Ideas","change","new","walk","fool","origin","night","freedom","expansion","hybrid","the flock","asynchrony","high","ring","to fragment","the extension","the body","misalignment","extension","the profiles","impulse","battleship","Valley","elegance","segmented","the fist","link","sinuous","the flower","arrhythmia","disparate","the flight","distension","throb","the fish"];
german = ["Amerika","Baum","Freiheit","Empathie","Palme","Wind","Vogel","Denken","Ausdauer","Traum","Schrei","springen","Sonne","Narwal","jeder","Träume","Katze","Harmonie","Meer","autochthonen","Stein","Netzwerk","Ansicht","subjektiv","keine","Blume","Schönheit","kurzlebig","Theater","Luft","Pfeil","Vertrauen","Frieden","Dummkopf","Geduld","Design","Ausdruck","nach oben","Malerei","Kreuzung","regen","Sterne","Schnecke","Nerv","Himmel","Aktion","Raum","Kuss","Adel","Idee","Licht","Hoffnung","Harmonie","Anstrengung","Licht","Blume","Licht","Frieden","schafft","erfinden","kostenlos","Überschuss","Kind","neu","liebe","Sonne","wiedergeboren","Schaffung","Glück","aussehen","Blume","weit","Freiheit","Sonne","Widmung","Recht","Glück","Licht","Licht","Luft","Traum","Baum","Respekt","Leben","Universum","Himmel","Hoffnung","neu","Gelassenheit","Glück","Meer","Panik","Wolke","Poesie","Feuer","Leben","Gerechtigkeit","Anglo","Hoffnung","Leben","Klavier","Sonne","Anstrengung","Familie","Kampf","Vers","mit Ihnen","Baum","Flora","Mond","Hoffnung","Leben","Höhe","Freundlichkeit","Natur","Sonne","Traum","Weg","Ausdruck","Odyssee","Ideen","Veränderung","neu","gehen","albern","Quelle","Nacht","Freiheit","Erweiterung","Hybrid","die Herde","Asynchronität","hoch","der Ring","fragmentieren","die Erweiterung","der Körper","Fehlausrichtung","Erweiterung","die Profile","Impuls","gepanzert","das Tal","Eleganz","segmentiert","die Faust","Link","gewunden","die Blume","Herzrhythmusstörungen","dispar","der Flug","aufgebläht","pochen","der Fisch"];
greek = ["Αμερική","δέντρο","ελευθερία","ενσυναίσθηση,συμπάθεια","παλάμη","άνεμος","πουλί","σκέψη","επιμονή","όνειρο","κραυγή","άλμα","ήλιος","μονόδοντος φάλαινα","κάθενας ","όνειρα","γάτα","αρμονία","θάλασσα","αυτόχθων","πέτρα","δίκτυο","θέα","υποκειμενικός","όχι","λουλούδι","ομορφιά","εφήμερο","θέατρο","αέρας","βέλος","εμπιστοσύνη","ειρήνη","ανόητος","υπομονή","σχέδιο","έκφραση","επάνω","ζωγραφική","διάβαση","βροχή","αστέρια","σαλιγκάρι","νεύρο","ουρανός","δράση","χώρος","φιλί","αρχοντιά","ιδέα","φως","αυταπάτη","αρμονία","προσπάθεια","φως","λουλούδι","φως","ειρήνη","δημιουργεί","εφευρίσκω","ελεύθερο","πλεόνασμα","παιδί","νέος","αγάπη","ήλιος","να ξαναγεννηθεί","δημιουργία","ευτυχία","ματιά","λουλούδι","μακριά","ελευθερία","ήλιος","αφιέρωση","δεξιά","τύχη","φως","φως","αέρας","όνειρο","δέντρο","σεβασμός","ζωή","σύμπαν","ουρανός","ελπίδα","νέος","γαλήνη","ευτυχία","θάλασσα","πανικός","σύννεφο","ποίηση","φωτιά","ζωή","δικαιοσύνη","Anglo","ελπίδα","ζωή","πιάνο","ήλιος","προσπάθεια","οικογένεια","πάλη","στίχος","μαζί σου","δέντρο","χλωρίδα","φεγγάρι","ελπίδα","ζωή","ύψος","καλοσύνη","φύση","ήλιος","όνειρο","μονοπάτι","έκφραση","Οδύσσεια","ιδέες","αλλαγή","νέος","βόλτα","ανόητος","πηγή","νύχτα","ελευθερία","επέκταση","υβριδικό","το κοπάδι","ασύγχρονη","ψηλά","το δαχτυλίδι","να αποσπαστεί","την επέκταση","το σώμα","εσφαλμένη ευθυγράμμιση","μεγέθυνση","τα προφίλ","ώθηση","θωρακισμένο","την κοιλάδα","κομψότητα","κατακερματισμένη","η γροθιά","σύνδεσμο","ελικοειδής","το λουλούδι","αρρυθμία","να εξαφανιστεί","την πτήση","φούσκωμα","παλμός","τα ψάρια"];
french = ["amérique","arbre","liberté","empathie","palme","vent","oiseau","penser","persévérance","rêve","crier","sauter","soleil","narval","tout","rêves","chat","harmonie","mer","autochtone","la pierre","rouge","vision","subjectif","non","fleur","beauté","éphémère","théâtre","air","flèche","confiance","la paix","zoperutano","patience","conception","expression","ascendant","peinture","croisement","pluie","étoiles","escargot","nerf","le paradis","action","l'espace","baiser","noblesse","idée","lumière","illusion","harmonie","effort","lumière","fleur","lumière","la paix","crée","inventer","libre","restes","enfant","nouveau","amour","soleil","renaître","création","félicité","regarder","fleur","loin","liberté","soleil","dévouement","juste","la chance","lumière","lumière","air","rêve","arbre","le respect","vie","univers","le paradis","l'espoir","nouveau","sérénité","félicité","mer","panique","nuage","poésie","le feu","vie","justice","Anglo","l'espoir","vie","piano","soleil","effort","famille","combattre","verset","avec vous","arbre","flore","lune","l'espoir","vie","hauteur","gentillesse","la nature","soleil","rêve","route","expression","odyssée","idées","changer","nouveau","marcher","imbécile","source","nuit","liberté","expansion","hybride","le troupeau","asynchronie","élevé","l'anneau","se fragmenter","l'extension","le corps","désalignement","élargissement","les profils","impulsion","blindé","la vallée","élégance","segmenté","le poing","lien","sinueux","la fleur","arythmie","dispar","le vol","ballonnement","palpiter","le poisson"];