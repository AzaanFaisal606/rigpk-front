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
] as const;

export const SPEC_KEYS = [
  "brand", "socket", "vram", "ddr_type", "speed", "chipset",
  "wattage", "rating", "form_factor", "type", "aio_size",
  "fan_size", "interface", "capacity",
] as const;

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
