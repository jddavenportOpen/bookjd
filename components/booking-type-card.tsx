import Link from 'next/link';
import { BookingType } from '@/lib/types';

export default function BookingTypeCard({ type }: { type: BookingType }) {
  const price = type.price_cents === 0 ? 'FREE' : `$${type.price_cents / 100}`;

  return (
    <div className="bg-card rounded-xl border border-border hover:border-green/40 hover:shadow-[0_0_30px_rgba(0,255,136,0.08)] transition-all duration-300 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-dim text-green border border-green/20">
          {price}
        </span>
        <span className="text-sm text-muted-foreground font-medium font-mono">{type.duration_minutes} min</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{type.name}</h3>
      <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed">{type.description}</p>
      <Link
        href={`/book/${type.slug}`}
        className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-primary-foreground bg-green hover:brightness-110 transition-all duration-200"
      >
        {type.price_cents === 0 ? 'Book Free Call' : `Book ${type.name}`}
      </Link>
    </div>
  );
}
