import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Fragment } from 'react'
import { getPostBySlug, getAllSlugs, getRelatedPosts, type BlogPost } from '@/lib/blog'
import { linkifyLocations } from '@/lib/linkify-neighborhoods'
import SuburbLeadForm from '@/components/SuburbLeadForm'

interface Props {
  params: { slug: string }
}

const SITE_URL = 'https://www.joshuafink.com'
const AUTHOR_NAME = 'Joshua Fink'
const AUTHOR_URL = `${SITE_URL}/about`
const PUBLISHER_LOGO = `${SITE_URL}/compass-logo-black.png`

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

function isoDate(human: string): string | undefined {
  const d = new Date(human)
  if (isNaN(d.getTime())) return undefined
  return d.toISOString()
}

function wordCount(content: string): number {
  return content
    .replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
    .replace(/[#*_`>-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
}

// Average adult silent reading speed ~225 wpm (Brysbaert 2019). Round
// up so a 220-word post still shows "1 min read" rather than "0".
function readingTimeMinutes(content: string): number {
  return Math.max(1, Math.ceil(wordCount(content) / 225))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) return { title: 'Post Not Found' }
  const canonical = `${SITE_URL}/blog/${post.slug}`
  const publishedIso = isoDate(post.date)
  const modifiedIso = post.dateModified ? isoDate(post.dateModified) : publishedIso
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: canonical,
      siteName: 'Joshua Fink | Compass Real Estate',
      publishedTime: publishedIso,
      modifiedTime: modifiedIso,
      authors: [AUTHOR_URL],
      // og:image auto-injected by app/blog/[slug]/opengraph-image.tsx —
      // don't set here or we'd emit two og:image tags.
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      // twitter:image pulls from the same opengraph-image.tsx route.
    },
    authors: [{ name: AUTHOR_NAME, url: AUTHOR_URL }],
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

    return <Fragment key={idx}>{linkifyLocations(token)}</Fragment>
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
      elements.push(
        <p key={key++} className="text-[#333] leading-relaxed mb-4">
          {parseInlineMarkdown(line)}
        </p>
      )
    }
  }

  return elements
}

function buildJsonLd(post: BlogPost) {
  const canonical = `${SITE_URL}/blog/${post.slug}`
  const publishedIso = isoDate(post.date)
  const modifiedIso = post.dateModified ? isoDate(post.dateModified) : publishedIso

  const blogPosting: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${canonical}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    headline: post.title,
    description: post.excerpt,
    url: canonical,
    wordCount: wordCount(post.content),
    keywords: post.category ? [post.category] : undefined,
    articleSection: post.category,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    datePublished: publishedIso,
    dateModified: modifiedIso,
    timeRequired: `PT${readingTimeMinutes(post.content)}M`,
    author: {
      '@type': 'Person',
      '@id': `${SITE_URL}#joshua-fink`,
      name: AUTHOR_NAME,
      url: AUTHOR_URL,
      jobTitle: 'Affiliate Broker',
      worksFor: { '@type': 'Organization', name: 'Compass Real Estate' },
      sameAs: [
        'https://www.compass.com/agents/joshua-fink/',
        'https://www.linkedin.com/in/joshuafinkgroup/',
        'https://www.facebook.com/profile.php?id=100064076493905',
        'https://www.instagram.com/joshuafinkgroup',
        'https://x.com/JoshuaFinkGroup',
      ],
    },
    publisher: {
      '@type': 'Organization',
      name: 'Joshua Fink Group',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: PUBLISHER_LOGO },
    },
    image: post.coverImage
      ? {
          '@type': 'ImageObject',
          url: post.coverImage.startsWith('http') ? post.coverImage : `${SITE_URL}${post.coverImage}`,
        }
      : { '@type': 'ImageObject', url: PUBLISHER_LOGO },
    // SpeakableSpecification — tells Google Assistant + Alexa which parts of
    // the page are safe to read aloud for voice search answers. The title
    // (h1) + the first paragraph of body content are the natural target.
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', 'article p:first-of-type', 'article h2 + p'],
    },
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
    ],
  }

  const faqSchema = post.faq
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : undefined

  return { blogPosting, breadcrumb, faqSchema }
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const otherPosts = getRelatedPosts(params.slug, 3)
  const { blogPosting, breadcrumb, faqSchema } = buildJsonLd(post)
  const modifiedDifferent = post.dateModified && post.dateModified !== post.date

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Visual breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-xs text-[#A0A0A0] tracking-widest uppercase font-semibold">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">·</li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ol>
          </nav>

          {post.category && (
            <p className="text-xs font-semibold tracking-widest text-brand-crimson uppercase mb-3">
              {post.category}
            </p>
          )}
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-4">
            Published <time dateTime={isoDate(post.date)}>{post.date}</time>
            {modifiedDifferent && post.dateModified && (
              <>
                {' · Updated '}
                <time dateTime={isoDate(post.dateModified)}>{post.dateModified}</time>
              </>
            )}
            {' · '}{readingTimeMinutes(post.content)} min read
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight font-display">
            {post.title}
          </h1>
          <p className="mt-4 text-[#A0A0A0] text-lg leading-relaxed">{post.excerpt}</p>
          <div className="mt-6 flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-white">
                By{' '}
                <Link href={AUTHOR_URL} className="underline underline-offset-4 hover:no-underline">
                  Joshua Fink
                </Link>
              </p>
              <p className="text-xs text-[#A0A0A0]">
                Affiliate Broker · Compass Real Estate · Middle Tennessee
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Article body */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-base">{renderContent(post.content)}</div>

        {/* Compliance disclosure (only rendered when the post requires it) */}
        {post.disclosure && (
          <aside
            role="note"
            aria-label="Broker disclosure"
            className="mt-10 border-l-4 border-brand-crimson bg-neutral-50 p-6 rounded-r-lg"
          >
            <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-2">
              Disclosure
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed">{post.disclosure}</p>
          </aside>
        )}

        {/* FAQ */}
        {post.faq && post.faq.length > 0 && (
          <div className="mt-14 border-t border-[#E8E8E8] pt-10">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Common Questions
            </p>
            <h2 className="text-2xl font-black text-black mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {post.faq.map((f, i) => (
                <div key={i} className="bg-[#F5F5F5] p-6 border-l-4 border-black rounded-r-lg">
                  <h3 className="text-base font-black text-black mb-2">{f.q}</h3>
                  <p className="text-sm text-[#444] leading-relaxed">{parseInlineMarkdown(f.a)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Author CTA */}
        <div className="mt-14 border-t border-[#E8E8E8] pt-10">
          <div className="bg-[#F5F5F5] p-8 rounded-2xl">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
              About the Author
            </p>
            <h3 className="text-xl font-black text-black mb-2">Joshua Fink</h3>
            <p className="text-sm text-[#444] leading-relaxed mb-5">
              Affiliate Broker at Compass Real Estate with 17+ years of experience and 100+ homes
              sold annually across Middle Tennessee. Diamond &amp; Titan Award winner. Licensed
              with the Tennessee Real Estate Commission. Partner to the Children&apos;s Miracle
              Network supporting Vanderbilt Children&apos;s Hospital.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-black text-white text-sm font-bold px-6 py-3 rounded-full tracking-wide hover:bg-[#222] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Contact Joshua
              </Link>
              <a
                href="tel:6155512727"
                className="inline-flex items-center justify-center border border-black text-black text-sm font-bold px-6 py-3 rounded-full tracking-wide hover:bg-black hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                aria-label="Call Joshua at 615-551-2727"
              >
                615-551-2727
              </a>
            </div>
          </div>
        </div>

        {/* Inline lead capture — convert organic blog readers without sending them to /contact */}
        <div className="mt-12">
          <div className="border border-[#E8E8E8] rounded-2xl p-8">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
              Talk to Joshua
            </p>
            <h3 className="text-2xl font-black text-black mb-2">
              Questions on this? Send a quick note.
            </h3>
            <p className="text-sm text-[#444] leading-relaxed mb-6">
              Buying, selling, or just exploring Middle Tennessee? Joshua will personally reach
              out same-day with answers, comps, or a tailored search.
            </p>

            <SuburbLeadForm
              successTitle="Message Sent!"
              successMessage={
                <>
                  Joshua will reach out same-day. For anything urgent, call{' '}
                  <a href="tel:6155512727" className="text-black font-semibold underline">615-551-2727</a>.
                </>
              }
              resetLabel="Send Another"
            >
              <input type="hidden" name="lead_type" value="general" />
              <input type="hidden" name="source" value="blog" />
              <input type="hidden" name="blog_slug" value={post.slug} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Full Name *</label>
                  <input type="text" id="name" name="name" required placeholder="Jane Smith"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Phone *</label>
                  <input type="tel" id="phone" name="phone" required placeholder="615-555-0000"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Email Address *</label>
                <input type="email" id="email" name="email" required placeholder="you@example.com"
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
              </div>

              <div>
                <label htmlFor="body" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">How Can Joshua Help? (optional)</label>
                <textarea id="body" name="body" rows={4}
                  placeholder="Buying, selling, neighborhood questions — anything helps Joshua respond with what you need."
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors resize-y" />
              </div>

              <p className="text-xs text-[#A0A0A0]">* Joshua responds same-day. No spam, no pressure.</p>

              <button type="submit"
                className="w-full sm:w-auto text-white text-sm font-bold px-10 py-4 tracking-wide transition-colors"
                style={{ backgroundColor: '#C41E3A' }}>
                Send Message →
              </button>
            </SuburbLeadForm>
          </div>
        </div>

        {/* More posts */}
        {otherPosts.length > 0 && (
          <div className="mt-12">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
              Related Articles
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {otherPosts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="border border-[#E8E8E8] p-5 rounded-2xl hover:shadow-md transition-shadow group"
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

      {/* BlogPosting + BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPosting) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </div>
  )
}
