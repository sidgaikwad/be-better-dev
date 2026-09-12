"use client"

import {
  RiHeadphoneLine,
  RiPauseFill,
  RiPlayFill,
  RiSkipBackLine,
  RiSkipForwardLine,
  RiStopFill,
} from "@remixicon/react"
import { useEffect, useMemo } from "react"

import { Button } from "@/components/ui/button"
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { Progress } from "@/components/ui/progress"
import { SPEECH_RATES, useSpeech, type Speech } from "@/hooks/use-speech"
import { estimateSeconds, formatDuration, toSpeechSegments } from "@/lib/speech"
import { cn } from "@/lib/utils"

// Voices come back as one flat list of every engine the OS has installed, which
// on macOS is over a hundred. Grouping by language turns that into something
// you can pick from, English first since the course is written in it.
function groupVoices(voices: SpeechSynthesisVoice[]) {
  const groups = new Map<string, SpeechSynthesisVoice[]>()
  for (const voice of voices) {
    const language = voice.lang || "Other"
    const list = groups.get(language) ?? []
    list.push(voice)
    groups.set(language, list)
  }
  return [...groups.entries()].sort(([a], [b]) => {
    const aEnglish = a.startsWith("en")
    const bEnglish = b.startsWith("en")
    if (aEnglish !== bEnglish) return aEnglish ? -1 : 1
    return a.localeCompare(b)
  })
}

/** The notice shown instead of controls when the browser has no speech engine. */
export function ReadAloudUnsupported({ className }: { className?: string }) {
  return (
    <p className={cn("text-muted-foreground text-xs", className)}>
      <RiHeadphoneLine className="mr-1 inline size-3.5 align-text-bottom" aria-hidden />
      This browser has no speech engine, so listening is unavailable here. Chrome, Edge, and Safari
      all support it.
    </p>
  )
}

/**
 * The playback controls. Presentational: it renders whatever `speech` is doing
 * and calls back into it, so the lesson player and the audiobook queue share
 * one control surface without sharing a queue.
 */
export function ReadAloudBar({
  speech,
  className,
  caption,
  children,
}: {
  speech: Speech
  className?: string
  /** Replaces the idle hint, for a queue that wants to name what is up next. */
  caption?: string
  /** Extra controls for the right-hand side, such as the audiobook's own. */
  children?: React.ReactNode
}) {
  const voiceGroups = useMemo(() => groupVoices(speech.voices), [speech.voices])
  const total = speech.segments.length
  const percent = total === 0 ? 0 : Math.round((speech.index / total) * 100)
  const remaining = useMemo(
    () => estimateSeconds(speech.segments.slice(speech.index), speech.rate),
    [speech.segments, speech.index, speech.rate],
  )
  const playing = speech.status === "playing"

  return (
    <div className={cn("bg-card space-y-3 rounded-lg border p-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="icon"
          onClick={speech.toggle}
          disabled={total === 0}
          aria-label={playing ? "Pause reading" : "Read aloud"}
        >
          {playing ? <RiPauseFill /> : <RiPlayFill />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={speech.previous}
          disabled={total === 0 || speech.index === 0}
          aria-label="Previous sentence"
        >
          <RiSkipBackLine />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={speech.next}
          disabled={total === 0 || speech.index >= total - 1}
          aria-label="Next sentence"
        >
          <RiSkipForwardLine />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={speech.stop}
          disabled={speech.status === "idle"}
          aria-label="Stop reading"
        >
          <RiStopFill />
        </Button>

        <span className="text-muted-foreground ml-1 text-xs tabular-nums">
          {total === 0
            ? "Nothing to read"
            : `${speech.index + 1} / ${total} · ${formatDuration(remaining)} left`}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {children}
          <NativeSelect
            size="sm"
            aria-label="Reading speed"
            value={String(speech.rate)}
            onChange={(event) => speech.setRate(Number(event.target.value))}
          >
            {SPEECH_RATES.map((rate) => (
              <NativeSelectOption key={rate} value={String(rate)}>
                {rate}x
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            size="sm"
            aria-label="Voice"
            className="max-w-40"
            value={speech.voiceUri ?? ""}
            onChange={(event) => speech.setVoiceUri(event.target.value)}
          >
            <NativeSelectOption value="">Default voice</NativeSelectOption>
            {voiceGroups.map(([language, group]) => (
              <NativeSelectOptGroup key={language} label={language}>
                {group.map((voice) => (
                  <NativeSelectOption key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name}
                  </NativeSelectOption>
                ))}
              </NativeSelectOptGroup>
            ))}
          </NativeSelect>
        </div>
      </div>

      <Progress value={percent} aria-label="Reading progress" />

      {/* The line being spoken, so a listener who glances back knows the place. */}
      <p className="text-muted-foreground line-clamp-2 min-h-8 text-xs leading-4">
        {speech.current && speech.status !== "idle"
          ? speech.current.text
          : (caption ??
            "Press play to listen. Code samples and tables are announced rather than read out, so those stay on screen.")}
      </p>
    </div>
  )
}

/**
 * Self-contained read-aloud for one lesson: builds the queue from the lesson's
 * markdown and owns its own engine. The audiobook drives {@link ReadAloudBar}
 * directly instead, because its queue spans lessons.
 */
export function ReadAloud({
  content,
  title,
  summary,
}: {
  content: string
  title?: string
  summary?: string
}) {
  const speech = useSpeech()
  const { load } = speech
  const segments = useMemo(
    () => toSpeechSegments(content, { title, summary }),
    [content, title, summary],
  )

  // Loading a new queue cancels whatever the previous lesson was saying, which
  // is what someone clicking "next lesson" mid-sentence expects.
  useEffect(() => {
    load(segments)
  }, [segments, load])

  if (!speech.supported) return <ReadAloudUnsupported />

  return <ReadAloudBar speech={speech} />
}
