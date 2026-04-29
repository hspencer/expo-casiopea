// Watercolour Named
// Variation of 057: each idiosyncratic figure also gets a poetic name suggested
// by visual similarity, written in Playfair Display with a different size, case
// and weight per figure. Names are HTML labels overlaying the canvas, so they
// fade in/out in sync with the brush composition.

// Phase timing.
//
// The "fadeIn" phase is a long entrance shared by figures (snapshot) and
// labels. The snapshot doesn't start fading in until SNAPSHOT_DELAY has
// elapsed, so labels with low delays appear BEFORE the watercolour figures
// start to materialise. This produces an interleaved entrance: text and
// images take turns coming in.
const SNAPSHOT_DELAY = 1600;       // ms before the snapshot starts fading in
const SNAPSHOT_FADE_IN = 5200;     // ms it takes the snapshot to fully appear
const FADE_IN_DURATION = SNAPSHOT_DELAY + SNAPSHOT_FADE_IN; // total entrance
const HOLD_DURATION = 14000;
const FADE_OUT_DURATION = 1800;

// Each label appears on its own clock during the entrance + hold phases.
// Delays are measured from the start of the entrance — so a label with
// delay 0 begins fading in immediately, before the snapshot has appeared.
const LABEL_APPEAR_DELAY_MIN = 0;
const LABEL_APPEAR_DELAY_MAX = FADE_IN_DURATION - 500;
const LABEL_APPEAR_DURATION_MIN = 1500;
const LABEL_APPEAR_DURATION_MAX = 3500;

// Curated typeface palette — each label picks one family and a weight from
// that family's range. Mixing serif and sans creates contrast across labels
// without losing cohesion within a single label.
const FONT_FAMILIES = [
  { family: '"Alegreya", serif',     weights: [400, 500, 600, 700, 800, 900], italics: true  },
  { family: '"EB Garamond", serif',  weights: [400, 500, 600, 700, 800],      italics: true  },
  { family: '"Lexend", sans-serif',  weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], italics: false },
  { family: '"Noticia Text", serif', weights: [400, 700],                      italics: true  }
];

// Rolling window of recently-shown names — never reuse a name from the most
// recent N picks across compositions. With pool ~500 and window ~120, in a
// 5-minute viewing the chance of seeing the same name twice is small.
const RECENT_NAMES_WINDOW = 120;
const recentNames = [];

// Canvas background. Stays constant across all cycles so the transition
// between compositions doesn't flash a different paper colour. The warm
// tones that used to live as `bg` per palette are folded back into each
// palette's `colors` array — they become one more figure colour instead.
const BG_COLOR = "#ffffff";

// Curated colour palettes. Each cycle picks one at random; figures and
// horizons all draw from that single palette so the composition feels
// unified.
//
// Palettes are hand-picked for harmony — references include Hokusai, Klee,
// Rothko, Wes Anderson films, Bauhaus, Le Corbusier polychromy, Frida Kahlo,
// Cy Twombly, William Morris, plus locally-flavoured atmospheres
// (Atacama, Patagonia, Mediterráneo).
//
// The `bg` field below is what used to be the paper colour. It's now
// promoted to a figure colour in PALETTES (see expansion below), while the
// canvas itself stays white.
//
// (Online services that offer curated palette JSON: ColourLovers
// `https://www.colourlovers.com/api/palettes/top?format=json`, Colormind
// `http://colormind.io/api/`, the npm package `nice-color-palettes`. They
// all bring CORS / rate-limit / availability concerns, so we ship a static
// set instead.)
const PALETTES_RAW = [
  { name: "Hokusai",            bg: "#f5ecd9", colors: ["#1b3a64", "#4a6c92", "#8b9bb6", "#c5b186", "#7c3a2d"] },
  { name: "Mar Cantábrico",     bg: "#eef3f4", colors: ["#0e2c3a", "#1b5570", "#3e8989", "#a5c0c4", "#d6c690"] },
  { name: "Granada",            bg: "#f3eee0", colors: ["#8c1f24", "#c97f31", "#e3b450", "#3a5a40", "#0d324d"] },
  { name: "Budapest",           bg: "#fce4d6", colors: ["#d18a99", "#a04668", "#62223a", "#d4af6f", "#3a3744"] },
  { name: "Tenenbaums",         bg: "#f0ead6", colors: ["#a02418", "#dca34a", "#1f3a5f", "#5e7c4e", "#2f2a26"] },
  { name: "Moonrise",           bg: "#e8dabd", colors: ["#a64a2c", "#c08646", "#5b6f47", "#3f5066", "#a3aa9b"] },
  { name: "Rothko",             bg: "#f0e3d0", colors: ["#7d1f1c", "#c34a2a", "#e08a3d", "#3b0c0c", "#9c2b2b"] },
  { name: "Paul Klee",          bg: "#f3ead7", colors: ["#b97a3b", "#3f5a70", "#94604c", "#465d4f", "#cab38c"] },
  { name: "Hilma af Klint",     bg: "#f8f1de", colors: ["#dba48a", "#b3a8c8", "#c2a04a", "#7d8e63", "#3d567a"] },
  { name: "Frida Kahlo",        bg: "#f3e9d2", colors: ["#9d1f3e", "#d3a93f", "#1a4178", "#4a7c4a", "#c25b3f"] },
  { name: "Patagonia",          bg: "#eaeae0", colors: ["#1d2c3a", "#3e5a6c", "#7b8a93", "#cfb88e", "#5a3a26"] },
  { name: "Atacama",            bg: "#efe4d2", colors: ["#7b3a1f", "#c08246", "#deb472", "#374a3e", "#d2c1a2"] },
  { name: "Mediterráneo",       bg: "#f5f1e0", colors: ["#1f3a64", "#3a86a8", "#a3c8d8", "#dba74e", "#a8412c"] },
  { name: "Bauhaus",            bg: "#f4f1ea", colors: ["#c8131e", "#1638a3", "#f7c200", "#1a1a1a", "#7a7a7a"] },
  { name: "Le Corbusier",       bg: "#f0ead8", colors: ["#a04420", "#d8a040", "#264a64", "#5b6042", "#2c2a26"] },
  { name: "Solarized",          bg: "#eee8d5", colors: ["#073642", "#586e75", "#cb4b16", "#b58900", "#268bd2"] },
  { name: "Cinque Terre",       bg: "#f4ead2", colors: ["#c45a3b", "#d99a4a", "#3a76a3", "#7e9b6c", "#7d3a2c"] },
  { name: "Persa",              bg: "#f3e8c7", colors: ["#1d3a72", "#7e1f3d", "#c79b3e", "#a23a2a", "#4d6a3c"] },
  { name: "Cy Twombly",         bg: "#f3ecd9", colors: ["#a06d4a", "#cdaa78", "#8c2a1f", "#2c2a24", "#6f6e58"] },
  { name: "William Morris",     bg: "#eee5cf", colors: ["#3a4f2c", "#7d3a2a", "#c79836", "#1f3a4a", "#a89b6e"] },
  { name: "Tundra",             bg: "#e8eef0", colors: ["#1f3a4a", "#5a7c8a", "#a3a59e", "#c4a474", "#7d3326"] },
  { name: "Ghibli",             bg: "#f1eccf", colors: ["#7da34c", "#3a72a3", "#d8b04a", "#c45a3b", "#3d3128"] },
  { name: "Mondrian",           bg: "#f6f3eb", colors: ["#dc1f1f", "#1b39c0", "#ffd400", "#1a1a1a"] },
  { name: "Vermeer",            bg: "#efe4cf", colors: ["#234d8a", "#a83a2b", "#d6b66a", "#3d4636", "#a3a08e"] },
  { name: "Otoño",              bg: "#f1ebd5", colors: ["#7c2a1a", "#b85a26", "#d99432", "#5e6e3a", "#3d2c1a"] },
  { name: "Invierno nórdico",   bg: "#eef0f0", colors: ["#1f2a3a", "#4a5a72", "#8898a3", "#c2cdd3", "#9d4a3a"] },
  { name: "Textil andino",      bg: "#f3e7c8", colors: ["#7c1a3a", "#b22b4a", "#d99432", "#1f3a4a", "#3a5a3a"] },
  { name: "Polaroid 1973",      bg: "#f0e6cf", colors: ["#a85a3a", "#d99a4a", "#7e9b6c", "#3a5a64", "#a32c4a"] }
];

// Each palette's warm paper tone becomes one more figure colour, while the
// canvas background stays white across every cycle.
const PALETTES = PALETTES_RAW.map(p => ({
  name: p.name,
  colors: [...p.colors, p.bg]
}));

// Active palette (set per cycle in generateComposition). bgColor is kept as
// a let so existing references compile, but it's now a constant white.
let activePalette = PALETTES[0];
let bgColor = BG_COLOR;

const STROKE_BRUSHES = ["2H", "HB", "rotring", "pen"];
const HATCH_BRUSHES = ["marker", "marker2"];

// Tagged name pool, expanded so the same name very rarely surfaces twice in a
// long viewing session. We declare names in semantic groups (cartographic,
// organic, body, tools, …); each group gets a default tag profile and the
// build step deduplicates while merging tags, so a name that appears in
// several groups picks up tags from all of them.
//
// Tag vocabulary (matched against geometric tags from computeShapeTags):
//   horizontal | vertical | compact      — bbox aspect
//   elongated | thin                     — long & narrow
//   spiky | smooth                       — perimeter behaviour
//   indented                             — deep concavity (notch / bay)
//   multi-spike                          — several protrusions
//   large | small                        — bbox area vs canvas
const NAMES = (function buildNames() {
  const map = new Map();
  const add = (names, tags) => {
    for (const n of names) {
      if (!map.has(n)) map.set(n, new Set());
      for (const t of tags) map.get(n).add(t);
    }
  };

  // ── Cartography ─────────────────────────────────────────────────────────

  // Long, narrow, with protrusions — peninsulas, capes, headlands
  add([
    "península", "península seca", "península mayor", "península doble",
    "península del este", "península extranjera", "península de niebla",
    "península del sueño", "península del olvido",
    "cabo", "al fin del cabo", "cabo norte", "cabo sur",
    "cabo de la última hora", "cabo de las tormentas", "cabo escondido",
    "cabo de invierno", "cabo del silencio", "cabo del olvido",
    "cabo de la primera luz",
    "brazo extendido", "espolón", "punta", "punta del olvido",
    "lengua de tierra", "saliente", "morro"
  ], ["horizontal", "elongated", "spiky"]);

  // Thin, very elongated — isthmuses, straits, channels
  add([
    "istmo", "istmo seco", "istmo de los vientos", "el camino",
    "estrecho", "estrecho mayor", "canal", "canal del norte",
    "manga", "derrotero", "aventura", "vena", "filón"
  ], ["thin", "elongated", "horizontal"]);

  // Indented — bays, gulfs, fjords, coves
  add([
    "bahía", "bahía cerrada", "bahía del eco", "bahía del invierno",
    "ensenada", "caleta", "rada", "abrigo", "fondeadero",
    "golfo", "golfo profundo", "golfo del sur", "golfo de las nieblas",
    "fiordo", "fiordo doble", "estuario", "ría", "marisma",
    "vado", "rambla"
  ], ["indented", "horizontal"]);

  // Multiple protrusions — deltas, archipelagoes, ranges
  add([
    "delta", "delta seco", "delta del recuerdo", "delta de la noche",
    "delta del nilo",
    "archipiélago", "friendship", "archipiélago del sur",
    "archipiélago de singularidades",
    "constelación de islas", "rosario de islas",
    "cordillera", "cordillera baja", "cordillera del fin",
    "cordillera del recuerdo", "cordillera del aire",
    "sierra", "sierra dentada"
  ], ["multi-spike", "spiky", "horizontal"]);

  // Compact — islands, regions, lands
  add([
    "isla", "isla menor", "isla seca", "isla mayor", "isla del olivo",
    "isla en el aire", "isla a la deriva", "isla del sueño", "isla del fin",
    "isla del eco", "isla nueva",
    "atolón", "islote", "peñasco insular",
    "región", "región interior", "región austral", "región del crepúsculo",
    "comarca", "comarca seca",
    "territorio", "territorio nuevo",
    "tierra firme", "tierra incógnita", "tierra del fin", "tierra del medio",
    "tierra de nadie", "tierra del eco", "tierra ignota",
    "gentes sin nombre", "país austral", "país antiguo", "país del este",
    "país del medio", "país menor"
  ], ["compact"]);

  // Larger compact — continents, mantles
  add([
    "continente", "continente perdido", "continente austral",
    "continente menor"
  ], ["large", "compact"]);

  // Long flat horizontal — coasts, shores, edges
  add([
    "costa", "costa oeste", "costa este", "costa rota", "costa larga",
    "costa de niebla",
    "litoral", "litoral menor", "litoral roto", "litoral de la vigilia",
    "litoral del sueño",
    "ribera", "ribera larga", "ribera doble",
    "playa", "playa larga", "playa del fin",
    "horizonte", "horizonte bajo",
    "borde", "orilla", "margen"
  ], ["horizontal", "elongated"]);

  // Plateaus, smooth elevations
  add([
    "meseta", "meseta alta", "meseta seca", "altiplano",
    "llanura", "estepa", "pampa", "sabana", "tundra",
    "páramo", "yermo"
  ], ["horizontal", "smooth", "large"]);

  // Mountains, hills — compact spiky
  add([
    "monte", "monte alto", "cerro", "cerro pelado", "colina",
    "loma", "loma incierta", "lomada",
    "pináculo", "montaña", "cumbre", "cima", "mogote", "portezuelo",
    "cabezo", "alto"
  ], ["compact", "spiky"]);

  // Smooth dunes
  add([
    "duna", "duna larga", "médano", "loma suave",
    "ondulación", "lomilla"
  ], ["horizontal", "smooth"]);

  // Valleys, indentations on land
  add([
    "valle", "valle ciego", "valle alto", "valle seco",
    "cañón", "cañón seco", "garganta", "barranco", "quebrada",
    "depresión", "hondonada", "fosa terrestre"
  ], ["indented", "horizontal"]);

  // Cracks, slits — thin, indented
  add([
    "grieta", "grieta seca", "fisura", "hendidura", "raja",
    "fractura", "falla", "diaclasa"
  ], ["thin", "indented", "elongated"]);

  // ── Organic / animal silhouettes ────────────────────────────────────────

  // Birds, wings
  add([
    "ave", "ave nocturna", "ave de paso", "pájaro", "pajarillo",
    "gaviota", "halcón", "cuervo", "lechuza", "garza", "pelícano",
    "paloma", "gorrión", "golondrina", "águila", "albatros", "cormorán",
    "ala", "ala rota", "ala plegada", "alón"
  ], ["horizontal", "spiky"]);

  // Fish & sea creatures, elongated
  add([
    "pez", "pez espada", "pez luna", "pez austral",
    "salmón", "atún", "anguila", "lamprea", "sardina", "bonito",
    "delfín", "ballena", "tiburón", "raya", "lisa"
  ], ["horizontal", "elongated"]);

  // Long, smooth — feathers, tongues, tubers
  add([
    "pluma", "pluma larga", "lengua", "lengua larga",
    "tubérculo", "raíz tendida"
  ], ["elongated", "smooth"]);

  // Branched — multi-spike
  add([
    "rama", "ramaje", "ramo", "ramazón", "follaje",
    "raíz", "raíz profunda", "micelio", "raíz aérea", "rizoma",
    "asta", "cornamenta"
  ], ["spiky", "multi-spike"]);

  // Tree-like, vertical
  add([
    "tronco", "tronco caído", "leño", "tocón",
    "estela", "menhir"
  ], ["elongated"]);

  // Compact organic
  add([
    "fruto", "fruto extraño", "fruto maduro", "fruto seco",
    "semilla", "pepita", "vaina", "drupa",
    "huevo", "ovillo", "madeja",
    "guijarro", "canto rodado", "esquirla",
    "brote", "yema", "cápsula"
  ], ["compact", "smooth"]);

  // Compact spiky organic
  add([
    "cabeza de león", "cabeza de gallo", "cabeza de toro",
    "espinal", "abrojo", "cardo", "ortiga",
    "tótem"
  ], ["compact", "spiky"]);

  // Long thin organic
  add([
    "hueso", "fémur", "costilla", "espinilla",
    "espina dorsal", "vértebra"
  ], ["elongated", "thin"]);

  // Smooth horizontal — clouds, smoke, water
  add([
    "nube", "nube alta", "nube oscura", "cirro", "cúmulo", "estratos",
    "humo", "humo lento", "vaho", "vapor", "neblina",
    "manto de niebla", "manto de polvo", "estela",
    "ola", "ola quieta", "marea", "oleaje"
  ], ["horizontal", "smooth"]);

  // Cloud-like compact
  add([
    "espuma", "burbujeo", "salpicadura", "rocío",
    "nubarrón", "halo", "aureola"
  ], ["compact", "smooth"]);

  // Vertical thin
  add([
    "vela", "torre", "atalaya", "pilar", "obelisco",
    "pluma vertical", "espiga"
  ], ["vertical", "elongated"]);

  // Vertical indented — abysses, openings
  add([
    "abismo", "fosa", "sima", "pozo",
    "ranura", "ojal"
  ], ["indented", "vertical"]);

  // Horizontal indented — bays, mouths
  add([
    "boca", "boca de río", "boca abierta", "boca del cielo",
    "muesca", "mella", "escotadura", "entrante"
  ], ["indented"]);

  // Compact indented — masks, vessels
  add([
    "máscara", "máscara antigua", "careta", "antifaz",
    "cuenco", "vasija", "tazón", "copa", "ánfora", "urna",
    "cazo", "caldero", "morrión",
    "huella", "umbral", "umbral del sueño"
  ], ["indented", "compact"]);

  // Eyes — small compact
  add([
    "ojo", "tú quien lee", "estamos aquí", "iris", "pupila",
    "anillo", "argolla", "aro", "ojete"
  ], ["compact", "small"]);

  // Stars / radial
  add([
    "estrella", "almendra", "luminaria", "constelación",
    "espinario", "rosa de los vientos"
  ], ["spiky", "multi-spike"]);

  // Comets, arrows
  add([
    "cometa", "errante",
    "saeta", "flecha"
  ], ["spiky", "elongated"]);

  // Sharp character
  add([
    "perfil de roca", "macro formas", "dientes", "colmillos",
    "cuerno", "púa", "garra"
  ], ["spiky"]);

  // Smooth, large
  add([
    "manto", "manto extenso", "manto de seda", "tapiz",
    "alfombra", "lienzo", "paño"
  ], ["smooth", "large"]);

  // Movement / abstract
  add([
    "remolino", "torbellino", "espiral", "vorágine", "vórtice",
    "voluta"
  ], ["compact"]);

  // ── Body silhouettes ─────────────────────────────────────────────────────
  add([
    "cuerpo", "cuerpo doblado", "cuerpo en reposo",
    "torso", "espalda", "perfil humano",
    "pierna", "muslo", "rodilla doblada", "codo",
    "puño", "mano", "mano cerrada", "palma", "dedo", "dedo índice",
    "pie", "talón",
    "mano del viento", "mano que duda"
  ], ["compact"]);

  // ── Tools / artefacts ────────────────────────────────────────────────────
  add([
    "hacha", "cuchillo", "espada", "lanza", "escudo", "yelmo",
    "casco", "bastón", "vara",
    "abanico", "peine", "llave", "anzuelo", "ancla",
    "péndulo", "balanza", "lupa", "espejo", "telescopio",
    "barco", "barca", "canoa", "balsa"
  ], ["compact"]);

  // ── Plants / flora ───────────────────────────────────────────────────────
  add([
    "flor", "pétalo", "corola", "bulbo", "tallo",
    "espiga", "mazorca", "fronda", "helecho", "musgo", "liquen",
    "hongo", "seta", "amanita", "boletus"
  ], ["compact"]);

  // ── Poetic compounds (geographic) ───────────────────────────────────────
  add([
    "espalda del río", "pliegue del aire", "huella del agua",
    "sombra del agua", "tronco del cielo", "rama del río",
    "manto de nube", "espuma del tiempo", "lengua de fuego"
  ], []);

  // ── Abstract concepts ───────────────────────────────────────────────────
  // Mostly tag-less, so they can match any silhouette when no concrete name
  // scores well. A few keep soft hints where the concept has a shape feel
  // (anclaje is compact and grounded, fuga / deriva read as elongated, etc.).

  add([
    "la libertad", "la duda", "la calma", "la inquietud",
    "la memoria", "el olvido", "la espera", "el reposo",
    "el silencio", "la ausencia", "la presencia",
    "lo posible", "lo probable", "lo incierto",
    "lo aparente", "lo otro", "lo mismo", "lo ajeno", "lo familiar",
    "lo extraño", "lo dado", "lo pendiente",
    "concepto difuso", "noción vaga", "intuición", "atisbo", "asomo",
    "evidencia tenue", "huella conceptual", "casi presencia",
    "casi ausencia", "aproximación lejana",
    "suspenso furtivo", "suspenso",
    "intermedio", "intersticio", "instante",
    "vacilación", "indecisión", "vaivén",
    "umbral mental", "umbral del sueño",
    "el después", "la víspera", "el preludio",
    "fragmento", "indicio", "señal débil"
  ], []);

  // Abstract — anchored, sat, compact concepts
  add([
    "anclaje", "anclaje incierto", "asentamiento", "estancia",
    "punto fijo", "fundamento", "base", "asiento"
  ], ["compact"]);

  // Abstract — flight, drift, escape (elongated horizontal)
  add([
    "fuga", "deriva", "tránsito", "éxodo", "desvío", "salida",
    "trayecto", "trayecto incierto"
  ], ["horizontal", "elongated"]);

  // Abstract — limit, edge, threshold (elongated)
  add([
    "límite", "límite blando", "frontera", "linde",
    "borde mental", "borde del pensamiento"
  ], ["horizontal", "elongated"]);

  // Abstract — voids, hollows, gaps (indented)
  add([
    "vacío", "el vacío", "hueco", "oquedad",
    "laguna mental", "vacancia", "blanco"
  ], ["indented"]);

  // Abstract — suspension, hanging (vertical)
  add([
    "suspensión", "péndulo conceptual", "colgadura", "pendencia"
  ], ["vertical"]);

  // ── Generic / safety net ────────────────────────────────────────────────
  add([
    "rastro", "rastro perdido",
    "sombra", "sombra extraña", "silueta", "perfil",
    "marca", "marca antigua",
    "esbozo", "trazo", "garabato", "borrón",
    "pliegue", "voluta menor"
  ], []);

  // Convert the merged Map into the {name, tags} array used by the matcher.
  return [...map].map(([name, tagSet]) => ({ name, tags: [...tagSet] }));
})();

let figures = [];
let horizons = [];
let phase = "render"; // "render" | "fadeIn" | "hold" | "fadeOut"
let phaseStart = 0;
let cycleStart = 0;   // when the entrance (fadeIn) phase began — labels time off this
let snapshot = null;

let labelEls = [];
let labelsContainer = null;

function setup() {
  const w = document.body.clientWidth;
  const h = floor(w * 2 / 3);
  createCanvas(w, h, WEBGL);
  angleMode(DEGREES);
  pixelDensity(1);
  imageMode(CORNER);

  labelsContainer = document.getElementById("labels");
  sizeLabelContainer();

  generateComposition();
  rebuildLabels();
  phase = "render";
  phaseStart = millis();
}

function windowResized() {
  const w = document.body.clientWidth;
  const h = floor(w * 2 / 3);
  resizeCanvas(w, h, WEBGL);
  sizeLabelContainer();
  generateComposition();
  rebuildLabels();
  snapshot = null;
  phase = "render";
  phaseStart = millis();
}

function mouseClicked() {
  generateComposition();
  rebuildLabels();
  snapshot = null;
  phase = "render";
  phaseStart = millis();
}

function sizeLabelContainer() {
  if (!labelsContainer) return;
  labelsContainer.style.width = width + "px";
  labelsContainer.style.height = height + "px";
}

function draw() {
  if (phase === "render") {
    renderCompositionToCanvas();
    snapshot = get();
    blendMode(BLEND);
    background(bgColor);
    phase = "fadeIn";
    phaseStart = millis();
    setAllLabelOpacity(0);
    return;
  }

  const t = millis() - phaseStart;
  let opacity = 1;

  if (phase === "fadeIn") {
    opacity = constrain(t / FADE_IN_DURATION, 0, 1);
    if (t >= FADE_IN_DURATION) {
      phase = "hold";
      phaseStart = millis();
    }
  } else if (phase === "hold") {
    opacity = 1;
    if (t >= HOLD_DURATION) {
      phase = "fadeOut";
      phaseStart = millis();
    }
  } else if (phase === "fadeOut") {
    opacity = 1 - constrain(t / FADE_OUT_DURATION, 0, 1);
    if (t >= FADE_OUT_DURATION) {
      generateComposition();
      rebuildLabels();
      snapshot = null;
      phase = "render";
      phaseStart = millis();
      setAllLabelOpacity(0);
      return;
    }
  }

  const eased = easeInOut(opacity);

  background(bgColor);
  if (snapshot) {
    push();
    translate(-width / 2, -height / 2);
    tint(255, 255 * eased);
    image(snapshot, 0, 0, width, height);
    noTint();
    pop();
  }

  updateLabelOpacities(eased, phase, t);
}

function updateLabelOpacities(globalOpacity, currentPhase, phaseT) {
  for (let i = 0; i < labelEls.length; i++) {
    const el = labelEls[i];
    const lab = figures[i].label;
    let op;
    if (currentPhase === "render" || currentPhase === "fadeIn") {
      // Labels stay hidden while the brush composition fades in.
      op = 0;
    } else if (currentPhase === "hold") {
      const dt = phaseT - lab.appearDelay;
      if (dt <= 0) {
        op = 0;
      } else {
        const u = constrain(dt / lab.appearDuration, 0, 1);
        // ease-out: starts fast, settles smoothly
        op = 1 - pow(1 - u, 2);
      }
    } else if (currentPhase === "fadeOut") {
      // All labels fade out together with the composition.
      op = globalOpacity;
    } else {
      op = 0;
    }
    el.style.opacity = op;
  }
}

function setAllLabelOpacity(o) {
  for (const el of labelEls) {
    el.style.opacity = o;
  }
}

function renderCompositionToCanvas() {
  background(bgColor);
  push();
  translate(-width / 2, -height / 2);
  blendMode(MULTIPLY);
  brush.field("seabed");

  for (const h of horizons) {
    brush.set(h.brushName, h.color, h.weight);
    brush.spline(h.points, h.curvature);
  }
  brush.noStroke();

  for (const fig of figures) {
    drawFigure(fig);
  }
  blendMode(BLEND);
  pop();
}

function easeInOut(x) {
  return x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2;
}

// -----------------------------------------------------------------------------
// Composition: a horizontal row of figures, free to overlap.

function generateComposition() {
  // Pick a curated palette for this cycle. The canvas background stays
  // white (BG_COLOR) so cycle transitions don't flash a different paper.
  activePalette = random(PALETTES);

  horizons = buildHorizons();

  figures = [];
  const count = floor(random(5, 10));
  const baseY = height * random(0.45, 0.55);
  const cellW = width / count;

  const usedNames = new Set();

  for (let i = 0; i < count; i++) {
    const cx = cellW * (i + 0.5) + random(-cellW * 0.35, cellW * 0.35);
    const cy = baseY + random(-height * 0.12, height * 0.12);
    const size = cellW * random(0.55, 1.1);

    const fig = buildFigure(cx, cy, size);
    fig.cx = cx;
    fig.cy = cy;
    fig.size = size;

    // Shape-aware naming: read the actual outline, choose a name whose tag
    // profile best matches the figure's geometric character.
    fig.shapeTags = computeShapeTags(fig.verts);
    fig.name = pickNameForTags(fig.shapeTags, usedNames);
    usedNames.add(fig.name);

    fig.label = buildLabelStyle(fig);

    figures.push(fig);
  }
}

// -----------------------------------------------------------------------------
// Shape analysis → tag set, used to pick a name that "knows the form".

function computeShapeTags(verts) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  let cx = 0, cy = 0;
  for (const v of verts) {
    if (v[0] < minx) minx = v[0];
    if (v[0] > maxx) maxx = v[0];
    if (v[1] < miny) miny = v[1];
    if (v[1] > maxy) maxy = v[1];
    cx += v[0];
    cy += v[1];
  }
  cx /= verts.length;
  cy /= verts.length;

  const w = maxx - minx;
  const h = maxy - miny;
  const aspect = w / max(h, 1);

  const dists = verts.map(v => sqrt((v[0] - cx) ** 2 + (v[1] - cy) ** 2));
  const maxD = Math.max(...dists);
  const minD = Math.min(...dists);
  const meanD = dists.reduce((a, b) => a + b, 0) / dists.length;
  const variance =
    dists.reduce((a, d) => a + (d - meanD) ** 2, 0) / dists.length;
  const stdD = sqrt(variance);

  const spikiness = maxD / max(meanD, 0.01);
  const indent = meanD / max(minD, 0.01);
  const cv = stdD / max(meanD, 0.01); // irregularity

  // Count vertices that protrude well past the average — multiple spikes.
  const spikeCount = dists.filter(d => d > meanD + stdD * 0.7).length;

  const tags = [];

  // Aspect / orientation
  if (aspect > 1.55) tags.push("horizontal");
  else if (aspect < 0.65) tags.push("vertical");
  else tags.push("compact");

  // Elongation (long & narrow, regardless of orientation)
  const longSide = max(w, h);
  const shortSide = max(min(w, h), 1);
  if (longSide / shortSide > 2.2) tags.push("elongated");
  if (shortSide / longSide < 0.32) tags.push("thin");

  // Spikiness / smoothness
  if (spikiness > 1.7 || cv > 0.32) tags.push("spiky");
  else if (spikiness < 1.3 && cv < 0.18) tags.push("smooth");

  // Concavity / indentation (some vertices much closer than mean)
  if (indent > 1.9) tags.push("indented");

  // Multiple protrusions
  if (spikeCount >= 3) tags.push("multi-spike");

  // Size relative to canvas
  const areaFrac = (w * h) / (width * height);
  if (areaFrac > 0.06) tags.push("large");
  else if (areaFrac < 0.012) tags.push("small");

  return tags;
}

function pickNameForTags(tags, used) {
  // First pass: respect both the in-composition Set and the cross-cycle
  // recent-window. If that yields nothing, drop the recent-window constraint.
  let pick =
    pickBestMatching(tags, used, /* honourRecent */ true) ||
    pickBestMatching(tags, used, /* honourRecent */ false);

  if (!pick) {
    // Last-ditch fallback: any unused name.
    const remaining = NAMES.filter(e => !used.has(e.name));
    pick = random(remaining);
  }

  // Track in the rolling window so we won't repeat soon.
  recentNames.push(pick.name);
  if (recentNames.length > RECENT_NAMES_WINDOW) recentNames.shift();

  return pick.name;
}

function pickBestMatching(tags, used, honourRecent) {
  let bestScore = -1;
  let bestList = [];
  for (const entry of NAMES) {
    if (used.has(entry.name)) continue;
    if (honourRecent && recentNames.includes(entry.name)) continue;
    let score = 0;
    for (const t of entry.tags) if (tags.includes(t)) score++;
    // Soft penalty for tags the name has but figure doesn't.
    const mismatch = entry.tags.length - score;
    const adjusted = score * 2 - mismatch * 0.5;

    if (adjusted > bestScore) {
      bestScore = adjusted;
      bestList = [entry];
    } else if (adjusted === bestScore) {
      bestList.push(entry);
    }
  }
  return bestList.length ? random(bestList) : null;
}

function buildLabelStyle(fig) {
  // Vary family, weight, size, italic, case and rotation per figure so the
  // type plays alongside the figure rather than repeating itself.
  const sizes = [16, 20, 26, 34, 42, 52, 64];
  const cases = ["upper", "lower", "title", "as-is"];

  const family = random(FONT_FAMILIES);
  const weight = random(family.weights);
  const italic = family.italics && random() < 0.3;

  // Position the label near the figure's centre, with an offset so it doesn't
  // sit dead-on the centroid every time.
  const offX = random(-fig.size * 0.25, fig.size * 0.25);
  const offY = random(-fig.size * 0.55, fig.size * 0.55);

  return {
    fontFamily: family.family,
    fontSize: random(sizes),
    fontWeight: weight,
    italic,
    caseTransform: random(cases),
    letterSpacing: random() < 0.4 ? random(0.04, 0.18) : 0,
    rotation: random() < 0.18 ? random(-6, 6) : 0,
    x: fig.cx + offX,
    y: fig.cy + offY,
    // Each label appears on its own clock during the entrance + hold phases.
    appearDelay: random(LABEL_APPEAR_DELAY_MIN, LABEL_APPEAR_DELAY_MAX),
    appearDuration: random(LABEL_APPEAR_DURATION_MIN, LABEL_APPEAR_DURATION_MAX)
  };
}

function applyCase(s, t) {
  if (t === "upper") return s.toUpperCase();
  if (t === "lower") return s.toLowerCase();
  if (t === "title") {
    return s.replace(/\b([\p{L}])([\p{L}]*)/gu, (_, a, rest) => a.toUpperCase() + rest.toLowerCase());
  }
  return s;
}

function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function rebuildLabels() {
  if (!labelsContainer) return;
  while (labelsContainer.firstChild) {
    labelsContainer.removeChild(labelsContainer.firstChild);
  }
  labelEls = new Array(figures.length);

  // Pass 1: build elements with their type styles, append off-screen so we can
  // measure the rendered bounding box (rotation included via getBoundingClientRect).
  const items = [];
  for (let i = 0; i < figures.length; i++) {
    const fig = figures[i];
    const lab = fig.label;
    const el = document.createElement("div");
    el.className = "label";
    el.textContent = applyCase(fig.name, lab.caseTransform);
    el.style.fontFamily = lab.fontFamily;
    el.style.fontSize = lab.fontSize + "px";
    el.style.fontWeight = lab.fontWeight;
    el.style.fontStyle = lab.italic ? "italic" : "normal";
    el.style.letterSpacing = lab.letterSpacing + "em";
    el.style.setProperty("--r", lab.rotation + "deg");
    el.style.left = "-10000px";
    el.style.top = "-10000px";
    labelsContainer.appendChild(el);
    const r = el.getBoundingClientRect();
    items.push({ index: i, fig, el, w: r.width, h: r.height });
  }

  // Pass 2: place largest labels first (more constrained), then fill in
  // smaller ones around them. Each placement is clamped so the full bbox lies
  // inside the canvas (no truncation), and a spiral search around the ideal
  // position avoids overlapping any previously-placed label.
  const placementOrder = items.slice().sort((a, b) => b.w * b.h - a.w * a.h);
  const placed = [];
  const margin = 6;
  const gap = 4;
  for (const it of placementOrder) {
    const ideal = { x: it.fig.label.x, y: it.fig.label.y };
    const spot = findFreeSpot(ideal, it.w, it.h, placed, margin, gap);
    it.el.style.left = spot.x + "px";
    it.el.style.top = spot.y + "px";
    placed.push({ x: spot.x, y: spot.y, w: it.w, h: it.h });
  }

  // Pass 3: keep labelEls aligned with figures[] order so the per-label
  // appearDelay/appearDuration apply to the right element.
  for (const it of items) {
    labelEls[it.index] = it.el;
  }
}

function findFreeSpot(ideal, w, h, placed, margin, gap) {
  const minX = margin + w / 2;
  const maxX = width - margin - w / 2;
  const minY = margin + h / 2;
  const maxY = height - margin - h / 2;

  // If the label is wider/taller than the canvas there's nothing to do but
  // park it in the middle. (Shouldn't happen with current font sizes.)
  if (maxX < minX || maxY < minY) {
    return { x: width / 2, y: height / 2 };
  }

  const clamp = p => ({
    x: constrain(p.x, minX, maxX),
    y: constrain(p.y, minY, maxY)
  });

  // Try the figure's ideal position first.
  const start = clamp(ideal);
  if (!collidesAny(start, w, h, placed, gap)) return start;

  // Spiral outward from ideal using the golden angle for nice coverage.
  const goldAngle = (137.508 * Math.PI) / 180;
  const stepBase = max(6, h * 0.35);
  for (let i = 1; i <= 600; i++) {
    const radius = sqrt(i) * stepBase;
    const angle = i * goldAngle;
    const p = clamp({
      x: ideal.x + Math.cos(angle) * radius,
      y: ideal.y + Math.sin(angle) * radius
    });
    if (!collidesAny(p, w, h, placed, gap)) return p;
  }

  // Random sampling fallback.
  for (let i = 0; i < 300; i++) {
    const p = { x: random(minX, maxX), y: random(minY, maxY) };
    if (!collidesAny(p, w, h, placed, gap)) return p;
  }

  // Truly couldn't find a clear spot; clamp to the canvas at least.
  return start;
}

function collidesAny(p, w, h, placed, gap) {
  for (const r of placed) {
    if (
      Math.abs(p.x - r.x) * 2 < w + r.w + gap * 2 &&
      Math.abs(p.y - r.y) * 2 < h + r.h + gap * 2
    ) {
      return true;
    }
  }
  return false;
}

function buildHorizons() {
  const lines = [];
  const n = floor(random(2, 5));
  for (let i = 0; i < n; i++) {
    const y = height * random(0.18, 0.88);
    const amp = random(height * 0.015, height * 0.06);
    const seed = random(10000);
    const freq = random(0.004, 0.012);
    const step = max(12, width / 80);
    const points = [];
    for (let x = -20; x <= width + 20; x += step) {
      const yy = y + (noise(seed + x * freq) - 0.5) * amp * 2;
      points.push([x, yy]);
    }
    lines.push({
      points,
      brushName: random(STROKE_BRUSHES),
      color: random(activePalette.colors),
      weight: random(0.4, 1.3),
      curvature: random(0.3, 0.7)
    });
  }
  return lines;
}

function buildFigure(cx, cy, size) {
  const n = floor(random(5, 11));
  const rx = size * random(0.5, 0.9);
  const ry = size * random(0.4, 0.85);
  const rot = random(0, 360);

  const rawAngles = [];
  for (let i = 0; i < n; i++) {
    rawAngles.push(rot + (i / n) * 360 + random(-40, 40));
  }
  rawAngles.sort((a, b) => a - b);

  const anchors = [];
  for (let i = 0; i < n; i++) {
    const a = rawAngles[i];
    let r;
    const roll = random();
    if (roll < 0.28) {
      r = random(1.8, 3.2);
    } else if (roll < 0.45) {
      r = random(0.2, 0.45);
    } else {
      r = random(0.6, 1.1);
    }
    anchors.push({
      x: cx + cos(a) * rx * r,
      y: cy + sin(a) * ry * r,
      arc: random() < 0.22,
      bulge: random([-1, 1]) * random(0.08, 0.4)
    });
  }

  return {
    verts: sampleOutline(anchors),
    style: randomStyle()
  };
}

function sampleOutline(anchors) {
  const out = [];
  const n = anchors.length;
  for (let i = 0; i < n; i++) {
    const a = anchors[i];
    const b = anchors[(i + 1) % n];
    if (a.arc) {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const k = a.bulge * len;
      const ccx = mx + nx * k;
      const ccy = my + ny * k;

      const samples = 16;
      for (let s = 0; s < samples; s++) {
        const u = s / samples;
        const x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * ccx + u * u * b.x;
        const y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * ccy + u * u * b.y;
        out.push([x, y]);
      }
    } else {
      out.push([a.x, a.y]);
    }
  }
  return out;
}

function randomStyle() {
  const variant = random([
    "fill",
    "fill-stroke",
    "stroke",
    "hatch",
    "hatch-stroke",
    "fill-hatch"
  ]);

  return {
    variant,
    fillColor: random(activePalette.colors),
    fillOpacity: random(55, 100),
    bleed: random(0.08, 0.35),
    fillTextureStrength: random(0.4, 0.8),
    fillBorderStrength: random(0.3, 0.9),

    strokeBrush: random(STROKE_BRUSHES),
    strokeColor: random(activePalette.colors),
    strokeWeight: random(0.6, 1.6),

    hatchBrush: random(HATCH_BRUSHES),
    hatchColor: random(activePalette.colors),
    hatchDistance: random(1.8, 6),
    hatchAngle: random(0, 180)
  };
}

function drawFigure(fig) {
  const s = fig.style;

  brush.noFill();
  brush.noStroke();
  brush.noHatch();

  if (s.variant === "fill" || s.variant === "fill-stroke" || s.variant === "fill-hatch") {
    brush.fill(s.fillColor, s.fillOpacity);
    brush.bleed(s.bleed);
    brush.fillTexture(s.fillTextureStrength, s.fillBorderStrength);
  }

  if (s.variant === "stroke" || s.variant === "fill-stroke" || s.variant === "hatch-stroke") {
    brush.set(s.strokeBrush, s.strokeColor, s.strokeWeight);
  }

  if (s.variant === "hatch" || s.variant === "hatch-stroke" || s.variant === "fill-hatch") {
    brush.setHatch(s.hatchBrush, s.hatchColor);
    brush.hatch(s.hatchDistance, s.hatchAngle, {
      rand: 0.2,
      continuous: false,
      gradient: false
    });
  }

  brush.beginShape(0);
  for (const v of fig.verts) {
    brush.vertex(v[0], v[1], 1);
  }
  brush.endShape(CLOSE);

  brush.noFill();
  brush.noStroke();
  brush.noHatch();
}
