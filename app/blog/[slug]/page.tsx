import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPostBySlug, getAllSlugs, blogPosts } from '@/lib/blog'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
  }
}

function parseInlineMarkdown(text: string) {
  const tokens = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^\)]+\))/g)

  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={idx} className="text-black font-semibold">
          {token.slice(2, -2)}
        </strong>
      )
    }

    const linkMatch = token.match(/^\[([^\]]+)\]\(([^\)]+)\)$/)
    if (linkMatch) {
      return (
        <Link key={idx} href={linkMatch[2]} className="text-black underline hover:no-underline">
          {linkMatch[1]}
        </Link>
      )
    }

    return token
  })
}

function renderContent(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} className="text-2xl font-black text-black mt-10 mb-4">
          {line.replace('## ', '')}
        </h2>
      )
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <p key={key++} className="font-bold text-black mb-2">
          {line.replace(/\*\*/g, '')}
        </p>
      )
    } else if (line.startsWith('- ')) {
      // Collect list items
      const items: string[] = [line.replace('- ', '')]
      while (i + 1 < lines.length && lines[i + 1].startsWith('- ')) {
        i++
        items.push(lines[i].replace('- ', ''))
      }
      elements.push(
        <ul key={key++} className="list-disc pl-6 mb-4 space-y-1 text-[#333]">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      )
    } else if (line.trim() !== '') {
      // Parse inline bold within paragraph
      const parts = line.split(/(\*\*[^*]+\*\*)/)
      elements.push(
        <p key={key++} className="text-[#333] leading-relaxed mb-4">
          {parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={idx} className="text-black font-semibold">{part.slice(2, -2)}</strong>
            }
            return part
          })}
        </p>
      )
    }
  }

  return elements
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const otherPosts = blogPosts.filter((p) => p.slug !== params.slug).slice(0, 2)

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="text-xs text-[#A0A0A0] hover:text-white transition-colors tracking-widest uppercase font-semibold mb-6 inline-block"
          >
            ← Back to Blog
          </Link>
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-4">
            {post.date}
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">{post.title}</h1>
          <p className="mt-4 text-[#A0A0A0] text-lg leading-relaxed">{post.excerpt}</p>
          <div className="mt-6 flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Joshua Fink</p>
              <p className="text-xs text-[#A0A0A0]">Affiliate Broker · Compass Real Estate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Article body */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-base">{renderContent(post.content)}</div>

        {/* Author CTA */}
        <div className="mt-14 border-t border-[#E8E8E8] pt-10">
          <div className="bg-[#F5F5F5] p-8">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
              About the Author
            </p>
            <h3 className="text-xl font-black text-black mb-2">Joshua Fink</h3>
            <p className="text-sm text-[#444] leading-relaxed mb-5">
              Affiliate Broker at Compass Real Estate with 13+ years of experience and 100+ homes
              sold annually across Middle Tennessee. Diamond &amp; Titan Award winner.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-black text-white text-sm font-bold px-6 py-3 tracking-wide hover:bg-[#222] transition-colors"
              >
                Contact Joshua
              </Link>
              <a
                href="tel:6155512727"
                className="inline-flex items-center justify-center border border-black text-black text-sm font-bold px-6 py-3 tracking-wide hover:bg-black hover:text-white transition-colors"
              >
                615-551-2727
              </a>
            </div>
          </div>
        </div>

        {/* More posts */}
        {otherPosts.length > 0 && (
          <div className="mt-12">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
              More Articles
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {otherPosts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="border border-[#E8E8E8] p-5 hover:shadow-md transition-shadow group"
                >
                  <p className="text-xs text-[#A0A0A0] mb-2">{p.date}</p>
                  <p className="text-sm font-bold text-black leading-snug group-hover:underline">
                    {p.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
