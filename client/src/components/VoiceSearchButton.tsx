import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, X } from "lucide-react";
import toast from "react-hot-toast";

import api from "../config/api";
import { useCart } from "../context/CardContext";
import type { Product } from "../types";
import { parseVoiceCommand } from "../utils/voiceCommandParser";

// ── SpeechRecognition types (not in lib.dom by default) ─────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

// ── Helpers ─────────────────────────────────────────────────────────
function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionCtor | null;
}

// ── Component states ────────────────────────────────────────────────
type VoiceState = "idle" | "listening" | "processing" | "results";

const VoiceSearchButton = () => {
  // Computed once — the browser either supports SpeechRecognition or it
  // doesn't, this never changes during the component's lifetime.
  const SpeechRecognition = getSpeechRecognition();

  const { addToCart } = useCart();

  // ── IMPORTANT: every hook below must run on every render, no matter
  // what. Never put a conditional `return` in between hook calls (React's
  // "Rules of Hooks") — that's why the unsupported-browser check now
  // happens AFTER all hooks, in the JSX return at the bottom instead.
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [matches, setMatches] = useState<Product[]>([]);
  const [pendingQuantity, setPendingQuantity] = useState(1);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Click-outside to close results dropdown ───────────────────────
  useEffect(() => {
    if (state !== "results") return;

    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        reset();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [state]);

  // ── Cleanup recognition on unmount ────────────────────────────────
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  // ── Core flow ─────────────────────────────────────────────────────
  function reset() {
    setState("idle");
    setTranscript("");
    setMatches([]);
    setPendingQuantity(1);
  }

  function startListening() {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US"; // TODO: make configurable if multi-language support is needed
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      setTranscript(text);
      handleTranscript(text);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMap: Record<string, string> = {
        "not-allowed": "Microphone permission denied. Please allow mic access.",
        "no-speech": "No speech detected. Please try again.",
        "audio-capture": "No microphone found. Please connect one.",
        network: "Network error. Please check your connection.",
        aborted: "",
      };

      const message = errorMap[event.error] || `Voice error: ${event.error}`;
      if (message) toast.error(message);
      reset();
    };

    recognition.onend = () => {
      // If we're still "listening" by the time onend fires, it means
      // onresult never fired (no speech was captured).
      setState((prev) => {
        if (prev === "listening") {
          toast.error("No speech detected. Please try again.");
          return "idle";
        }
        return prev;
      });
    };

    setState("listening");
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    reset();
  }

  async function handleTranscript(text: string) {
    const command = parseVoiceCommand(text);

    if (!command) {
      toast.error('Couldn\'t understand that. Try saying "add milk".');
      reset();
      return;
    }

    setState("processing");
    setPendingQuantity(command.quantity);

    try {
      const { data } = await api.get<{ products: Product[] }>(
        `/products?search=${encodeURIComponent(command.searchTerm)}`,
      );

      const products = data.products;

      if (products.length === 0) {
        toast.error(`Couldn't find "${command.searchTerm}". Try a different name.`);
        reset();
        return;
      }

      if (products.length === 1) {
        addToCart(products[0], command.quantity);
        toast.success(`Added ${command.quantity}× ${products[0].name} to cart`);
        reset();
        return;
      }

      // Multiple matches → show picker
      setMatches(products.slice(0, 5));
      setState("results");
    } catch {
      toast.error("Search failed. Please check your connection and try again.");
      reset();
    }
  }

  function handlePickProduct(product: Product) {
    addToCart(product, pendingQuantity);
    toast.success(`Added ${pendingQuantity}× ${product.name} to cart`);
    reset();
  }

  // ── Unsupported browser → render nothing ──────────────────────────
  // This now happens AFTER every hook above has run, so hook order stays
  // identical across every render regardless of browser support.
  if (!SpeechRecognition) return null;

  // ── Render ────────────────────────────────────────────────────────
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "$";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Mic button */}
      <button
        type="button"
        onClick={state === "listening" ? stopListening : startListening}
        disabled={state === "processing"}
        title={
          state === "listening"
            ? "Stop listening"
            : state === "processing"
              ? "Searching..."
              : "Voice search"
        }
        className={`
          relative size-9 rounded-full flex-center shrink-0
          transition-all duration-200
          ${
            state === "listening"
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110"
              : state === "processing"
                ? "bg-orange-100 text-app-orange cursor-wait"
                : "bg-orange-50 text-app-orange hover:bg-orange-100 ring-1 ring-app-orange/20 hover:ring-app-orange/40"
          }
        `}
      >
        {/* Listening ripple rings */}
        {state === "listening" && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400 animate-voice-ripple" />
            <span
              className="absolute inset-0 rounded-full bg-red-400 animate-voice-ripple"
              style={{ animationDelay: "0.4s" }}
            />
          </>
        )}

        {/* Icon */}
        {state === "processing" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : state === "listening" ? (
          <MicOff className="size-4 relative z-10" />
        ) : (
          <Mic className="size-4" />
        )}
      </button>

      {/* Listening indicator label */}
      {state === "listening" && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2
          whitespace-nowrap px-3 py-1.5 rounded-lg bg-app-green text-white
          text-xs font-medium shadow-lg animate-fade-in z-50"
        >
          <span className="animate-pulse-soft">Listening...</span>
        </div>
      )}

      {/* Processing indicator */}
      {state === "processing" && transcript && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2
          whitespace-nowrap px-3 py-1.5 rounded-lg bg-app-green text-white
          text-xs font-medium shadow-lg animate-fade-in z-50"
        >
          Searching "{transcript}"...
        </div>
      )}

      {/* Multi-match results dropdown */}
      {state === "results" && matches.length > 0 && (
        <div
          className="absolute right-0 top-full mt-2 w-72 sm:w-80
          bg-white rounded-xl shadow-xl border border-app-border
          overflow-hidden z-50 animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-app-border bg-orange-50/50">
            <p className="text-xs font-medium text-app-text">
              Multiple matches — pick one
            </p>
            <button
              onClick={reset}
              className="size-5 rounded-full flex-center text-zinc-400
                hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              <X className="size-3" />
            </button>
          </div>

          {/* Product list */}
          <ul className="max-h-64 overflow-y-auto divide-y divide-app-border">
            {matches.map((product) => (
              <li key={product.id}>
                <button
                  onClick={() => handlePickProduct(product)}
                  className="w-full flex items-center gap-3 px-4 py-3
                    hover:bg-orange-50/60 transition-colors text-left"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="size-10 rounded-lg object-cover shrink-0
                      bg-orange-50"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-app-text truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-app-text-light">
                      {currency}
                      {product.price.toFixed(2)} / {product.unit}
                    </p>
                  </div>
                  <span
                    className="shrink-0 px-2 py-1 text-[10px] font-semibold
                    text-app-orange bg-orange-100 rounded-full"
                  >
                    +{pendingQuantity}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VoiceSearchButton;