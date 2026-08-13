import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"
import Footer from "@/components/landing/Footer"
import { getPost } from "@/data/posts"
import { faqs } from "@/components/landing/FAQSection"
import DOMPurify from "dompurify"

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getPost(slug) : undefined
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    document.documentElement.classList.remove("dark")
  }, [])

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl px-6 pt-40 pb-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">404</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Article not found</h1>
          <p className="text-muted-foreground mb-8">
            This article doesn't exist or may have been moved.
          </p>
          <Link to="/blog">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  const canonical = post.canonical ?? `https://truevoicehq.com/blog/${post.slug}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: post.author,
      url: post.authorUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "TrueVoice HQ",
      url: "https://truevoicehq.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
  }

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      {/* Dark navy hero */}
      <section style={{ backgroundColor: "#0f1f1c" }} className="pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors duration-150"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Blog
          </Link>

          {/* Category + date pill */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <span
              className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ backgroundColor: "rgba(168,227,74,0.12)", color: "#a8e34a" }}
            >
              {post.category}
            </span>
            <span style={{ color: "rgba(255,255,255,0.35)" }} className="text-xs">·</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{post.date}</span>
          </div>

          {/* Title */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight uppercase leading-tight mb-6"
            style={{ color: "#ffffff" }}
          >
            {post.title}
          </h1>

          {/* Author byline */}
          <div className="flex items-center justify-center gap-2">
            <a
              href={post.authorUrl}
              className="text-sm font-medium transition-colors"
              style={{ color: "rgba(255,255,255,0.7)" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              {post.author}
            </a>
            <span style={{ color: "rgba(255,255,255,0.3)" }} className="text-xs">·</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{post.readTime}</span>
          </div>
        </div>
      </section>

      {/* Main content — cream background */}
      <div style={{ backgroundColor: "#faf7f2" }} className="px-6 py-12">
        <div className="max-w-[680px] mx-auto">

          {/* Direct Answer box */}
          <div
            className="mb-10 rounded-lg p-6"
            style={{ backgroundColor: "#ffffff", borderLeft: "4px solid #0e9f6e" }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "#0e9f6e" }}
            >
              Direct Answer
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#3d3530" }}>
              {post.description}
            </p>
          </div>

          {/* Article body */}
          <div
            className="
              prose prose-neutral max-w-none
              [&_p]:mb-5 [&_p]:leading-relaxed [&_p]:text-[#3d3530]
              [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:text-[#1a1210]
              [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[#1a1210]
              [&_ul]:mb-5 [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_li]:list-disc [&_li]:leading-relaxed [&_li]:text-[#3d3530]
              [&_ol]:mb-5 [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ol_li]:leading-relaxed [&_ol_li]:text-[#3d3530]
              [&_a]:text-[#0e9f6e] [&_a]:underline [&_a]:underline-offset-2
              [&_strong]:font-semibold [&_strong]:text-[#1a1210]
              [&_blockquote]:border-l-4 [&_blockquote]:border-[#0e9f6e] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#6b5e58]
            "
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(post.body, {
                ALLOWED_TAGS: [
                  "p", "br", "strong", "em", "b", "i", "u",
                  "h2", "h3", "h4", "h5", "h6",
                  "ul", "ol", "li",
                  "a", "blockquote", "code", "pre",
                  "table", "thead", "tbody", "tr", "th", "td"
                ],
                ALLOWED_ATTR: ["href", "target", "rel", "class"],
                ALLOW_DATA_ATTR: false,
              }),
            }}
          />
        </div>
      </div>

      {/* FAQ section */}
      <div style={{ backgroundColor: "#f9fafb" }} className="px-6 py-14">
        <div className="max-w-[680px] mx-auto">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "#0e9f6e" }}
          >
            FAQ
          </p>
          <h2
            className="text-xl font-bold uppercase tracking-tight mb-8"
            style={{ color: "#1a1210" }}
          >
            Frequently Asked Questions
          </h2>
          <div style={{ borderTop: "1px solid #e5e7eb" }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-start justify-between gap-4 py-4 text-left"
                >
                  <span className="text-sm font-bold leading-snug" style={{ color: "#1a1210" }}>
                    {faq.question}
                  </span>
                  <span
                    className="flex-shrink-0 mt-0.5 text-xl font-light leading-none"
                    style={{ color: "#0e9f6e" }}
                  >
                    {openFaq === i ? "−" : "+"}
                  </span>
                </button>
                {openFaq === i && (
                  <p className="text-sm leading-relaxed pb-4 -mt-1" style={{ color: "#3d3530" }}>
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA block */}
      <section style={{ backgroundColor: "#0f1f1c" }} className="px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "#a8e34a" }}
          >
            TrueVoice HQ
          </p>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight leading-tight mb-4"
            style={{ color: "#ffffff" }}
          >
            Ready to hear what the interview is actually telling you?
          </h2>
          <p
            className="text-sm leading-relaxed mb-8 max-w-md mx-auto"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Real-time speech pattern analysis during live video interviews. Structured signal alongside human judgment.
          </p>
          <Link to="/demo">
            <Button
              className="gap-1.5 font-semibold uppercase tracking-wide px-6"
              style={{ backgroundColor: "#a8e34a", color: "#0f1f1c" }}
            >
              See a Demo
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default BlogPost
