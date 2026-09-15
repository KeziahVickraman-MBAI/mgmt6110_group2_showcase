export function Footer() {
  const todayDate = new Date().toLocaleDateString("en-SG", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  return (
    <footer className="mt-14 pb-12 pt-8 border-t border-stone-200 text-stone-600 text-xs leading-relaxed">
      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        {/* Headline Trap stated on screen */}
        <div className="bg-stone-100/70 border border-stone-200/90 rounded-lg p-3.5 text-stone-700">
          <p className="font-semibold text-stone-900 mb-1">
            Operational Rule & The Headline Trap
          </p>
          <p>
            A genuine zero and a dead feed look identical from the outside. A carpark reporting zero available lots is <strong className="font-semibold text-stone-900">FULL</strong>; a carpark absent from the response is <strong className="font-semibold text-stone-900">UNKNOWN</strong>. These never share a sentence. A site missing from the payload shows &ldquo;No reading for this site&rdquo; in the ranked list, never &ldquo;0 lots&rdquo;.
          </p>
        </div>

        {/* Required Open Data Attribution */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-stone-600 pt-2 font-mono text-[11px]">
          <p>
            Contains information from LTA DataMall and data.gov.sg, accessed {todayDate}, made available under the terms of the Singapore Open Data Licence version 1.0,{" "}
            <a
              href="https://data.gov.sg/open-data-licence"
              target="_blank"
              rel="noreferrer noopener"
              className="text-stone-700 underline hover:text-stone-900"
            >
              data.gov.sg/open-data-licence
            </a>
            .
          </p>
          <p className="text-stone-600">
            Singapore SGT (UTC+8)
          </p>
        </div>
      </div>
    </footer>
  );
}
