import Link from "next/link";
import { BUDGETS } from "@/lib/budgets";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <p className="site-footer-mark">
            Rig<span>PK</span>
          </p>
          <p className="site-footer-tag">Prices updated regularly from Pakistani retailers.</p>
        </div>
        <nav aria-label="Gaming PCs by budget" className="site-footer-nav">
          {BUDGETS.map(b => (
            <Link key={b.slug} href={`/gaming-pc-under/${b.slug}`} prefetch={false}>
              Gaming PC under {b.short}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
