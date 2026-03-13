/**
 * haiku.js — Compositor de haiku a partir de titulares
 *
 * Dos motores disponibles:
 * 1. IA (Grok/xAI): Envía el titular a la API y recibe un haiku creativo
 * 2. Algorítmico (fallback): Recompone palabras del titular por conteo silábico
 *
 * El motor de IA se intenta primero; si falla, se usa el algorítmico.
 * Se usa en sketch.js para generar el haiku mostrado en el canvas.
 */

const Haiku = (function () {

  // ── Configuración de la API de Grok (xAI) ──
  const GROK_MODEL = "grok-3-mini-fast";

  // URLs de proxy en orden de prioridad:
  // 1. Netlify Function (producción — detecta automáticamente el dominio)
  // 2. Proxy local Node.js (desarrollo)
  const PROXY_URLS = [
    "/.netlify/functions/haiku",
    "http://localhost:3001/haiku"
  ];

  // Prompt del sistema para generar haiku
  const SYSTEM_PROMPT = `Eres Matsuo Bashō reencarnado, escribiendo en español. Tu arte: recibir un titular de noticias —violento, apocalíptico, desolador— y destilarlo en un haiku que revele lo sagrado escondido en la catástrofe.

POÉTICA:
- El haiku no consuela ni moraliza. Observa. Encuentra el instante de belleza dentro del horror, como una flor en un campo de batalla.
- Prefiere lo concreto a lo abstracto: una imagen precisa vale más que un sentimiento nombrado. No digas "esperanza", muestra el brote verde entre las cenizas.
- Usa la naturaleza como espejo: estaciones, agua, luz, animales, viento. El mundo natural comenta la tragedia humana sin juzgarla.
- Busca el "kireji" (corte): que entre el segundo y tercer verso haya un giro, un salto, una sorpresa silenciosa.
- Cada palabra debe pesar. Elimina todo lo que sobre.

MÉTRICA ESTRICTA:
- Exactamente 3 versos: 5 sílabas / 7 sílabas / 5 sílabas (conteo silábico español).
- Cuenta con cuidado los diptongos (cie-lo = 2 sílabas) y los hiatos (rí-o = 2 sílabas).

RESTRICCIÓN CLAVE:
- Debes reutilizar al menos 2 palabras del titular original, transformando su carga negativa en otra cosa.

FORMATO:
- Responde SOLO con los 3 versos, uno por línea.
- Sin puntuación al final de los versos. Sin comillas. Sin título. Sin explicación.
- Todo en minúsculas.`;

  // ── Motor de IA (Grok) ──

  /**
   * hacerFetch — intenta conectar a Grok probando los proxies en orden:
   * primero el Cloudflare Worker (producción), luego el proxy local (dev).
   * Ninguno requiere Authorization en el header porque ambos lo agregan.
   * Timeout de 15 segundos por intento.
   *
   * @param {string} titular - el titular apocalíptico
   * @returns {Promise<Object|null>} respuesta JSON de Grok o null si falla
   */
  async function hacerFetch(titular) {
    const payload = JSON.stringify({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: titular }
      ],
      model: GROK_MODEL,
      stream: false,
      temperature: 0.9
    });

    for (let i = 0; i < PROXY_URLS.length; i++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const resp = await fetch(PROXY_URLS[i], {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (resp.ok) {
          console.log("Grok conectó via proxy #" + i + ": " + PROXY_URLS[i]);
          return await resp.json();
        }
        console.log("Proxy #" + i + " respondió " + resp.status);
      } catch (e) {
        console.log("Proxy #" + i + " no disponible: " + e.message);
      }
    }
    console.log("Ningún proxy disponible — usando motor algorítmico");
    return null;
  }

  async function componerConGrok(titular) {
    try {
      const data = await hacerFetch(titular);
      if (!data) return null;

      const texto = data.choices[0].message.content.trim();
      const lineas = texto.split("\n").map(l => l.trim()).filter(l => l.length > 0);

      if (lineas.length >= 3) {
        console.log("Haiku de Grok:", lineas[0], "/", lineas[1], "/", lineas[2]);
        return {
          versos: [lineas[0], lineas[1], lineas[2]],
          metrica: lineas.slice(0, 3).map(v => Silabas.contarSilabasFrase(v)),
          titular: titular,
          motor: "grok"
        };
      }

      console.log("Grok formato inesperado:", texto);
      return null;

    } catch (e) {
      console.log("componerConGrok error:", e.message);
      return null;
    }
  }

  // ── Motor algorítmico (fallback) ──

  // Palabras poéticas que pueden insertarse como puente
  // Agrupadas por número de sílabas para facilitar la búsqueda
  const PUENTE = {
    1: ["luz", "sol", "mar", "paz", "voz", "flor", "sur", "fin", "ser", "ver"],
    2: ["alba", "luna", "agua", "cielo", "sueño", "brisa", "calma", "piedra",
        "nieve", "fuego", "río", "noche", "canto", "aire", "vuelo", "alma",
        "ola", "rama", "tarde", "monte", "tierra"],
    3: ["silencio", "camino", "estrella", "latido", "espuma", "ceniza",
        "destello", "ternura", "raíces", "aurora", "misterio", "suspiro",
        "reflejo", "sendero", "murmullo", "rocío", "marea"],
    4: ["amanecer", "horizonte", "mariposa", "primavera", "despertando",
        "armonía", "melodía", "universo", "renaciendo", "floreciendo"]
  };

  const DESCARTABLES = new Set([
    "el", "la", "los", "las", "un", "una", "unos", "unas",
    "de", "del", "al", "a", "en", "por", "para", "con",
    "y", "o", "e", "u", "que", "se", "su", "sus",
    "es", "son", "ha", "han", "fue", "más", "muy",
    "este", "esta", "esto", "ese", "esa", "eso",
    "como", "pero", "sino", "ni", "ya", "no",
    "según", "tras", "ante", "sobre", "entre"
  ]);

  const POETICAS = new Set([
    "muerte", "vida", "guerra", "paz", "fuego", "agua", "tierra", "aire",
    "lluvia", "sol", "luna", "noche", "día", "sombra", "luz",
    "sangre", "dolor", "miedo", "caos", "ruina", "ceniza",
    "esperanza", "sueño", "silencio", "grito", "olvido",
    "mundo", "cielo", "mar", "río", "monte", "bosque",
    "hambre", "sed", "frío", "calor", "viento", "tormenta",
    "rayo", "temblor", "humo", "llama", "onda", "eco"
  ]);

  /**
   * limpiarPalabra — normaliza una palabra quitando puntuación
   */
  function limpiarPalabra(p) {
    return p.replace(/[.,;:!?¿¡"'()\[\]{}—–\-]/g, "").trim().toLowerCase();
  }

  /**
   * puntuacionPoetica — asigna un puntaje a cada palabra
   * Las palabras poéticas valen más, las descartables valen menos.
   */
  function puntuacionPoetica(palabra) {
    let p = limpiarPalabra(palabra);
    if (DESCARTABLES.has(p)) return 0;
    if (POETICAS.has(p)) return 10;
    return Math.min(p.length, 6);
  }

  /**
   * intentarVerso — intenta construir un verso de N sílabas
   * usando backtracking con límite de iteraciones para evitar freezes.
   *
   * @param {Array} palabrasDisponibles
   * @param {number} silabasObjetivo
   * @param {Set} usadas - índices ya usados
   * @returns {Array|null} índices de palabras seleccionadas, o null
   */
  function intentarVerso(palabrasDisponibles, silabasObjetivo, usadas) {
    let mejor = null;
    let iteraciones = 0;
    const MAX_ITER = 5000; // límite para evitar freezes en titulares largos

    function buscar(idx, silActual, seleccion) {
      iteraciones++;
      if (iteraciones > MAX_ITER) return;

      if (silActual === silabasObjetivo) {
        if (!mejor || seleccion.length < mejor.length) {
          mejor = [...seleccion];
        }
        return;
      }
      if (silActual > silabasObjetivo) return;
      if (idx >= palabrasDisponibles.length) return;

      // Poda: verificar si las restantes pueden alcanzar el objetivo
      let restante = 0;
      for (let k = idx; k < palabrasDisponibles.length; k++) {
        if (!usadas.has(k)) restante += palabrasDisponibles[k].silabas;
      }
      if (silActual + restante < silabasObjetivo) return;

      for (let i = idx; i < palabrasDisponibles.length; i++) {
        if (iteraciones > MAX_ITER) return;
        if (usadas.has(i)) continue;
        let p = palabrasDisponibles[i];
        if (silActual + p.silabas <= silabasObjetivo) {
          seleccion.push(i);
          buscar(i + 1, silActual + p.silabas, seleccion);
          seleccion.pop();
        }
      }
    }

    buscar(0, 0, []);
    return mejor;
  }

  /**
   * componerAlgoritmico — genera un haiku (5-7-5) algorítmicamente
   * Extrae palabras del titular, las ordena por valor poético,
   * y arma versos que cumplan la métrica.
   */
  function componerAlgoritmico(titular) {
    if (!titular || titular.trim().length === 0) {
      return { versos: ["silencio alba", "el mundo espera en calma", "nace nueva luz"], metrica: [5, 7, 5], titular: "", motor: "fallback" };
    }

    let palabrasRaw = titular.split(/\s+/).map(p => limpiarPalabra(p)).filter(p => p.length > 0);
    let metrica = [5, 7, 5];

    let palabras = palabrasRaw.map((p, i) => ({
      texto: p,
      silabas: Silabas.contarSilabas(p),
      puntaje: puntuacionPoetica(p),
      indiceOriginal: i
    }));

    let ordenadas = [...palabras].sort((a, b) => b.puntaje - a.puntaje);

    let versos = [];
    let usadas = new Set();

    for (let m of metrica) {
      let indices = intentarVerso(ordenadas, m, usadas);

      if (indices) {
        for (let idx of indices) usadas.add(idx);
        let palabrasVerso = indices.map(i => ordenadas[i]);
        palabrasVerso.sort((a, b) => a.indiceOriginal - b.indiceOriginal);
        versos.push(palabrasVerso.map(p => p.texto).join(" "));
      } else {
        versos.push(completarConPuente(ordenadas, m, usadas));
      }
    }

    return {
      versos: versos,
      metrica: versos.map(v => Silabas.contarSilabasFrase(v)),
      titular: titular,
      motor: "algoritmico"
    };
  }

  function completarConPuente(palabras, silabasObj, usadas) {
    for (let i = 0; i < palabras.length; i++) {
      if (usadas.has(i)) continue;
      let p = palabras[i];
      if (p.silabas <= silabasObj && p.puntaje > 0) {
        let faltan = silabasObj - p.silabas;
        usadas.add(i);
        if (faltan === 0) return p.texto;
        let puente = buscarPuente(faltan);
        if (puente) {
          return Math.random() > 0.5 ? puente + " " + p.texto : p.texto + " " + puente;
        }
        usadas.delete(i);
      }
    }
    return buscarPuente(silabasObj) || versoDePuentes(silabasObj);
  }

  function buscarPuente(n) {
    if (n <= 0) return "";
    if (n <= 4 && PUENTE[n]) {
      let opciones = PUENTE[n];
      return opciones[Math.floor(Math.random() * opciones.length)];
    }
    for (let a = 1; a <= Math.min(n - 1, 4); a++) {
      let b = n - a;
      if (b >= 1 && b <= 4 && PUENTE[a] && PUENTE[b]) {
        let pa = PUENTE[a][Math.floor(Math.random() * PUENTE[a].length)];
        let pb = PUENTE[b][Math.floor(Math.random() * PUENTE[b].length)];
        return pa + " " + pb;
      }
    }
    return null;
  }

  function versoDePuentes(n) {
    let verso = [];
    let restante = n;
    while (restante > 0) {
      let sil = Math.min(restante, 4);
      while (sil > 0 && (!PUENTE[sil] || PUENTE[sil].length === 0)) sil--;
      if (sil === 0) break;
      let opciones = PUENTE[sil];
      verso.push(opciones[Math.floor(Math.random() * opciones.length)]);
      restante -= sil;
    }
    return verso.join(" ");
  }

  // ── API pública ──

  /**
   * componerHaiku — genera un haiku intentando IA primero, luego algorítmico
   * Esta es la función principal que llama sketch.js.
   * Es async porque puede llamar a la API de Grok.
   *
   * @param {string} titular
   * @returns {Promise<Object>} {versos: [s,s,s], metrica: [n,n,n], titular, motor}
   */
  async function componerHaiku(titular) {
    // Intentar con Grok primero
    if (GROK_API_KEY) {
      let resultado = await componerConGrok(titular);
      if (resultado) {
        console.log("Haiku generado con Grok:", resultado.versos);
        return resultado;
      }
    }

    // Fallback algorítmico
    console.log("Usando motor algorítmico");
    return componerAlgoritmico(titular);
  }

  return {
    componerHaiku,
    componerAlgoritmico,
    limpiarPalabra,
    DESCARTABLES
  };

})();
