import { useEffect } from "react"
import { Link } from "react-router-dom"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/landing/Footer"
import { posts } from "@/data/posts"

const ease = [0.16, 1, 0.3, 1]

const Blog = () => {
  const { setTheme } = useTheme()
  useEffect(() => { setTheme("light") }, [setTheme])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Blog</p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Insights on hiring intelligence.
          </h1>
          <p className="text-lg text-muted-foreground mb-14">
            Research, guides, and perspectives from the TrueVoice HQ team.
          </p>
        </motion.div>

        {posts.length === 0 ? (
          <motion.p
            className="text-muted-foreground text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Articles coming soon.
          </motion.p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {posts.map((post, i) => (
              <motion.article
                key={post.slug}
                className="py-8 first:pt-0"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.07, ease }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {post.category}
                  </span>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-xs text-muted-foreground">{post.date}</span>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-xs text-muted-foreground">{post.readTime}</span>
                </div>

                <h2 className="text-xl font-bold text-foreground mb-2 leading-snug">
                  <Link to={`/blog/${post.slug}`} className="hover:text-primary transition-colors duration-150">
                    {post.title}
                  </Link>
                </h2>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {post.description}
                </p>

                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-2"
                >
                  Read more
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default Blog
