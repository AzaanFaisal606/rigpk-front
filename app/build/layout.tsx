import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PC Builder — Build a PC in Pakistan",
  description:
    "Pick a CPU, GPU, RAM and more from Pakistani retailers, check compatibility and see the total price of your build in Rs.",
  alternates: { canonical: "/build" },
};

export default function BuildLayout({ children }: { children: React.ReactNode }) {
  return children;
}
