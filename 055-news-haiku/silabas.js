/**
 * silabas.js — Contador de sílabas para español
 *
 * Implementa las reglas básicas de silabificación del español:
 * - Vocales fuertes (a, e, o) y débiles (i, u)
 * - Diptongos: débil+fuerte, fuerte+débil, débil+débil
 * - Hiatos: fuerte+fuerte, débil acentuada+fuerte
 * - Grupos consonánticos inseparables (bl, br, cl, cr, dr, fl, fr, gl, gr, pl, pr, tr)
 *
 * Se usa en haiku.js para verificar la métrica 5-7-5.
 */

const Silabas = (function () {

  const VOCALES = "aeiouáéíóúüAEIOUÁÉÍÓÚÜ";
  const FUERTES = "aeoáéóAEOÁÉÓ";
  const DEBILES = "iuíúüIUÍÚÜ";
  const DEBILES_ACENTUADAS = "íúÍÚ";

  /**
   * esVocal — determina si un carácter es vocal
   * Se usa internamente para la lógica de silabificación.
   */
  function esVocal(c) {
    return VOCALES.includes(c);
  }

  function esFuerte(c) {
    return FUERTES.includes(c);
  }

  function esDebil(c) {
    return DEBILES.includes(c);
  }

  function esDebilAcentuada(c) {
    return DEBILES_ACENTUADAS.includes(c);
  }

  /**
   * contarSilabas — cuenta las sílabas de una palabra en español
   * Recorre la palabra detectando núcleos vocálicos y aplicando
   * reglas de diptongo/hiato para determinar cuántas sílabas tiene.
   *
   * @param {string} palabra
   * @returns {number} número de sílabas
   */
  function contarSilabas(palabra) {
    if (!palabra || palabra.length === 0) return 0;

    // Limpiar: solo letras
    let w = palabra.toLowerCase().replace(/[^a-záéíóúüñ]/g, "");
    if (w.length === 0) return 0;

    let silabas = 0;
    let i = 0;

    while (i < w.length) {
      if (esVocal(w[i])) {
        silabas++;
        // Consumir grupo vocálico (diptongos y triptongos)
        let j = i + 1;
        while (j < w.length && esVocal(w[j])) {
          let prev = w[j - 1];
          let curr = w[j];

          // Hiato: dos fuertes consecutivas
          if (esFuerte(prev) && esFuerte(curr)) {
            break;
          }
          // Hiato: débil acentuada + fuerte o fuerte + débil acentuada
          if (esDebilAcentuada(curr) && esFuerte(prev)) {
            break;
          }
          if (esFuerte(curr) && esDebilAcentuada(prev)) {
            // La acentuada ya fue contada, esta fuerte es nuevo núcleo
            break;
          }
          // Diptongo: débil+fuerte, fuerte+débil, débil+débil
          j++;
        }
        i = j;
      } else {
        i++;
      }
    }

    return Math.max(silabas, 1);
  }

  /**
   * contarSilabasFrase — cuenta sílabas totales de una frase
   * Separa por espacios y suma las sílabas de cada palabra.
   *
   * @param {string} frase
   * @returns {number}
   */
  function contarSilabasFrase(frase) {
    let palabras = frase.trim().split(/\s+/);
    let total = 0;
    for (let p of palabras) {
      total += contarSilabas(p);
    }
    return total;
  }

  return {
    contarSilabas,
    contarSilabasFrase
  };

})();
