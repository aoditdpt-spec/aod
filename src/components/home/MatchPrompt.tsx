"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";

// Free-text request box; "Next" opens WhatsApp with what they typed.
export function MatchPrompt() {
  const [text, setText] = useState("");
  const ready = text.trim().length >= 3;

  return (
    <div className="mt-8 rounded-[1.25rem] border border-white/80 bg-white p-4">
      <label htmlFor="match-prompt" className="sr-only">
        Describe your event
      </label>
      <textarea
        id="match-prompt"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="To start, describe your event — e.g. 'Sangeet in Ahmedabad on 12 Dec, need a DJ and an anchor'"
        className="w-full resize-none bg-transparent text-sm text-body outline-none placeholder:text-muted"
      />
      <div className="flex justify-end">
        <a
          href={ready ? whatsappUrl(`Hi Artists on Demand! I'd like 3 curated matches.\n${text.trim()}`) : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!ready}
          onClick={(e) => !ready && e.preventDefault()}
          className={`inline-flex h-10 items-center gap-2 rounded-lg bg-night px-5 text-sm font-medium text-white ${
            ready ? "hover:bg-black" : "cursor-not-allowed opacity-50"
          }`}
        >
          Next <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </div>
  );
}
