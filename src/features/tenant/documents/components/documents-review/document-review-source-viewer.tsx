import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentReviewSourceViewerProps {
  zoom: number;
  onZoomChange: (value: number) => void;
}

export function DocumentReviewSourceViewer({
  zoom,
  onZoomChange,
}: DocumentReviewSourceViewerProps) {
  return (
    <div className="bg-muted/30 flex min-w-0 flex-1 flex-col border-r">
      <div className="bg-background flex shrink-0 items-center justify-between border-b px-6 py-2">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Source Document
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onZoomChange(Math.max(50, zoom - 10))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground w-12 text-center font-mono text-xs">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onZoomChange(Math.min(200, zoom + 10))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 md:px-16 lg:px-24">
        <div className="text-foreground dark:bg-card mx-auto min-h-[800px] w-full max-w-[800px] rounded-sm border bg-white p-12 font-serif leading-relaxed shadow-sm">
          <div className="mb-8 border-b pb-4">
            <h1 className="mb-2 text-3xl font-bold">
              Q3 2024 Financial Performance Review
            </h1>
            <p className="text-muted-foreground text-sm italic">
              Confidential - Internal Use Only
            </p>
          </div>

          <h3 className="mb-4 text-xl font-bold">1. Executive Summary</h3>
          <p className="mb-6 text-base">
            The third quarter of 2024 has marked a significant turnaround in our global
            operations. Total revenue reached{' '}
            <span className="cursor-pointer rounded border border-yellow-200 bg-yellow-100 px-1 text-yellow-800 transition-colors hover:bg-yellow-200 dark:border-yellow-800/50 dark:bg-yellow-900/30 dark:text-yellow-200 dark:hover:bg-yellow-900/50">
              $45.2M
            </span>
            , representing a 15% increase year-over-year. This growth was primarily driven
            by the expansion of our Enterprise SaaS division in the APAC region.
          </p>
          <p className="mb-6 text-base">
            Despite the revenue growth, operating expenses saw a moderate rise of 8% due
            to strategic investments in AI infrastructure and talent acquisition. The
            EBITDA margin remains healthy at 22%, slightly above our forecasted 20%.
          </p>

          <h3 className="mb-4 text-xl font-bold">2. Revenue Breakdown by Region</h3>
          <div className="mb-6 overflow-hidden rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-2">Region</th>
                  <th className="px-4 py-2">Revenue (M)</th>
                  <th className="px-4 py-2">YoY Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-2 font-medium">North America</td>
                  <td className="px-4 py-2">$22.5</td>
                  <td className="px-4 py-2 text-green-600">+12%</td>
                </tr>
                <tr className="bg-primary/5 ring-primary/20 ring-1 ring-inset">
                  <td className="px-4 py-2 font-medium">APAC</td>
                  <td className="px-4 py-2">$12.8</td>
                  <td className="px-4 py-2 text-green-600">+28%</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">EMEA</td>
                  <td className="px-4 py-2">$9.9</td>
                  <td className="px-4 py-2 text-red-500">-2%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mb-6 text-base">
            <span className="border-primary/30 bg-primary/10 text-primary ring-primary ring-offset-background rounded border px-1 ring-2 ring-offset-2">
              The APAC region outperformed expectations, driven largely by the successful
              launch of the &apos;Horizon&apos; product line in Japan and South Korea.
            </span>{' '}
            Conversely, EMEA faced headwinds due to regulatory changes in the EU market,
            impacting our data processing services.
          </p>

          <h3 className="mb-4 text-xl font-bold">3. Operational Efficiency</h3>
          <p className="mb-6 text-base">
            We have successfully integrated the new customer support automation tools,
            reducing average ticket resolution time by 35%. This efficiency gain is
            projected to save approximately $1.2M annually in operational costs starting
            Q4 2024.
          </p>
        </div>
      </div>
    </div>
  );
}
