import Link from 'next/link'
import type { BlogPost } from '@/lib/blog'

interface Props {
  post: BlogPost
}

export default function BlogCard({ post }: Props) {
  return (
    <article className="group border border-[#E8E8E8] bg-white p-6 flex flex-col hover:shadow-lg transition-shadow">
      <p className="text-xs text-[#A0A0A0] tracking-widest uppercase mb-3">{post.date}</p>
      <h2 className="text-lg font-bold text-black leading-snug mb-3 group-hover:underline">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      <p className="text-sm text-[#6B6B6B] leading-relaxed mb-5 flex-1">{post.excerpt}</p>
      <Link
        href={`/blog/${post.slug}`}
        className="text-sm font-semibold text-black underline underline-offset-4 hover:no-underline"
      >
        Read More →
      </Link>
    </article>
  )
}
