export const CATEGORIES = [
  "gpu", "cpu", "ram", "ssd", "hdd",
  "psu", "case", "motherboard", "cooling", "monitor",
] as const;

export const SOURCES = [
  { key: "czone.com.pk",     label: "CZone" },
  { key: "zahcomputers.pk",  label: "Zah Computers" },
  { key: "amdhouse.pk",      label: "AMD House" },
  { key: "rbtechngames.com", label: "RB Tech" },
  { key: "junaidtech.pk",    label: "Junaid Tech" },
  { key: "techarc.pk",       label: "Tech Arc" },
  { key: "pakbyte.pk",       label: "PakByte" },
  { key: "redtech.pk",       label: "Red Tech" },
  { key: "techmatched.pk",   label: "TechMatched" },
] as const;

export const SPEC_KEYS = [
  "brand", "socket", "vram", "ddr_type", "speed", "chipset",
  "wattage", "rating", "form_factor", "type", "aio_size",
  "fan_size", "interface", "capacity",
] as const;

// Curated "popular" trend groups shown on the /trends page, per category.
// API returns all groups; the page filters to these and renders in this order.
export const TREND_WHITELIST: Record<"gpu" | "cpu" | "ram", string[]> = {
  gpu: [
    "RTX 5090", "RTX 5080", "RTX 5070 Ti", "RTX 5070",
    "RTX 5060 Ti", "RTX 5060", "RTX 4070 Super", "RTX 4070",
    "RTX 4060 Ti", "RTX 4060", "RX 9070 XT", "RX 9070",
    "RX 9060 XT", "RX 7900 XTX", "RX 7800 XT", "RX 7700 XT",
  ],
  cpu: [
    "Ryzen 9 9950X3D", "Ryzen 7 9800X3D", "Ryzen 5 9600X", "Ryzen 9 9950X",
    "Ryzen 7 7800X3D", "Ryzen 7 7700", "Ryzen 5 7600X", "Ryzen 5 7500F",
    "Ryzen 5 5600X", "Ryzen 5 5600", "i9-14900K", "i7-14700K",
    "i5-14400F", "Ultra 9 285K", "Ultra 7 265K",
  ],
  ram: [
    "DDR5-6000-32GB", "DDR5-6400-32GB", "DDR5-5600-32GB", "DDR5-5600-16GB",
    "DDR4-3200-32GB", "DDR4-3200-16GB", "DDR4-3600-32GB", "DDR4-3600-16GB",
  ],
};

export const SPEC_LABELS: Record<string, string> = {
  brand:       "Brand",
  socket:      "Socket",
  vram:        "VRAM",
  ddr_type:    "DDR",
  speed:       "Speed",
  chipset:     "Chipset",
  wattage:     "Wattage",
  rating:      "80+",
  form_factor: "Form",
  type:        "Type",
  aio_size:    "AIO",
  fan_size:    "Fan",
  interface:   "Interface",
  capacity:    "Capacity",
};
