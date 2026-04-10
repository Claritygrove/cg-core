export type Gender = "womens" | "mens" | "kids" | "unisex";
export type Season = "spring_summer" | "fall_winter" | "basic";

export interface Subcategory {
  id: string;
  name: string;
  gender: Gender;
  season: Season;
}

export const SUBCATEGORIES: Subcategory[] = [
  // Women's — Basic
  { id: "w-tops-basic",    name: "Women's Tops",      gender: "womens", season: "basic" },
  { id: "w-bottoms-basic", name: "Women's Bottoms",   gender: "womens", season: "basic" },
  { id: "w-denim-basic",   name: "Women's Denim",     gender: "womens", season: "basic" },
  // Women's — Spring/Summer
  { id: "w-tops-ss",       name: "Women's Tops SS",   gender: "womens", season: "spring_summer" },
  { id: "w-bottoms-ss",    name: "Women's Shorts",    gender: "womens", season: "spring_summer" },
  { id: "w-dresses-ss",    name: "Women's Dresses",   gender: "womens", season: "spring_summer" },
  { id: "w-swim",          name: "Women's Swim",      gender: "womens", season: "spring_summer" },
  // Women's — Fall/Winter
  { id: "w-tops-fw",       name: "Women's Tops FW",   gender: "womens", season: "fall_winter" },
  { id: "w-sweaters",      name: "Women's Sweaters",  gender: "womens", season: "fall_winter" },
  { id: "w-coats",         name: "Women's Coats",     gender: "womens", season: "fall_winter" },
  { id: "w-boots",         name: "Women's Boots",     gender: "womens", season: "fall_winter" },
  // Men's — Basic
  { id: "m-tops-basic",    name: "Men's Tops",        gender: "mens",   season: "basic" },
  { id: "m-bottoms-basic", name: "Men's Bottoms",     gender: "mens",   season: "basic" },
  { id: "m-denim-basic",   name: "Men's Denim",       gender: "mens",   season: "basic" },
  // Men's — Spring/Summer
  { id: "m-tops-ss",       name: "Men's Tops SS",     gender: "mens",   season: "spring_summer" },
  { id: "m-shorts",        name: "Men's Shorts",      gender: "mens",   season: "spring_summer" },
  // Men's — Fall/Winter
  { id: "m-tops-fw",       name: "Men's Tops FW",     gender: "mens",   season: "fall_winter" },
  { id: "m-sweaters",      name: "Men's Sweaters",    gender: "mens",   season: "fall_winter" },
  { id: "m-coats",         name: "Men's Coats",       gender: "mens",   season: "fall_winter" },
  // Kids
  { id: "kids",            name: "Kids",              gender: "kids",   season: "basic" },
  // Unisex / Other
  { id: "shoes",           name: "Shoes",             gender: "unisex", season: "basic" },
  { id: "accessories",     name: "Accessories",       gender: "unisex", season: "basic" },
  { id: "bags",            name: "Bags",              gender: "unisex", season: "basic" },
  { id: "sale",            name: "Sale",              gender: "unisex", season: "basic" },
];

// Color coding palettes

export const COLOR_GENDER: Record<Gender, string> = {
  womens: "#e879a0",
  mens:   "#60a5fa",
  kids:   "#a78bfa",
  unisex: "#94a3b8",
};

export const COLOR_SEASON: Record<Season, string> = {
  spring_summer: "#34d399",
  fall_winter:   "#f97316",
  basic:         "#94a3b8",
};

// For color setting 3: unique color per subcategory
const PALETTE_3 = [
  "#f87171","#fb923c","#fbbf24","#a3e635","#34d399",
  "#22d3ee","#60a5fa","#818cf8","#c084fc","#f472b6",
  "#e879a0","#4ade80","#38bdf8","#f59e0b","#a78bfa",
  "#84cc16","#06b6d4","#6366f1","#ec4899","#14b8a6",
  "#f97316","#8b5cf6","#10b981","#3b82f6","#ef4444",
];

export const COLOR_SUBCATEGORY: Record<string, string> = Object.fromEntries(
  SUBCATEGORIES.map((s, i) => [s.id, PALETTE_3[i % PALETTE_3.length]])
);
