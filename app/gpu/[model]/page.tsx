import type { Metadata } from "next";
import ModelPage, { modelMetadata } from "@/components/ModelPage";
import { MODELS } from "@/lib/models";

// Static per model, refreshed hourly (ISR), like the budget pages. Unknown
// slugs 404 here and, with a real 404 status, in proxy.ts.
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return MODELS.filter(m => m.category === "gpu").map(m => ({ model: m.slug }));
}

interface PageProps {
  params: Promise<{ model: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return modelMetadata("gpu", (await params).model);
}

export default async function Page({ params }: PageProps) {
  return <ModelPage category="gpu" slug={(await params).model} />;
}
