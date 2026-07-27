import { useRef, useState } from "react";
import {
  QrCode,
  Download,
  Loader2,
  Sparkles,
  History,
  RotateCcw,
  AlertCircle,
  ScanLine,
} from "lucide-react";

const API_BASE = "http://localhost:8080";

type SizeOption = {
  label: string;
  value: number;
};

const SIZE_OPTIONS: SizeOption[] = [
  { label: "Small", value: 200 },
  { label: "Medium", value: 300 },
  { label: "Large", value: 500 },
];

type HistoryItem = {
  id: string;
  text: string;
  size: number;
  url: string;
};

function App() {
  const [text, setText] = useState("");
  const [size, setSize] = useState(300);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const objectUrlRef = useRef<string | null>(null);

  const setObjectUrl = (url: string | null) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = url;
    setImageUrl(url);
  };

  const generate = async (inputText?: string, inputSize?: number) => {
    const payloadText = (inputText ?? text).trim();
    const payloadSize = inputSize ?? size;

    if (!payloadText) {
      setError("Please enter a URL or some text to encode.");
      return;
    }

    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/qr?text=${encodeURIComponent(payloadText)}&size=${payloadSize}`,
      );
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      const blob = await res.blob();
      if (!blob.type.startsWith("image/")) {
        throw new Error("The server did not return an image.");
      }
      const url = URL.createObjectURL(blob);
      setObjectUrl(url);

      setHistory((prev) => {
        const next = [
          { id: `${Date.now()}`, text: payloadText, size: payloadSize, url },
          ...prev.filter(
            (h) => h.text !== payloadText || h.size !== payloadSize,
          ),
        ].slice(0, 5);
        return next;
      });
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Could not reach the QR service. Make sure your backend is running."
          : err instanceof Error
            ? err.message
            : "Something went wrong while generating the QR code.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `quickqr-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const reloadFromHistory = (item: HistoryItem) => {
    setText(item.text);
    setSize(item.size);
    setObjectUrl(item.url);
    setError(null);
  };

  return (
    <div className="min-h-screen scan-grid relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[36rem] rounded-full bg-amber/10 blur-3xl" />

      <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-5 py-12">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/5 px-3 py-1 text-xs font-medium text-amber-400">
            <ScanLine className="h-3.5 w-3.5" />
            Instant QR Codes
          </div>
          <h1 className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Quick<span className="text-amber">QR</span>
          </h1>
          <p className="mt-3 font-body text-sm text-zinc-400 sm:text-base">
            Paste a link or any text. Get a scannable QR code in seconds.
          </p>
        </header>

        {/* Card */}
        <section className="w-full rounded-2xl border border-ink-700 bg-ink-900/80 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          {/* Input */}
          <label
            htmlFor="qr-input"
            className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            URL or text
          </label>
          <input
            id="qr-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") generate();
            }}
            placeholder="https://example.com"
            className="w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 font-body text-sm text-white placeholder-zinc-500 outline-none transition focus:border-amber/60 focus:ring-2 focus:ring-amber/20"
          />

          {/* Size selector */}
          <div className="mt-5">
            <span className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-zinc-500">
              Size
            </span>
            <div className="grid grid-cols-3 gap-2">
              {SIZE_OPTIONS.map((opt) => {
                const active = size === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSize(opt.value)}
                    className={`rounded-xl border px-3 py-2.5 font-body text-sm transition ${
                      active
                        ? "border-amber bg-amber/10 text-amber"
                        : "border-ink-600 bg-ink-800 text-zinc-300 hover:border-ink-500 hover:text-white"
                    }`}
                  >
                    <span className="block font-medium">{opt.label}</span>
                    <span className="block text-[11px] text-zinc-500">
                      {opt.value}px
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={() => generate()}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber px-4 py-3.5 font-body text-sm font-semibold text-ink-950 transition hover:bg-amber-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin-slow" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate QR Code
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-body text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview */}
          <div className="mt-6">
            {loading && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-ink-700 bg-ink-800/50 py-16">
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-amber/20 animate-pulse-ring" />
                  <Loader2 className="h-8 w-8 animate-spin-slow text-amber" />
                </div>
                <p className="mt-4 font-body text-xs text-zinc-500">
                  Rendering your code…
                </p>
              </div>
            )}

            {!loading && imageUrl && (
              <div className="animate-fade-in-up rounded-2xl border border-ink-700 bg-white p-5 glow-amber">
                <div className="flex items-center justify-center overflow-hidden rounded-lg">
                  <img
                    src={imageUrl}
                    alt="Generated QR code"
                    className="h-auto w-full max-w-[280px] object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={download}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 font-body text-sm font-medium text-white transition hover:border-amber/50 hover:bg-ink-700"
                >
                  <Download className="h-4 w-4" />
                  Download QR Code
                </button>
              </div>
            )}

            {!loading && !imageUrl && !error && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-600 bg-ink-800/30 py-16 text-center">
                <QrCode className="h-10 w-10 text-ink-500" />
                <p className="mt-3 font-body text-sm text-zinc-500">
                  Your QR code will appear here.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* History */}
        {history.length > 0 && (
          <section className="mt-8 w-full">
            <div className="mb-3 flex items-center gap-2 px-1 font-body text-xs font-medium uppercase tracking-wider text-zinc-500">
              <History className="h-3.5 w-3.5" />
              Recent
            </div>
            <div className="flex flex-wrap gap-3">
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => reloadFromHistory(item)}
                  className="group flex flex-col items-center rounded-xl border border-ink-700 bg-ink-900/80 p-2 transition hover:border-amber/40 hover:bg-ink-800"
                  title={item.text}
                >
                  <div className="overflow-hidden rounded-lg bg-white p-1.5">
                    <img
                      src={item.url}
                      alt={item.text}
                      className="h-16 w-16 object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <span className="mt-1.5 max-w-[72px] truncate font-body text-[10px] text-zinc-500 group-hover:text-zinc-300">
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 px-1 font-body text-[11px] text-zinc-600">
              <RotateCcw className="h-3 w-3" />
              Click a thumbnail to reload it.
            </p>
          </section>
        )}

        <footer className="mt-10 font-body text-[11px] text-zinc-600">
          QuickQR · single-page tool · no tracking
        </footer>
      </main>
    </div>
  );
}

export default App;
