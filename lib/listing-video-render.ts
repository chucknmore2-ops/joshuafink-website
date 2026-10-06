// ffmpeg-only vertical listing video. Ken Burns pan/zoom on the real photos,
// a still text plate, and a silent audio track. No music and no generated motion.

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { LISTING_VIDEO_END_CARD, listingVideoTimeline, type ListingVideoOverlay } from './listing-video'

export const LISTING_VIDEO_WIDTH = 1080
export const LISTING_VIDEO_HEIGHT = 1920
export const FONT_CANDIDATES = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  '/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
  '/usr/share/fonts/truetype/macos/Inter-Bold.ttf',
]

export function resolveListingVideoFont(explicit?: string): string {
  const candidates = [explicit, process.env.LISTING_VIDEO_FONT, ...FONT_CANDIDATES]
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate
  }
  throw new Error(
    'No bold font found for the listing video. Install fonts-dejavu-core or set LISTING_VIDEO_FONT.',
  )
}

export type KenBurnsMotion = 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right'

export function kenBurnsMotion(index: number): KenBurnsMotion {
  const motions: KenBurnsMotion[] = ['zoom-in', 'pan-left', 'zoom-out', 'pan-right']
  return motions[index % motions.length]
}

/** zoompan graph for one still. `frames` is the clip length at 30 fps. */
export function kenBurnsFilter(motion: KenBurnsMotion, frames: number): string {
  const steps = Math.max(frames - 1, 1)
  const y = 'ih/2-(ih/zoom/2)'
  if (motion === 'pan-left' || motion === 'pan-right') {
    const x =
      motion === 'pan-left'
        ? `(iw-iw/zoom)*on/${steps}`
        : `(iw-iw/zoom)*(1-on/${steps})`
    // Cover-scale to a fixed even frame so crop never asks for pixels the
    // photo does not have. z=1.15 leaves room to pan inside that frame.
    return (
      `scale=1400:934:force_original_aspect_ratio=increase,crop=1400:934,` +
      `zoompan=z='1.15':x='${x}':y='${y}':d=${frames}:s=1080x720:fps=30`
    )
  }
  const z =
    motion === 'zoom-out' ? `1.08-0.08*on/${steps}` : `1+0.08*on/${steps}`
  return (
    `scale=1080:720:force_original_aspect_ratio=increase,crop=1080:720,` +
    `zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='${y}':d=${frames}:s=1080x720:fps=30`
  )
}

function filterPath(filePath: string): string {
  return filePath.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/,/g, '\\,')
}

export function overlayDrawtext(fontFile: string, textFile: string, fontsize: number, y: number): string {
  return `drawtext=fontfile=${filterPath(fontFile)}:textfile=${filterPath(textFile)}:fontsize=${fontsize}:fontcolor=white:x=(w-text_w)/2:y=${y}`
}

export function clipFilterScript(opts: {
  motion: KenBurnsMotion
  frames: number
  fontFile: string
  textFiles: { address: string; city: string; specs?: string; price?: string }
}): string {
  const fg = kenBurnsFilter(opts.motion, opts.frames)
  const lines = [
    overlayDrawtext(opts.fontFile, opts.textFiles.address, 54, 1120),
    overlayDrawtext(opts.fontFile, opts.textFiles.city, 32, 1200),
  ]
  if (opts.textFiles.specs) lines.push(overlayDrawtext(opts.fontFile, opts.textFiles.specs, 30, 1272))
  if (opts.textFiles.price) lines.push(overlayDrawtext(opts.fontFile, opts.textFiles.price, 58, 1355))
  const loops = Math.max(opts.frames - 1, 0)
  return [
    `[0:v]scale=${LISTING_VIDEO_WIDTH}:${LISTING_VIDEO_HEIGHT}:force_original_aspect_ratio=increase,crop=${LISTING_VIDEO_WIDTH}:${LISTING_VIDEO_HEIGHT},boxblur=12:1,eq=brightness=-0.12,loop=loop=${loops}:size=1:start=0,fps=30[bg]`,
    `[0:v]${fg}[fg]`,
    `[bg][fg]overlay=(W-w)/2:200,drawbox=x=0:y=1040:w=${LISTING_VIDEO_WIDTH}:h=880:color=black@0.55:t=fill,${lines.join(',')},format=yuv420p,setsar=1[v]`,
  ].join(';\n')
}

export function endCardFilterScript(fontFile: string, textFile: string): string {
  return [
    `drawtext=fontfile=${filterPath(fontFile)}:textfile=${filterPath(textFile)}:fontsize=36:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2`,
    'format=yuv420p',
    'setsar=1',
  ].join(',')
}

export function xfadeFilterScript(photoCount: number, clipSec: number, fadeSec: number): string {
  if (photoCount < 2) return '[0:v]fps=30,format=yuv420p,setsar=1[v]'
  const parts: string[] = []
  let label = '0:v'
  for (let i = 1; i < photoCount; i++) {
    const out = i === photoCount - 1 ? 'v' : `x${i}`
    const offset = (i * (clipSec - fadeSec)).toFixed(3)
    parts.push(`[${label}][${i}:v]xfade=transition=fade:duration=${fadeSec.toFixed(3)}:offset=${offset}[${out}]`)
    label = out
  }
  parts.push(`[v]fps=30,format=yuv420p,setsar=1[vout]`)
  return parts.join(';\n')
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let stderr = ''
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
      if (stderr.length > 12_000) stderr = stderr.slice(-12_000)
    })
    child.on('error', (err) => reject(err))
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg exited ${code}\n${stderr.slice(-2000)}`))
    })
  })
}

async function probe(file: string): Promise<{ width: number; height: number; duration: number; hasAudio: boolean }> {
  const stdout = await new Promise<string>((resolve, reject) => {
    const child = spawn(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration:stream=width,height,codec_type', '-of', 'json', file],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    )
    let out = ''
    let err = ''
    child.stdout.on('data', (chunk: Buffer) => {
      out += chunk.toString()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      err += chunk.toString()
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve(out)
      else reject(new Error(`ffprobe exited ${code} ${err}`))
    })
  })
  const parsed = JSON.parse(stdout) as {
    format?: { duration?: string }
    streams?: Array<{ codec_type?: string; width?: number; height?: number }>
  }
  const video = parsed.streams?.find((stream) => stream.codec_type === 'video')
  const duration = Number(parsed.format?.duration ?? 0)
  if (!video?.width || !video.height || !Number.isFinite(duration)) {
    throw new Error(`Could not probe ${file}`)
  }
  return {
    width: video.width,
    height: video.height,
    duration,
    hasAudio: Boolean(parsed.streams?.some((stream) => stream.codec_type === 'audio')),
  }
}

export interface RenderedListingVideo {
  file: string
  width: number
  height: number
  durationSec: number
  hasAudio: boolean
}

/**
 * Build a 1080x1920 H.264 MP4. Default timing is ~26 seconds (21s of photos
 * plus a 5s end card), which stays inside the 20–30 second window after
 * frame rounding. Pass shorter timings only from tests.
 */
export async function renderListingVideo(opts: {
  photos: string[]
  overlay: ListingVideoOverlay
  outFile: string
  workDir: string
  fontFile?: string
  photoVisibleSec?: number
  endCardSec?: number
  crossfadeSec?: number
}): Promise<RenderedListingVideo> {
  if (opts.photos.length === 0) throw new Error('No listing photos to render')
  const fontFile = resolveListingVideoFont(opts.fontFile)
  const timeline = listingVideoTimeline(opts.photos.length, {
    photoVisibleSec: opts.photoVisibleSec,
    endCardSec: opts.endCardSec,
    crossfadeSec: opts.crossfadeSec,
  })
  await mkdir(opts.workDir, { recursive: true })
  const textDir = path.join(opts.workDir, 'text')
  await mkdir(textDir, { recursive: true })
  const addressFile = path.join(textDir, 'address.txt')
  const cityFile = path.join(textDir, 'city.txt')
  const specsFile = path.join(textDir, 'specs.txt')
  const priceFile = path.join(textDir, 'price.txt')
  const endFile = path.join(textDir, 'end.txt')
  await writeFile(addressFile, `${opts.overlay.address}\n`)
  await writeFile(cityFile, `${opts.overlay.city}\n`)
  if (opts.overlay.specs) await writeFile(specsFile, `${opts.overlay.specs}\n`)
  if (opts.overlay.price) await writeFile(priceFile, `${opts.overlay.price}\n`)
  await writeFile(endFile, `${LISTING_VIDEO_END_CARD}\n`)

  const clipPaths: string[] = []
  for (let i = 0; i < opts.photos.length; i++) {
    const clip = path.join(opts.workDir, `clip-${i}.mp4`)
    const script = clipFilterScript({
      motion: kenBurnsMotion(i),
      frames: timeline.clipFrames,
      fontFile,
      textFiles: {
        address: addressFile,
        city: cityFile,
        specs: opts.overlay.specs ? specsFile : undefined,
        price: opts.overlay.price ? priceFile : undefined,
      },
    })
    const scriptPath = path.join(opts.workDir, `clip-${i}.filter`)
    await writeFile(scriptPath, script)
    await runFfmpeg([
      '-y',
      '-i',
      opts.photos[i],
      '-filter_complex_script',
      scriptPath,
      '-map',
      '[v]',
      '-frames:v',
      String(timeline.clipFrames),
      '-r',
      String(timeline.fps),
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      clip,
    ])
    clipPaths.push(clip)
  }

  const photosOut = path.join(opts.workDir, 'photos.mp4')
  if (clipPaths.length === 1) {
    await runFfmpeg(['-y', '-i', clipPaths[0], '-c', 'copy', photosOut])
  } else {
    const xfadePath = path.join(opts.workDir, 'xfade.filter')
    await writeFile(
      xfadePath,
      xfadeFilterScript(clipPaths.length, timeline.clipSec, timeline.fadeSec),
    )
    await runFfmpeg([
      '-y',
      ...clipPaths.flatMap((clip) => ['-i', clip]),
      '-filter_complex_script',
      xfadePath,
      '-map',
      '[vout]',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-r',
      String(timeline.fps),
      photosOut,
    ])
  }

  const endOut = path.join(opts.workDir, 'end.mp4')
  const endFilter = path.join(opts.workDir, 'end.filter')
  await writeFile(endFilter, endCardFilterScript(fontFile, endFile))
  await runFfmpeg([
    '-y',
    '-f',
    'lavfi',
    '-i',
    `color=c=0x111111:s=${LISTING_VIDEO_WIDTH}x${LISTING_VIDEO_HEIGHT}:r=${timeline.fps}`,
    '-filter_script:v',
    endFilter,
    '-frames:v',
    String(timeline.endFrames),
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-pix_fmt',
    'yuv420p',
    endOut,
  ])

  const silent = path.join(opts.workDir, 'silent.mp4')
  await runFfmpeg([
    '-y',
    '-i',
    photosOut,
    '-i',
    endOut,
    '-filter_complex',
    '[0:v][1:v]concat=n=2:v=1:a=0,format=yuv420p,setsar=1[v]',
    '-map',
    '[v]',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-pix_fmt',
    'yuv420p',
    '-r',
    String(timeline.fps),
    silent,
  ])

  await mkdir(path.dirname(opts.outFile), { recursive: true })
  try {
    await runFfmpeg([
      '-y',
      '-i',
      silent,
      '-f',
      'lavfi',
      '-i',
      'anullsrc=r=44100:cl=stereo',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '64k',
      '-shortest',
      '-movflags',
      '+faststart',
      opts.outFile,
    ])
  } catch {
    await runFfmpeg([
      '-y',
      '-i',
      silent,
      '-f',
      'lavfi',
      '-i',
      'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '64k',
      '-shortest',
      '-movflags',
      '+faststart',
      opts.outFile,
    ])
  }

  const info = await probe(opts.outFile)
  if (info.width !== LISTING_VIDEO_WIDTH || info.height !== LISTING_VIDEO_HEIGHT) {
    throw new Error(`Listing video is ${info.width}x${info.height}, expected 1080x1920`)
  }
  if (!info.hasAudio) throw new Error('Listing video is missing its silent audio track')
  return { file: opts.outFile, width: info.width, height: info.height, durationSec: info.duration, hasAudio: true }
}
