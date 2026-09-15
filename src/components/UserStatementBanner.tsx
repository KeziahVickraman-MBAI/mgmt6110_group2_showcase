import { useState } from "react";
import { Info, ChevronDown, ChevronUp, Users, Eye, ArrowRightCircle, History } from "lucide-react";

export function UserStatementBanner() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section
      id="panel-publish"
      aria-label="Application Panel - Product and User Statement"
      className="mb-6 rounded-xl border border-stone-200 bg-white shadow-xs overflow-hidden transition-all"
    >
      {/* Clickable Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-stone-100/70 border-b border-stone-200/80">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="user-statement-content"
          className="flex-1 flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-stone-800 text-amber-300 font-bold text-xs">
              <Info className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-900 font-mono">
                  Product &amp; User Statement
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  SMU Student
                </span>
              </div>
              <p className="text-xs text-stone-600 font-medium mt-0.5">
                The decision framework: Who opens this, what they see, and what action they take.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 group-hover:text-stone-900 pl-4">
            <span className="hidden sm:inline">{isOpen ? "Collapse brief" : "Expand brief"}</span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-stone-500 group-hover:text-stone-800" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-500 group-hover:text-stone-800" />
            )}
          </div>
        </button>
      </div>

      {/* Collapsible Content Body */}
      {isOpen && (
        <div id="user-statement-content" className="p-5 sm:p-6 space-y-4 bg-white">
          {/* 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 · USER OPENS APP */}
            <div className="rule-card rounded-lg border border-stone-200 bg-stone-50/60 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold font-mono">
                    1
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-stone-600" />
                    USER OPENS APP
                  </span>
                </div>
                <h4 className="text-sm font-bold text-stone-950 mb-1">
                  An SMU student who drives in
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Opens it before leaving home on the mornings they have class, to see whether the carparks near campus are filling faster than usual.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-stone-200/80 text-[11px] font-mono text-stone-500">
                Context: One campus, one morning
              </div>
            </div>

            {/* Card 2 · SEES SOMETHING */}
            <div className="rule-card rounded-lg border border-stone-200 bg-stone-50/60 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-stone-950 text-xs font-bold font-mono">
                    2
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-stone-600" />
                    SEES SOMETHING
                  </span>
                </div>
                <h4 className="text-sm font-bold text-stone-950 mb-1">
                  Whether today is normal
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Which nearby carparks are running above or below their usual occupancy for this hour of this weekday, in net cars. Weather is already removed, so a wet Tuesday does not read as unusual when it is just rain.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-stone-200/80 text-[11px] font-mono text-stone-500">
                Metric: Net cars vs. rain-adjusted baseline
              </div>
            </div>

            {/* Card 3 · HENCE DOES SOMETHING */}
            <div className="rule-card rounded-lg border border-stone-200 bg-stone-50/60 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold font-mono">
                    3
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono flex items-center gap-1">
                    <ArrowRightCircle className="w-3.5 h-3.5 text-stone-600" />
                    HENCE DOES SOMETHING
                  </span>
                </div>
                <h4 className="text-sm font-bold text-stone-950 mb-1">
                  Leaves earlier, or takes the train
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  The decision is made at home, which is the only moment it can still be changed. Once they are circling Bras Basah it is too late to do anything about it.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-stone-200/80 text-[11px] font-mono text-stone-500">
                Action: Before leaving, not on arrival
              </div>
            </div>
          </div>

          {/* Fourth Beat · WHAT THIS REPLACES */}
          <div className="rule-card rounded-lg border border-stone-200 bg-stone-50/60 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-700 text-white text-xs font-bold font-mono">
                  4
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 font-mono flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-stone-600" />
                  WHAT THIS REPLACES
                </span>
              </div>
              <h4 className="text-sm font-bold text-stone-950 mb-1">
                Finding out on arrival
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Existing apps show what a carpark looks like right now — which is the one moment the information is useless, because the driver is already there. The gap is not live data. It is knowing early enough to change the plan.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-stone-200/80 text-[11px] font-mono text-stone-500">
              Gap: Timing, not availability
            </div>
          </div>

          {/* Core Synthesis Band */}
          <div className="rounded-lg bg-stone-900 text-stone-100 p-4 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs sm:text-sm leading-relaxed text-stone-200">
              <span className="font-bold text-amber-400 font-mono uppercase text-xs mr-2">
                Core Synthesis:
              </span>
              &ldquo;The student checks before leaving whether the carparks near campus are behaving normally for a weekday morning, and by how many cars — then decides whether to leave early or take the train.&rdquo;
            </div>
            <span className="text-[11px] font-mono text-stone-400 bg-stone-800 px-2.5 py-1 rounded border border-stone-700 shrink-0 self-start sm:self-auto">
              Decision Rule: 10% off own baseline
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

