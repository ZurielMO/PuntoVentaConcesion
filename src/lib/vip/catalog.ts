import type { VipProduct, VipRestaurant } from "./types";

/**
 * Catálogo del aficionado: nombres legibles, categorías por producto y búsqueda.
 * Todo se deriva de los datos reales que entrega `/vip/concessions`; el backend no
 * guarda categoría por producto, así que se infiere del nombre (y del establecimiento
 * cuando el nombre no basta). Nada aquí cambia precios, inventario ni lo que se cobra.
 */

export type VipCategoryKey = "comida" | "bebidas" | "botanas" | "postres" | "combos";

export const VIP_CATEGORY_LABEL: Record<VipCategoryKey, string> = {
  comida: "Comida",
  bebidas: "Bebidas",
  botanas: "Botanas",
  postres: "Postres",
  combos: "Combos",
};

/** Orden en que se muestran los chips cuando existen productos de cada tipo. */
export const VIP_CATEGORY_ORDER: VipCategoryKey[] = ["comida", "bebidas", "botanas", "postres", "combos"];

export const normalizeText = (value: string): string =>
  String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const words = (value: string): string[] => normalizeText(value).split(/[\s-]+/).filter(Boolean);

// Palabras clave por categoría (sin acentos). El orden de lectura del nombre decide:
// "Hamburguesa con papas" es comida; "Charola fries" es botana.
const KEYWORDS: Record<Exclude<VipCategoryKey, "combos">, string[]> = {
  bebidas: [
    "agua", "aguas", "refresco", "refrescos", "soda", "cola", "coca", "pepsi", "sprite", "fanta", "squirt",
    "sidral", "manzanita", "jugo", "limonada", "naranjada", "cafe", "capuchino", "latte", "frappe", "malteada",
    "smoothie", "cerveza", "cervezas", "chela", "michelada", "micheladas", "miche", "miches", "clamato", "mezcal",
    "tequila", "whisky", "vodka", "ron", "ginebra", "gin", "vino", "sangria", "margarita", "mojito", "coctel",
    "cocteles", "bebida", "bebidas", "icee", "slush", "corona", "victoria", "modelo", "pacifico", "tecate",
    "heineken", "indio", "electrolit", "gatorade", "powerade", "energizante", "cerveceria",
  ],
  botanas: [
    "palomitas", "nachos", "papas", "fries", "chips", "doritos", "cheetos", "cacahuate", "cacahuates", "chicharron",
    "chicharrones", "botana", "botanas", "elote", "elotes", "esquite", "esquites", "pretzel", "pretzels", "totopos",
  ],
  postres: [
    "postre", "postres", "helado", "helados", "nieve", "nieves", "paleta", "paletas", "pastel", "pay", "brownie",
    "galleta", "galletas", "churro", "churros", "crepa", "crepas", "dona", "donas", "waffle", "raspado", "raspados",
    "flan", "gelatina",
  ],
  comida: [
    "pizza", "pizzas", "hamburguesa", "hamburguesas", "burger", "burgers", "hotdog", "hotdogs", "taco", "tacos",
    "torta", "tortas", "burrito", "burritos", "quesadilla", "quesadillas", "alitas", "boneless", "sandwich",
    "baguette", "nuggets", "salchicha", "birria", "gringa", "gringas", "asado", "asados", "carne", "pollo",
    "costillas", "enchiladas", "chilaquiles", "tamal", "tamales", "comida",
  ],
};

const COMBO_WORDS = new Set(["combo", "combos", "paquete", "paquetes", "2x1", "3x2", "kit"]);
// Palabras que describen el formato y no lo que es: "vaso" sugiere bebida solo si nada más lo dice.
const WEAK_HINTS: Record<string, VipCategoryKey> = { vaso: "bebidas", vasos: "bebidas" };

const KEYWORD_INDEX = new Map<string, VipCategoryKey>();
for (const [category, list] of Object.entries(KEYWORDS) as Array<[VipCategoryKey, string[]]>) {
  for (const word of list) KEYWORD_INDEX.set(word, category);
}

/** La palabra del nombre que dice qué es ("Charola Tacos" → "tacos"), o null. */
export function productKeyword(text: string): string | null {
  return words(text).find((token) => KEYWORD_INDEX.has(token) && !["bebida", "bebidas", "comida", "botana", "botanas"].includes(token)) || null;
}

/** Categoría que el texto dice explícitamente, o null. */
export function categoryFromText(text: string): VipCategoryKey | null {
  const tokens = words(text);
  if (tokens.some((token) => COMBO_WORDS.has(token))) return "combos";
  for (const token of tokens) {
    const hit = KEYWORD_INDEX.get(token);
    if (hit) return hit;
  }
  for (const token of tokens) {
    const weak = WEAK_HINTS[token];
    if (weak) return weak;
  }
  return null;
}

/**
 * Categoría por producto para todo un establecimiento:
 * 1) lo que dice el nombre o la descripción; 2) lo que dice el nombre o tipo del establecimiento;
 * 3) la categoría que predomina en ese establecimiento; 4) comida.
 */
export function classifyRestaurantProducts(
  products: Array<Pick<VipProduct, "id" | "nombre" | "descripcion">>,
  restaurant: { nombre: string; tipo?: string },
): Map<string, VipCategoryKey> {
  const direct = new Map<string, VipCategoryKey | null>();
  for (const product of products) {
    direct.set(product.id, categoryFromText(`${product.nombre} ${product.descripcion || ""}`));
  }
  const restaurantHint: VipCategoryKey | null =
    restaurant.tipo === "CERVECERIA" ? "bebidas" : categoryFromText(restaurant.nombre);

  const counts = new Map<VipCategoryKey, number>();
  for (const value of direct.values()) {
    if (value && value !== "combos") counts.set(value, (counts.get(value) || 0) + 1);
  }
  const majority = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const result = new Map<string, VipCategoryKey>();
  for (const product of products) {
    result.set(product.id, direct.get(product.id) || restaurantHint || majority || "comida");
  }
  return result;
}

export function categoryKeyFromLabel(label: string | undefined): VipCategoryKey | null {
  const key = normalizeText(label || "");
  return (VIP_CATEGORY_ORDER as string[]).includes(key) ? (key as VipCategoryKey) : null;
}

/** Categorías de un establecimiento ordenadas por cuántos productos tiene en cada una. */
export function restaurantCategories(restaurant: Pick<VipRestaurant, "productos">): VipCategoryKey[] {
  const counts = new Map<VipCategoryKey, number>();
  for (const product of restaurant.productos) {
    const key = categoryKeyFromLabel(product.categoria);
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || VIP_CATEGORY_ORDER.indexOf(a[0]) - VIP_CATEGORY_ORDER.indexOf(b[0]))
    .map(([key]) => key);
}

// ---------------------------------------------------------------------------
// Nombres para mostrar

const CONNECTORS = new Set(["de", "del", "la", "las", "el", "los", "y", "e", "o", "u", "con", "sin", "a", "al", "en", "por", "para"]);

// Acentos de palabras frecuentes en menús capturados en mayúsculas sin acento.
const ACCENTS: Record<string, string> = {
  clasico: "clásico",
  clasica: "clásica",
  clasicos: "clásicos",
  cafe: "café",
  limon: "limón",
  jamon: "jamón",
  champinon: "champiñón",
  champinones: "champiñones",
  jalapeno: "jalapeño",
  jalapenos: "jalapeños",
  chicharron: "chicharrón",
  platano: "plátano",
  maiz: "maíz",
  azucar: "azúcar",
  camaron: "camarón",
  salmon: "salmón",
  algodon: "algodón",
  pina: "piña",
  bajio: "bajío",
  leon: "león",
  mexico: "méxico",
  cinepolis: "cinépolis",
  frances: "francés",
  rapido: "rápido",
};

const capitalize = (word: string): string =>
  word
    .split("-")
    .map((part) => (part ? part.charAt(0).toLocaleUpperCase("es-MX") + part.slice(1) : part))
    .join("-");

/** Siglas reconocidas en el catálogo: nombres de una sola palabra de hasta 4 letras (p. ej. ICEE). */
export function catalogAcronyms(names: string[]): Set<string> {
  const set = new Set<string>();
  for (const raw of names) {
    const name = String(raw || "").trim();
    if (/^[A-ZÁÉÍÓÚÑÜ]{2,4}$/.test(name)) set.add(name);
  }
  return set;
}

/**
 * Formato título solo para mostrar: "PIZZA TIGRE NEGRO" → "Pizza Tigre Negro",
 * "VASO DE AGUA FRESCA" → "Vaso de Agua Fresca". Si el administrador ya usó
 * minúsculas, se respeta su escritura.
 */
export function formatDisplayName(raw: string, acronyms: Set<string> = new Set()): string {
  const name = String(raw || "").replace(/\s+/g, " ").trim();
  if (!name) return name;
  if (/[a-záéíóúñü]/.test(name)) return name;
  return name
    .split(" ")
    .map((token, index) => {
      if (acronyms.has(token)) return token;
      if (/\d/.test(token)) return token;
      if (token.length <= 3 && !/[AEIOUÁÉÍÓÚ]/.test(token)) return token;
      const lower = token.toLocaleLowerCase("es-MX");
      const plain = normalizeText(lower);
      if (index > 0 && CONNECTORS.has(plain)) return lower;
      const accented = ACCENTS[plain] && plain === lower ? ACCENTS[plain] : lower;
      return capitalize(accented);
    })
    .join(" ");
}

// ---------------------------------------------------------------------------
// Búsqueda

export interface VipSearchHit {
  product: VipProduct;
  restaurant: VipRestaurant;
  score: number;
}

export interface VipSearchResult {
  products: VipSearchHit[];
  restaurants: VipRestaurant[];
}

function scoreTokens(queryTokens: string[], haystack: string[], weight: number): number {
  let score = 0;
  for (const token of queryTokens) {
    let best = 0;
    haystack.forEach((word, index) => {
      if (word === token) best = Math.max(best, 3 + (index === 0 ? 1 : 0));
      else if (word.startsWith(token)) best = Math.max(best, 2 + (index === 0 ? 1 : 0));
      else if (token.length >= 4 && word.includes(token)) best = Math.max(best, 1);
    });
    if (best === 0) return 0;
    score += best;
  }
  return score * weight;
}

/** Busca por producto, establecimiento o categoría. Todas las palabras deben coincidir. */
export function searchCatalog(restaurants: VipRestaurant[], rawQuery: string): VipSearchResult {
  const queryTokens = words(rawQuery);
  if (queryTokens.length === 0) return { products: [], restaurants: [] };

  const products: VipSearchHit[] = [];
  const matchedRestaurants: Array<{ restaurant: VipRestaurant; score: number }> = [];

  for (const restaurant of restaurants) {
    const restaurantWords = words(restaurant.nombre);
    const restaurantScore = scoreTokens(queryTokens, restaurantWords, 1);
    if (restaurantScore > 0) matchedRestaurants.push({ restaurant, score: restaurantScore });

    for (const product of restaurant.productos) {
      const nameScore = scoreTokens(queryTokens, words(product.nombre), 3);
      const fullScore =
        nameScore ||
        scoreTokens(
          queryTokens,
          [...words(product.nombre), ...words(product.descripcion), ...words(product.categoria), ...restaurantWords],
          1,
        );
      if (fullScore > 0) products.push({ product, restaurant, score: fullScore });
    }
  }

  products.sort((a, b) => b.score - a.score || a.product.precio - b.product.precio);
  matchedRestaurants.sort((a, b) => b.score - a.score);
  return { products, restaurants: matchedRestaurants.map((row) => row.restaurant) };
}

/** Productos de todo el catálogo agrupados por categoría (para los rieles de inicio). */
export function productsByCategory(
  restaurants: VipRestaurant[],
): Map<VipCategoryKey, Array<{ product: VipProduct; restaurant: VipRestaurant }>> {
  const map = new Map<VipCategoryKey, Array<{ product: VipProduct; restaurant: VipRestaurant }>>();
  for (const restaurant of restaurants) {
    for (const product of restaurant.productos) {
      const key = categoryKeyFromLabel(product.categoria) || "comida";
      const list = map.get(key) || [];
      list.push({ product, restaurant });
      map.set(key, list);
    }
  }
  return map;
}

/** Texto de ayuda para el comentario a cocina o barra, según lo que se pide. */
export function commentPlaceholder(product: Pick<VipProduct, "categoria">): string {
  switch (categoryKeyFromLabel(product.categoria)) {
    case "bebidas":
      return "Ej. sin hielo, bien fría, con popote";
    case "botanas":
      return "Ej. salsa aparte, sin chile";
    case "postres":
      return "Ej. sin topping, cubiertos extra";
    case "combos":
      return "Ej. cambia la bebida por agua, sin cebolla";
    default:
      return "Ej. sin cebolla, salsa aparte";
  }
}
