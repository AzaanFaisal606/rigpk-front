import PulldownTab from "@/components/ui/PulldownTab";
import BudgetBoxes from "@/components/BudgetBoxes";
import { getBudgetBuckets } from "@/lib/budget-data";

/** The "PCs by budget" pulldown: server-computed buckets inside the generic tab. */
export default async function BudgetPulldown({ activeSlug }: { activeSlug?: string }) {
  const buckets = await getBudgetBuckets();
  return (
    <PulldownTab label="PCs by budget" title="Gaming PCs by budget">
      <BudgetBoxes buckets={buckets} activeSlug={activeSlug} />
    </PulldownTab>
  );
}
