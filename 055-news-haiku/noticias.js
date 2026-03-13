/**
 * noticias.js — Obtención de titulares desde feeds RSS
 *
 * Usa rss2json.com como proxy CORS para parsear feeds RSS
 * de fuentes de noticias en español (BBC Mundo, El País, DW).
 * Selecciona el titular más "apocalíptico" usando un puntaje
 * basado en palabras clave negativas.
 *
 * Se usa desde sketch.js para alimentar el ciclo de haiku.
 */

const Noticias = (function () {

  // Proxy CORS para poder hacer fetch desde el browser
  const CORS_PROXY = "https://api.allorigins.win/raw?url=";
  const RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=";

  // Feeds de noticias internacionales en español
  const FEEDS = [
    "https://feeds.bbci.co.uk/mundo/rss.xml",
    "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/internacional/portada",
    "https://rss.dw.com/xml/rss-sp-all"
  ];

  // Palabras que indican noticias apocalípticas/negativas
  // Se usa para puntuar titulares y elegir el más dramático
  const PALABRAS_NEGATIVAS = [
    "guerra", "muerte", "muertos", "crisis", "catástrofe", "desastre",
    "terremoto", "inundación", "incendio", "explosión", "ataque",
    "bombardeo", "víctimas", "tragedia", "conflicto", "destrucción",
    "pandemia", "emergencia", "colapso", "hambre", "sequía",
    "huracán", "tornado", "tsunami", "erupción", "accidente",
    "violencia", "masacre", "genocidio", "refugiados", "éxodo",
    "caos", "alarma", "pánico", "amenaza", "peligro",
    "contaminación", "extinción", "apocalipsis", "devastación",
    "derrumbe", "naufragio", "disparo", "asesinato", "invasión",
    "bomba", "misil", "nuclear", "radiación", "tóxico",
    "pobreza", "desempleo", "inflación", "recesión", "quiebra",
    "muere", "mata", "hiere", "sufre", "destruye", "arrasa",
    "derrota", "fracasa", "cae", "pierde", "arde", "explota"
  ];

  // Titulares de respaldo por si los feeds no responden
  const FALLBACK = [
    "Terremoto de magnitud 7.2 sacude las costas del Pacífico y deja cientos de muertos",
    "La guerra en el este se intensifica mientras los refugiados huyen del bombardeo",
    "Crisis climática: los glaciares se derriten al doble de velocidad prevista",
    "Incendios forestales arrasan miles de hectáreas y destruyen pueblos enteros",
    "Hambruna amenaza a millones mientras las cosechas se pierden por la sequía",
    "Inundaciones catastróficas dejan a ciudades enteras bajo el agua",
    "La pandemia silenciosa que los gobiernos prefieren ignorar avanza sin freno",
    "Miles de refugiados abandonan sus hogares ante la violencia que no cesa",
    "El colapso económico arrastra a millones a la pobreza extrema",
    "Explosión en planta química obliga a evacuar a toda una región",
    "La extinción masiva de especies alcanza un punto sin retorno según científicos",
    "Misiles cruzan la frontera mientras el mundo observa en silencio la destrucción"
  ];

  /**
   * puntuarTitular — asigna un "puntaje apocalíptico" a un titular
   * Más alto = más negativo/dramático.
   */
  function puntuarTitular(titular) {
    let t = titular.toLowerCase();
    let puntaje = 0;
    for (let palabra of PALABRAS_NEGATIVAS) {
      if (t.includes(palabra)) puntaje++;
    }
    // Bonus por largo (titulares más largos suelen ser más dramáticos)
    puntaje += Math.min(t.split(" ").length / 10, 1);
    return puntaje;
  }

  /**
   * obtenerTitulares — busca titulares de todos los feeds
   * Devuelve una Promise con un array de strings (titulares).
   * Si todos los feeds fallan, devuelve los fallback.
   */
  async function obtenerTitulares() {
    let todosLosTitulares = [];

    // Intentar cada feed en paralelo, con timeout de 8 segundos
    let promesas = FEEDS.map(async (feed) => {
      try {
        let controller = new AbortController();
        let timeout = setTimeout(() => controller.abort(), 8000);
        let url = RSS2JSON + encodeURIComponent(feed);
        let resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        let data = await resp.json();
        if (data.status === "ok" && data.items) {
          return data.items.map(item => item.title);
        }
      } catch (e) {
        console.log("Feed falló:", feed, e.message);
      }
      return [];
    });

    let resultados = await Promise.all(promesas);
    for (let titulares of resultados) {
      todosLosTitulares = todosLosTitulares.concat(titulares);
    }

    // Si no obtuvimos nada, usar fallback
    if (todosLosTitulares.length === 0) {
      console.log("Usando titulares de respaldo");
      return FALLBACK;
    }

    return todosLosTitulares;
  }

  /**
   * obtenerPeorTitular — obtiene el titular más apocalíptico disponible
   * Puntúa todos los titulares y devuelve el peor (más negativo).
   * Se usa desde sketch.js para iniciar cada ciclo.
   *
   * @returns {Promise<string>} el titular más dramático
   */
  async function obtenerPeorTitular() {
    let titulares = await obtenerTitulares();

    // Puntuar y ordenar
    let puntuados = titulares.map(t => ({
      texto: t,
      puntaje: puntuarTitular(t)
    }));
    puntuados.sort((a, b) => b.puntaje - a.puntaje);

    // Elegir aleatoriamente entre los 5 peores para variedad
    let top = puntuados.slice(0, Math.min(5, puntuados.length));
    let elegido = top[Math.floor(Math.random() * top.length)];

    return elegido.texto;
  }

  /**
   * obtenerTitularAleatorio — obtiene un titular de fallback al azar
   * Para uso inmediato mientras se cargan los feeds reales.
   */
  function obtenerTitularAleatorio() {
    return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
  }

  return {
    obtenerPeorTitular,
    obtenerTitularAleatorio,
    obtenerTitulares,
    puntuarTitular
  };

})();
