"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PhotoTagSummary } from "@/lib/photos/serialize";

type AiInsightsPanelProps = {
  photoId: string;
  aiCaption: string | null | undefined;
  aiMood: string | null | undefined;
  aiEnrichedAt: string | null | undefined;
  onEnriched: (data: {
    aiCaption: string;
    aiMood: string;
    tags: PhotoTagSummary[];
  }) => void;
};

export function AiInsightsPanel({
  photoId,
  aiCaption,
  aiMood,
  aiEnrichedAt,
  onEnriched,
}: AiInsightsPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`/api/photos/${photoId}/enrich`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "AI analysis failed");
      }

      onEnriched({
        aiCaption: data.enrichment.aiCaption,
        aiMood: data.enrichment.aiMood,
        tags: data.enrichment.tags,
      });
    } catch (analyzeError) {
      setError(
        analyzeError instanceof Error
          ? analyzeError.message
          : "AI analysis failed",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  const hasAnalysis = Boolean(aiCaption || aiMood);

  return (
    <div className="mt-6 border-t border-line pt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="eyebrow">AI insights</p>
        <Button
          type="button"
          variant="secondary"
          disabled={isAnalyzing}
          onClick={handleAnalyze}
        >
          {isAnalyzing
            ? "Analyzing..."
            : hasAnalysis
              ? "Re-analyze"
              : "Analyze with AI"}
        </Button>
      </div>

      {hasAnalysis ? (
        <div className="space-y-3 text-sm">
          {aiCaption ? (
            <div>
              <p className="mb-1 text-muted">Caption</p>
              <p className="leading-6 text-ink">
                {aiCaption}
              </p>
            </div>
          ) : null}
          {aiMood ? (
            <div>
              <p className="mb-1 text-muted">Mood</p>
              <p className="text-ink">{aiMood}</p>
            </div>
          ) : null}
          {aiEnrichedAt ? (
            <p className="text-xs text-subtle">
              Analyzed {new Date(aiEnrichedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted">
          {isAnalyzing
            ? "OpenAI Vision is generating a caption, mood, and tags..."
            : "Run AI analysis to generate a caption, mood, and searchable tags."}
        </p>
      )}

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
