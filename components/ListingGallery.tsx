'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

type Props = {
  photos: string[]
  alt: string
  statusLabel: string
  statusClassName: string
}

export default function ListingGallery({ photos, alt, statusLabel, statusClassName }: Props) {
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const count = photos.length
  const safeIndex = count ? Math.min(index, count - 1) : 0
  const current = photos[safeIndex]

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === 'ArrowRight') setIndex((i) => (count ? (i + 1) % count : 0))
      if (event.key === 'ArrowLeft') setIndex((i) => (count ? (i - 1 + count) % count : 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, count])

  function step(delta: number) {
    if (!count) return
    setIndex((i) => (i + delta + count) % count)
  }

  return (
    <div>
      <div className="relative bg-neutral-100 aspect-[16/10] sm:aspect-[16/9] overflow-hidden rounded-2xl flex items-center justify-center">
        {current ? (
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setOpen(true)}
            aria-label={`Open photo ${safeIndex + 1} of ${count}`}
          >
            <Image
              src={current}
              alt={alt}
              fill
              priority={safeIndex === 0}
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </button>
        ) : (
          <div className="text-center text-neutral-400 px-4">
            <span className="text-xs tracking-wide">Photo available on Compass</span>
          </div>
        )}
        <span className={`absolute top-4 left-4 text-xs font-semibold px-3 py-1 rounded-full tracking-wide ${statusClassName}`}>
          {statusLabel}
        </span>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 text-black text-sm font-semibold w-10 h-10 rounded-full"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 text-black text-sm font-semibold w-10 h-10 rounded-full"
              aria-label="Next photo"
            >
              ›
            </button>
            <span className="absolute bottom-4 right-4 bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              {safeIndex + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Listing photos">
          {photos.map((photo, i) => (
            <button
              key={photo}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === safeIndex}
              className={`relative shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                i === safeIndex ? 'border-black' : 'border-transparent'
              }`}
            >
              <Image src={photo} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {open && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative w-full max-w-5xl aspect-[16/10]" onClick={(event) => event.stopPropagation()}>
            <Image src={current} alt={alt} fill className="object-contain" sizes="100vw" />
          </div>
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  step(-1)
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl"
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  step(1)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl"
                aria-label="Next photo"
              >
                ›
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-white text-sm font-semibold"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
