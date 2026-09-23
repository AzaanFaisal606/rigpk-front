import PulldownTab from "@/components/ui/PulldownTab";
import ModelMenu from "@/components/ModelMenu";
import { getModelMenuData } from "@/lib/model-menu-data";

interface Props {
  /** `${category}/${slug}` of the model page currently shown. */
  activeSlug?: string;
  /** Menu level to open on, e.g. ["gpu", "nvidia", "rtx-40"]. */
  initialPath?: string[];
  /** Match the host bar's content row (see PulldownTab). */
  rowMaxWidth?: string;
  rowPadding?: string;
}

/** The "Shop by model" pulldown: server-computed counts and thumbnails inside the generic tab. */
export default async function ModelPulldown({ activeSlug, initialPath, rowMaxWidth, rowPadding }: Props) {
  const data = await getModelMenuData();
  return (
    <PulldownTab label="Shop by model" title="GPU and CPU prices by model" rowMaxWidth={rowMaxWidth} rowPadding={rowPadding}>
      <ModelMenu data={data} activeSlug={activeSlug} initialPath={initialPath} />
    </PulldownTab>
  );
}
