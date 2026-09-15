import { useState, FormEvent } from "react";
import { EvaluatedSite, NotifyState } from "../types";
import { Bell, CheckCircle2, AlertCircle, WifiOff } from "lucide-react";

// WEB3FORMS_KEY is the only credential permitted in browser code, because it can do
// exactly one thing: post to one inbox we own. Do not route it through api/. Do not generalise from it.
const WEB3FORMS_KEY = "9a75225c-0975-4712-9bd6-2c525c345151";

interface NotifyFormProps {
  flaggedSites: EvaluatedSite[];
}

export function NotifyForm({ flaggedSites }: NotifyFormProps) {
  const [email, setEmail] = useState("");
  const [thresholdPercent, setThresholdPercent] = useState("15");
  const [notifyState, setNotifyState] = useState<NotifyState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setNotifyState("rejected");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setNotifyState("submitting");
    setErrorMessage("");

    const flaggedSummary = flaggedSites.length > 0
      ? flaggedSites.map(s => `${s.development}: ${s.deviationSignedStr} (${s.plainSentence})`).join("\n")
      : "No sites currently breached baseline threshold.";

    const payload = {
      access_key: WEB3FORMS_KEY,
      subject: `[Carpark Exception Alert] Duty Supervisor Alert Subscription (Threshold ${thresholdPercent}%)`,
      email: email.trim(),
      threshold: `${thresholdPercent}% deviation`,
      current_flagged_sites: flaggedSummary,
      message: `Duty operations supervisor alert subscription registered for ${email.trim()}.\nThreshold: ${thresholdPercent}%\nCurrent Anomalies:\n${flaggedSummary}`
    };

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);

      // Branch the form on data.success, NOT response.ok — Web3Forms returns 200 with success:false
      if (data && data.success === true) {
        setNotifyState("sent");
      } else {
        setNotifyState("rejected");
        setErrorMessage(
          (data && data.message) ||
          "The notification service rejected the request. Please check your email address."
        );
      }
    } catch (netErr) {
      setNotifyState("unreachable");
      setErrorMessage("Unable to reach the notification service. Please try again later.");
    }
  };

  return (
    <section className="mt-10 pt-6 border-t border-stone-200">
      <div className="bg-stone-50 border border-stone-200/90 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-stone-700" />
          <h3 className="text-base font-semibold text-stone-900 tracking-tight">
            Tell me when a site breaches threshold
          </h3>
        </div>
        <p className="text-stone-600 text-xs leading-relaxed mb-4 max-w-2xl">
          Get notified automatically on your shift when a watched Singapore carpark deviates significantly from its weather-adjusted baseline.
        </p>

        {/* State 1: Sent */}
        {notifyState === "sent" ? (
          <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <span className="font-semibold">Notification saved.</span> You will be alerted when a site breaches baseline.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="supervisor@operations.gov.sg"
              required
              disabled={notifyState === "submitting"}
              className="px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 flex-1"
            />

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 whitespace-nowrap">Threshold:</span>
              <select
                value={thresholdPercent}
                onChange={(e) => setThresholdPercent(e.target.value)}
                disabled={notifyState === "submitting"}
                className="px-2.5 py-2 text-sm bg-white border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                <option value="10">±10% deviation</option>
                <option value="15">±15% deviation</option>
                <option value="20">±20% deviation</option>
                <option value="25">±25% deviation</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={notifyState === "submitting"}
              className="px-4 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
            >
              {notifyState === "submitting" ? "Submitting notification request…" : "Subscribe"}
            </button>
          </form>
        )}

        {/* State 2: Rejected */}
        {notifyState === "rejected" && (
          <div className="flex items-center gap-2 mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-md">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {errorMessage || "The notification service rejected the request. Please check your email address."}
            </span>
          </div>
        )}

        {/* State 3: Unreachable */}
        {notifyState === "unreachable" && (
          <div className="flex items-center gap-2 mt-3 text-xs text-stone-700 bg-stone-100 border border-stone-300 px-3 py-2 rounded-md">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              {errorMessage || "Unable to reach the notification service. Please try again later."}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
