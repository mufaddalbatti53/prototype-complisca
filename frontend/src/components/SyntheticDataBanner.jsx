import React from 'react';
import { Info } from 'lucide-react';

export default function SyntheticDataBanner() {
  return (
    <div role="note" className="flex items-start gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs leading-relaxed text-amber-950">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        <strong>Synthetic demonstration data.</strong> This prototype is not an AICTE system or endorsement and does not create official records, dates, compliance findings, or decisions. AI output and workflow rules require source-by-source human review.
      </p>
    </div>
  );
}
