import { Eyebrow } from "@/components/marketing/eyebrow"
import { Section } from "@/components/marketing/section"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { courseStats } from "@/lib/marketing"

// Only questions the code can answer. A landing FAQ that invents a pricing tier
// or a certificate is the fastest way to make every other claim on the page
// suspect, so anything not settled in the repo is left off rather than guessed.
const questions: { answer: React.ReactNode; question: string }[] = [
  {
    answer: (
      <p>
        Two courses. Rust: Zero to Production, and System Design: Interview to Production. Together
        that is {courseStats.sections} sections, {courseStats.lessons.toLocaleString("en-US")}{" "}
        lessons and {courseStats.quizQuestions.toLocaleString("en-US")} quiz questions, written end
        to end rather than stubbed out.
      </p>
    ),
    question: "What is actually in the course?",
  },
  {
    answer: (
      <>
        <p>
          The one already on your device. The lessons are read by your browser's own speech engine,
          so nothing is downloaded, nothing is generated on a server, and no audio of you or of the
          lesson is sent anywhere.
        </p>
        <p>
          That is also the trade: the voice is whatever your operating system ships, and it is
          better on some platforms than others. In exchange, every lesson is listenable from the
          moment you sign in rather than the ones someone paid to narrate.
        </p>
      </>
    ),
    question: "Whose voice reads the lessons?",
  },
  {
    answer: (
      <p>
        A link in your email, or a passkey if your device has Touch ID, Windows Hello or a security
        key. No password to invent and no password to lose. You can add two-factor afterwards from
        settings.
      </p>
    ),
    question: "What do I need to sign in?",
  },
  {
    answer: (
      <p>
        Yes. Each lesson unlocks the next, which is the point: the map always has exactly one
        obvious move on it, so opening the app never starts with a decision. Focus mode and the
        audiobook both follow the same order, and the audiobook rolls into the next unlocked lesson
        on its own.
      </p>
    ),
    question: "Do lessons unlock in order?",
  },
  {
    answer: (
      <p>
        Every note is anchored to the exact sentence you selected, by the text itself rather than by
        a position in the page, so it re-finds its place when the lesson is rendered again. You can
        read them in the lesson or all together on one page, grouped by lesson.
      </p>
    ),
    question: "Do my notes stay where I put them?",
  },
  {
    answer: (
      <p>
        If your system asks for reduced motion, nothing on this page animates at all. If it does not
        but you still want it still, there is a pause control in the hero that stops the book, the
        background and the meters together. The 3D book is decorative and hidden from screen
        readers, and the page falls back to a flat one wherever WebGL is unavailable.
      </p>
    ),
    question: "All this motion. Can I turn it off?",
  },
]

export function Faq() {
  return (
    <Section id="faq" labelledBy="faq-heading">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
        <div>
          <Eyebrow>Before you sign in</Eyebrow>
          <h2
            className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl"
            id="faq-heading"
          >
            The questions worth answering first.
          </h2>
        </div>

        <Accordion className="border-border/70 border-t">
          {questions.map((entry) => (
            <AccordionItem className="border-border/70" key={entry.question} value={entry.question}>
              <AccordionTrigger className="py-4 text-base">{entry.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground max-w-2xl pb-4 text-pretty">
                {entry.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  )
}
