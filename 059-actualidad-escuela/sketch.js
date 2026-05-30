/* =========================================================================
   ACTUALIDAD ESCUELA — PIEDRAS QUE NO CALZAN — sketch.js
   Simulación física de los cursos actuales de la e[ad] PUCV (Casiopea).
   Requiere en el HTML: p5.js + matter.js (locales en ../js/).

   - Datos:  query semántica a la API pública de Casiopea (Semantic MediaWiki)
   - Piedra: polígono irregular con física real (no encaja con sus vecinas)
   - Tamaño ∝ nº de estudiantes (propiedad "Alumnos")
   - Color  ∝ carreras relacionadas (Diseño coral · Arquitectura celeste · ambas gris),
            con variación aleatoria por pieza (ningún color es idéntico)
   - Forma  ∝ tipo de curso (talleres → cuadrado · ramos lectivos → círculo · resto → piedra)
   - Click: selecciona la piedra (borde marcado) y muestra su ficha fija
            arriba a la izquierda; click fuera deselecciona
   - Doble clic: abre la página del curso en la wiki (pestaña nueva)
   ========================================================================= */

const { Engine, World, Bodies, Body, Composite } = Matter;

// "Actualidad": el año es el vigente según la fecha (no fijo).
const HOY     = new Date();
const ANIO    = HOY.getFullYear();   // este año
const PERIODO = null;                // ideal: "primero"; por ahora TODOS los de ANIO
const WIKI    = "https://wiki.ead.pucv.cl/api.php";

// Color base por "Carreras Relacionadas".
//   Diseño → coral · Arquitectura → celeste · ambas / otros → gris
const COLORES = {
  diseno:       "#F9664A",
  arquitectura: "#62BBD6",
  ambas:        "#B3B3B3",
  neutro:       "#B3B3B3"   // magíster / sin carrera → gris también
};

// Color base (hex) según el conjunto de carreras de un curso.
function colorBaseCarreras(carreras){
  const txt = (carreras || []).map(c => ("" + c).toLowerCase());
  const esDis = txt.some(c => c.includes("dise"));        // diseño / diseno
  const esArq = txt.some(c => c.includes("arquitectura"));
  if (esDis && esArq) return COLORES.ambas;
  if (esDis)          return COLORES.diseno;
  if (esArq)          return COLORES.arquitectura;
  return COLORES.neutro;
}

// Cada objeto recibe una variación aleatoria del color base, de modo que
// ningún color es idéntico a otro (único por pieza). Jitter en HSB.
function variar(hex){
  colorMode(HSB, 360, 100, 100);
  const c = color(hex);
  const h = (hue(c) + random(-9, 9) + 360) % 360;
  const s = constrain(saturation(c) + random(-13, 13), 0, 100);
  const b = constrain(brightness(c) + random(-10, 10), 0, 100);
  const out = color(h, s, b);
  colorMode(RGB, 255);
  return out;
}

// Forma según "Tipo de Curso": talleres → cuadrado, ramos → círculo, resto → piedra.
function formaDeTipo(tipo){
  const t = ("" + (tipo || "")).toLowerCase();
  if (t.includes("taller")) return "cuadrado";
  if (t.includes("ramo"))   return "circulo";
  return "piedra";
}

// Palabras que NO aportan inicial: artículos/preposiciones/conjunciones y
// marcas de semestre que no son parte del nombre del curso.
const ARTICULOS = new Set([
  "y","e","o","u","de","del","la","el","los","las","lo","un","una","unos","unas",
  "en","con","a","al","para","por","su","sus","the","of","and",
  "s1","s2","1s","2s","semestre"
]);

// Iniciales en mayúscula del nombre del curso, saltando artículos y números.
function inicialesDe(titulo){
  return ("" + titulo).split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .filter(w => !ARTICULOS.has(w.toLowerCase()))
    .map(w => (w.match(/[A-Za-zÀ-ÿ]/) || [""])[0].toUpperCase())  // 1ª letra real
    .filter(Boolean)
    .join("");
}

let engine, world, muros = [];
let piedras = [];
let hovered = null, seleccionada = null, arrastrando = null, offset = {x:0,y:0};
let cartelaEl, cartelaTitulo, cartelaMeta;   // elementos de la cartela HTML

// ---- Carga inicial: misma idea que tu loadJSON(..., "jsonp") --------------
// Usamos fetch (la API de Casiopea responde con CORS para action=ask);
// si fallara, caemos a JSONP con callback gotData, idéntico a tu patrón.
function preload(){
  // se dispara en setup vía cargarDatos(); preload queda libre por si
  // prefieres mover aquí el loadJSON clásico.
}

function setup(){
  createCanvas(windowWidth, windowHeight);
  textFont("IBM Plex Sans");

  // referencias a la cartela de rollover (antes de cargar datos)
  cartelaEl     = document.getElementById("cartela");
  cartelaTitulo = cartelaEl.querySelector(".titulo");
  cartelaMeta   = cartelaEl.querySelector(".meta");

  engine = Engine.create();
  world  = engine.world;
  // En esta versión de matter.js la gravedad vive en world.gravity, no en
  // engine.gravity. Lo resolvemos de forma agnóstica a la versión.
  const grav = engine.gravity || (world && world.gravity);
  if (grav) grav.y = 1;

  crearMuros();
  cargarDatos();
}

function urlConsulta(){
  // Nota: la wiki NO tiene la propiedad "Período Académico"; el semestre vive
  // en el título del curso (ver detectarPeriodo). Pedimos solo lo que existe.
  let q = `[[Category:Curso]][[Año::${ANIO}]]`;
  q += `|?Año|?Tipo de Curso|?Alumnos|?Carreras Relacionadas|?Profesores|limit=9999`;
  const params = new URLSearchParams({
    action:"ask", format:"json", query:q, utf8:"1", formatversion:"latest",
    origin:"*"   // MediaWiki: habilita el header CORS para fetch desde el navegador
  });
  return `${WIKI}?${params.toString()}`;
}

// El semestre no es una propiedad semántica: se infiere del título del curso.
// Devuelve "primero" | "segundo" | null (sin marca → curso anual/indefinido).
function detectarPeriodo(titulo){
  const t = titulo.toLowerCase();
  if (/\b(2s|s2|2º\s*sem|2°\s*sem|2\s*semestre|segundo\s*sem)/.test(t)) return "segundo";
  if (/\b(1s|s1|1º\s*sem|1°\s*sem|1\s*semestre|1er\s*sem|primer\s*sem)/.test(t)) return "primero";
  return null;
}

async function cargarDatos(){
  try{
    const r = await fetch(urlConsulta());
    gotData(await r.json());
  }catch(e){
    window.gotData = gotData;
    const s = document.createElement("script");
    s.src = urlConsulta() + "&callback=gotData";
    document.body.appendChild(s);
  }
}

// ---- callback de datos (nombre clásico de tus sketches) -------------------
function gotData(data){
  const res = (data.query && data.query.results) || {};
  const cursos = [];
  for (const titulo in res){
    const p = res[titulo].printouts || {};

    // Seguridad: aunque la query ya filtra por [[Año::ANIO]], descartamos
    // cualquier curso cuya propiedad Año no incluya el año vigente.
    const anios = (p["Año"] || []).map(x => parseInt(x, 10));
    if (anios.length && !anios.includes(ANIO)) continue;

    // Filtro por semestre inferido del título. Los cursos sin marca de
    // semestre (anuales/indefinidos) se incluyen siempre.
    const periodo = detectarPeriodo(titulo);
    if (PERIODO && periodo && periodo !== PERIODO) continue;

    const nAlumnos = (p["Alumnos"] || []).length;
    if (nAlumnos === 0) continue;

    const carreras = (p["Carreras Relacionadas"] || []).map(o => o.fulltext || o).filter(Boolean);

    cursos.push({
      titulo: titulo.replace(/\s*\d{4}.*$/, "").trim() || titulo,
      alumnos: nAlumnos,
      tipo: (p["Tipo de Curso"] && p["Tipo de Curso"][0]) ? ("" + p["Tipo de Curso"][0]) : "Otro",
      carreras,
      url: res[titulo].fullurl || "",
      profesores: (p["Profesores"] || []).map(o => o.fulltext || o).filter(Boolean)
    });
  }
  construirPiedras(cursos);
}

// ---- Geometría de piedra irregular ----------------------------------------
function vérticesPiedra(radio, semilla){
  const n = floor(random(6, 10)), verts = [];
  for (let i = 0; i < n; i++){
    const ang = (TWO_PI / n) * i + random(-0.18, 0.18);
    const rr  = radio * (0.62 + 0.38 * noise(semilla + cos(ang)*1.7, semilla + sin(ang)*1.7));
    verts.push({ x: cos(ang)*rr, y: sin(ang)*rr });
  }
  return verts;
}

function construirPiedras(cursos){
  const maxA = Math.max(...cursos.map(c => c.alumnos), 1);
  const minA = Math.min(...cursos.map(c => c.alumnos), 1);

  cursos.forEach((c, i) => {
    const t = (c.alumnos - minA) / Math.max(maxA - minA, 1);
    const radio = lerp(12, 43, Math.sqrt(t)) * 1.2;   // +20% de tamaño
    const lado  = radio * 1.8;                         // lado del cuadrado (talleres)
    const forma = formaDeTipo(c.tipo);
    const x = random(width*0.2, width*0.8), y = -random(80, 900);
    const opts = { friction:0.8, frictionStatic:1.0, restitution:0.02, density:0.0016 };

    let body, verts = null;
    try{
      if (forma === "cuadrado"){
        body = Bodies.rectangle(x, y, lado, lado, opts);
      } else if (forma === "circulo"){
        body = Bodies.circle(x, y, radio, opts);
      } else {
        verts = vérticesPiedra(radio, i * 13.37);
        body = Bodies.fromVertices(x, y, [verts], opts, true);
      }
    }catch(err){ body = Bodies.circle(x, y, radio, opts); }
    if (!body) return;

    Body.setAngle(body, random(TWO_PI));
    Composite.add(world, body);

    const col = variar(colorBaseCarreras(c.carreras));
    piedras.push({
      body, forma, verts, radio, lado, curso:c,
      color: col,
      colorLetra: lerpColor(col, color(255), 0.6),   // relleno empalidecido
      iniciales: inicialesDe(c.titulo)
    });
  });
}

// Dibuja la forma de una pieza (centrada en 0,0) a una escala y desplazamiento.
function dibujarForma(p, escala, ox, oy){
  if (p.forma === "cuadrado"){
    rectMode(CENTER);
    rect(ox, oy, p.lado*escala, p.lado*escala, 2);
  } else if (p.forma === "circulo"){
    ellipse(ox, oy, p.radio*2*escala, p.radio*2*escala);
  } else {
    beginShape();
    for (const v of p.verts) vertex(v.x*escala + ox, v.y*escala + oy);
    endShape(CLOSE);
  }
}

function crearMuros(){
  muros.forEach(m => Composite.remove(world, m));
  const g = 60;
  muros = [
    Bodies.rectangle(width/2, height+g/2, width*2, g, { isStatic:true }),
    Bodies.rectangle(-g/2, height/2, g, height*3, { isStatic:true }),
    Bodies.rectangle(width+g/2, height/2, g, height*3, { isStatic:true })
  ];
  Composite.add(world, muros);
}

function sacudir(){
  piedras.forEach(p => {
    Body.applyForce(p.body, p.body.position,
      { x: random(-0.09,0.09)*p.body.mass, y: random(-0.16,-0.05)*p.body.mass });
    Body.setAngularVelocity(p.body, random(-0.3,0.3));
  });
}

// ---- Render ---------------------------------------------------------------
function draw(){
  clear();                       // canvas transparente: deja ver el fondo claro
  Engine.update(engine, 1000/60);

  hovered = null;
  for (const p of piedras){
    const pos = p.body.position;
    if (dist(mouseX, mouseY, pos.x, pos.y) < p.radio*0.9) hovered = p;

    push();
    translate(pos.x, pos.y);
    rotate(p.body.angle);

    // sombra suave sobre fondo claro
    noStroke(); fill(0,0,0,28);
    dibujarForma(p, 1, 3, 4);

    // cuerpo
    fill(p.color); stroke(0,0,0,55); strokeWeight(1);
    dibujarForma(p, 1, 0, 0);

    // iniciales centradas, en el color del relleno empalidecido.
    // Tamaño proporcional al elemento y al nº de letras (para que quepan).
    if (p.iniciales){
      const n = p.iniciales.length;
      const ts = Math.min(p.radio * 1.05, (p.radio * 2.6) / n);
      noStroke(); fill(p.colorLetra);
      textAlign(CENTER, CENTER);
      textStyle(BOLD);
      textSize(ts);
      text(p.iniciales, 0, ts * 0.06);   // leve ajuste óptico vertical
    }

    // la pieza SELECCIONADA queda con el borde marcado
    if (seleccionada === p){
      noFill(); stroke(30,26,22,235); strokeWeight(2);
      dibujarForma(p, 1.13, 0, 0);
    }
    pop();
  }

  cursor(hovered ? "pointer" : "default");
}

// ---- Ficha de la piedra seleccionada (fija, arriba a la izquierda) ---------
function seleccionar(p){
  seleccionada = p;
  mostrarFicha(p);
}

function mostrarFicha(p){
  if (!cartelaEl) return;

  if (!p){                       // sin selección → ocultar la ficha
    cartelaEl.classList.remove("on");
    return;
  }

  const c = p.curso;
  cartelaTitulo.textContent = c.titulo;

  const carrera = (c.carreras && c.carreras.length) ? c.carreras.join(" + ") : "—";
  const profes  = (c.profesores && c.profesores.length)
    ? c.profesores.join(", ") : "—";
  const plural  = c.alumnos === 1 ? "estudiante" : "estudiantes";
  const tipo    = (c.tipo && c.tipo !== "_otro") ? c.tipo : "—";

  cartelaMeta.innerHTML =
    `<span class="k">Carrera</span> <span class="v">${carrera}</span>` +
    `<span class="k">Tipo</span> <span class="v">${tipo}</span>` +
    `<span class="k">${c.profesores.length === 1 ? "Profesor" : "Profesores"}</span> <span class="v">${profes}</span>` +
    `<span class="k">Estudiantes</span> <span class="v">${c.alumnos} ${plural}</span>`;

  cartelaEl.classList.add("on");
}

// piedra que está bajo el cursor (o null)
function piedraBajoMouse(){
  for (const p of piedras){
    const pos = p.body.position;
    if (dist(mouseX, mouseY, pos.x, pos.y) < p.radio*0.9) return p;
  }
  return null;
}

// ---- Interacción ----------------------------------------------------------
function mousePressed(){
  const bajo = piedraBajoMouse();
  if (bajo){
    seleccionar(bajo);                       // click sobre piedra → seleccionar
    arrastrando = bajo.body;
    offset = { x: mouseX - arrastrando.position.x, y: mouseY - arrastrando.position.y };
    Body.setStatic(arrastrando, true);
  } else {
    seleccionar(null);                       // click fuera → deseleccionar
  }
}
function mouseDragged(){
  if (arrastrando){
    Body.setPosition(arrastrando, { x: mouseX-offset.x, y: mouseY-offset.y });
    Body.setAngle(arrastrando, arrastrando.angle + 0.01);
  }
}
function mouseReleased(){
  if (arrastrando){ Body.setStatic(arrastrando, false); arrastrando = null; }
}
function doubleClicked(){
  // doble clic sobre una piedra → abrir su página en la wiki (pestaña nueva)
  const p = piedraBajoMouse();
  if (p && p.curso.url) window.open(p.curso.url, "_blank", "noopener");
}
function keyPressed(){
  if (key === " ") sacudir();   // barra espaciadora: sacude las piedras
}
function windowResized(){ resizeCanvas(windowWidth, windowHeight); crearMuros(); }
