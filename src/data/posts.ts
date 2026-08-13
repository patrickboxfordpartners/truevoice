export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  authorUrl: string;
  category: string;
  readTime: string;
  body: string;
  canonical?: string;
}

export const posts: Post[] = [
  {
    slug: "what-speech-patterns-tell-you-hiring",
    title: "What Do Your Candidate's Speech Patterns Actually Tell You?",
    description: "Hiring managers trust their read on candidates, but the most charismatic interviewers often underperform. Here's what speech patterns actually reveal, and what human attention misses.",
    date: "July 29, 2026",
    author: "Patrick Mitchell",
    authorUrl: "https://linkedin.com/in/patricktmitchell",
    category: "HR / Hiring",
    readTime: "5 min read",
    canonical: "https://truevoicehq.com/blog/what-speech-patterns-tell-you-hiring",
    body: `<p>There is a version of the hiring process that most managers believe in, even when they know better. You meet someone, you talk for forty-five minutes, and you walk away with a feeling. They were sharp. They were polished. They knew their stuff.</p>

<p>That feeling is real. It is also not very reliable.</p>

<p>The most impressive interviewers, the ones who fill the room and answer every question with a clean story and a tidy lesson learned, are often the candidates who have practiced the most. That is not a bad sign, but it is not a predictor of job performance. Interviewing is its own skill. And it has almost nothing to do with what the role actually requires.</p>

<p>The people who end up being your best hires do not always look that way at first. They pause before they answer. They give you specifics instead of frameworks. They are not performing. They are actually thinking about your question.</p>

<p>The difference is there in the conversation. Most of the time, it just gets missed.</p>

<h2>What Speech Patterns Actually Reveal</h2>

<p>When people talk about analyzing a candidate's speech, they usually mean something broad and soft, like tone or confidence. That is not what we are talking about here.</p>

<p>There are specific, observable patterns in how people speak during interviews that carry real information. They are not personality scores or trait ratings. They are signals, and like any signal, their value depends on whether you are actually catching them.</p>

<p><strong>Response timing.</strong> How long a candidate takes to answer a direct question tells you something. When someone fires back a clean answer to a complex question in under three seconds, that is worth noticing. Complex questions that have been asked a hundred times in prep sessions have pre-loaded answers. They come out fast and smooth. Genuine thinking takes longer. A candidate who pauses, starts a sentence, adjusts, and then answers is usually working through the actual question, not retrieving a stored response.</p>

<p><strong>Hedging language.</strong> There is a difference between "I kind of led that project" and "I led that project." Both might be true. Only one tells you the person owns the work they are describing. Candidates who consistently hedge their accomplishments, who reach for "sort of," "basically," "I think maybe," or "we kind of decided," are often telling you something about their relationship to their own experience. It may be a confidence issue. It may be that the story is softer than it sounds. Either way, the pattern is worth noting.</p>

<p><strong>Consistency between content and delivery.</strong> When someone describes a genuinely stressful situation, the language tends to reflect that. Specific people. Real decisions. Active verbs. When someone is telling a story they are not entirely confident in, the language gets passive and general. "Things kind of came together," "the team worked through it," "there were some challenges." If a candidate is describing a high-stakes moment calmly but the words themselves are vague and evasive, that inconsistency is information.</p>

<p><strong>Specificity under pressure.</strong> This is one of the clearest signals. When someone has genuinely done the thing they are describing, they have details. Names. Numbers. The specific moment when something shifted. They remember what it was actually like. Rehearsed answers do not have that texture. They have frameworks and principles. "What I always try to do in situations like that is..." is a very different sentence from "We had three days before the cutoff, and the client had not responded, so I called the director directly."</p>

<h2>What You Are Missing in Real Time</h2>

<p>Here is the honest version of what happens in an interview.</p>

<p>You are tracking the conversation. You are thinking about your next question. You are watching someone's body language. You are glancing at your notes or your phone to check the time. You are listening for whether the answer connects to the job.</p>

<p>That is a lot to manage across forty-five minutes. And the signals above, response timing, linguistic hedging, consistency between story and delivery, specificity under pressure, require sustained attention across the full arc of the conversation. A single instance of passive language means almost nothing. The tenth instance means something.</p>

<p>Human attention in interviews is not designed to track those patterns. It was not built to. That is not a criticism. It is just how attention works under load.</p>

<p>The signals are in the conversation. They are just not being captured.</p>

<h2>How TrueVoice HQ Approaches This</h2>

<p>TrueVoice HQ runs analysis during the live interview, not after it.</p>

<p>The difference matters. A post-hoc transcript review can tell you what happened, but by then the conversation is over. Real-time analysis means the interviewer has signal while there is still time to act on it, to ask a follow-up, to probe a pattern, to dig into the vagueness before the candidate has left the room.</p>

<p>The tool is not listening for magic words. It tracks patterns across the conversation, the same patterns that a very experienced interviewer might pick up on intuitively, and surfaces them in a structured way so they are not lost in the noise of managing everything else.</p>

<h2>One Signal Is Not a Verdict</h2>

<p>A single hedge means nothing. A single fast answer means nothing. A candidate who takes a long pause on one question might be tired, or might not have heard clearly, or might be working through your question as carefully as they can. None of these signals are conclusive on their own.</p>

<p>What is worth paying attention to is patterns across a conversation. Consistent evasion. Consistent specificity. A shift in language at exactly the moments when the questions get harder.</p>

<p>The goal is not to replace the human in the room. The judgment call still belongs to the person conducting the interview. The goal is to give that person better data, and to surface the patterns that were always there but that human attention, spread across a forty-five minute conversation with a hundred things competing for it, tends to miss.</p>

<p>Good hiring is hard. It gets a little less hard when you are actually seeing the whole conversation.</p>`,
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}
