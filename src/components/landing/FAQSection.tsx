"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export const faqs = [
  {
    question: "Can you tell if a candidate's answers are genuine or rehearsed?",
    answer: "Speech pattern analysis can surface signals that suggest rehearsed responses: extremely short answers to complex questions, consistent hedging language when describing personal accomplishments, and a mismatch between the content of an answer and the delivery. TrueVoice HQ tracks these patterns across the full conversation, not just isolated moments, which is where the signal becomes meaningful.",
  },
  {
    question: "What do response timing and hesitation reveal about a candidate?",
    answer: "Pause duration and response latency are observable signals. Long processing time before answering a complex question often indicates genuine thinking. Instantaneous responses to nuanced questions can suggest the answer was prepared rather than reasoned. Neither alone is conclusive, but patterns across multiple questions within the same interview are worth paying attention to.",
  },
  {
    question: "Why do great interviewers sometimes make bad hires?",
    answer: "Interview performance and job performance measure different things. Being articulate, personable, and confident in a 45-minute conversation does not reliably predict how someone performs under real pressure, handles ambiguity, or works within a team. TrueVoice HQ adds a layer of structured signal, speech patterns, response consistency, linguistic authenticity, that human attention tends to miss while managing the conversation.",
  },
  {
    question: "How is real-time analysis different from post-interview scoring?",
    answer: "Post-interview scoring happens after the conversation ends, when the interviewer can no longer ask follow-up questions. Real-time analysis during the interview surfaces signals while there is still time to act on them. TrueVoice HQ provides insight alongside the conversation so interviewers can probe further on patterns as they emerge, not reconstruct them from memory afterward.",
  },
  {
    question: "Does TrueVoice HQ replace human judgment in hiring?",
    answer: "No. It adds structured signal to human judgment. A single speech pattern means nothing. Consistent patterns across a full interview mean something worth noting. The goal is to give interviewers more to work with, not to automate the decision. Every hire still involves a human who has spoken with the candidate.",
  },
  {
    question: "What kinds of interviews does TrueVoice HQ work for?",
    answer: "TrueVoice HQ is built for live video interviews. It works with standard video conferencing and analyzes the conversation in real time as it happens. It is not designed for pre-recorded asynchronous screening.",
  },
  {
    question: "How long does setup take?",
    answer: "Most interviewers are running their first live session within minutes of creating an account. There is no complex integration or IT setup required to start.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Common questions.
          </h2>
        </div>

        <div className="divide-y divide-border">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-start justify-between gap-4 py-5 text-left group"
              >
                <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors leading-snug">
                  {faq.question}
                </span>
                <span className="flex-shrink-0 mt-0.5 text-muted-foreground group-hover:text-accent transition-colors">
                  {openIndex === i ? <Minus size={16} /> : <Plus size={16} />}
                </span>
              </button>
              {openIndex === i && (
                <p className="text-sm text-muted-foreground leading-relaxed pb-5 -mt-1">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
