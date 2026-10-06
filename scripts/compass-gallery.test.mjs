import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GALLERY_CAP,
  choosePhotoSet,
  galleryFromHtml,
  galleryFromMedia,
  normalizeGalleryUrl,
} from './compass-gallery.mjs';

const HERO = 'https://www.compass.com/m/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/origin.jpg';

function mediaItem(id, category = 0) {
  return {
    category,
    originalUrl: `https://www.compass.com/m/${id}/origin.jpg`,
    thumbnailUrl: `https://www.compass.com/m/${id}/165x165.jpg`,
  };
}

function pageHtml(listingMedia, nearbyMedia) {
  const data = {
    props: {
      listingRelation: { listing: { media: listingMedia } },
      newListingsInZip: [{ media: nearbyMedia }],
    },
  };
  return `<script>window.__INITIAL_DATA__ = ${JSON.stringify(data)};</script>`;
}

test('normalizeGalleryUrl rewrites Compass photos to 2048 webp and drops junk', () => {
  assert.equal(
    normalizeGalleryUrl('https://www.compass.com/m/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/origin.jpg'),
    'https://www.compass.com/m/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/2048x1536.webp',
  );
  assert.equal(normalizeGalleryUrl('https://example.com/photo.jpg'), '');
  assert.equal(normalizeGalleryUrl('https://www.compass.com/m/13/origin.jpg'), '');
});

test('galleryFromHtml keeps this listing and ignores nearby homes', () => {
  const listing = [mediaItem('a'.repeat(32)), mediaItem('b'.repeat(32))];
  const nearby = [mediaItem('c'.repeat(32)), mediaItem('d'.repeat(32))];
  const urls = galleryFromHtml(pageHtml(listing, nearby));
  assert.deepEqual(urls, [
    `https://www.compass.com/m/${'a'.repeat(32)}/2048x1536.webp`,
    `https://www.compass.com/m/${'b'.repeat(32)}/2048x1536.webp`,
  ]);
});

test('galleryFromMedia caps at 30 and skips non-photo categories when photos exist', () => {
  const media = [];
  for (let i = 0; i < 35; i++) media.push(mediaItem(`photo${String(i).padStart(8, '0')}xxxxxxxx`));
  media.push(mediaItem('floorplanxxxxxxxxxxxxxxxx', 2));
  const urls = galleryFromMedia(media);
  assert.equal(urls.length, GALLERY_CAP);
  assert.equal(urls.some((url) => url.includes('floorplan')), false);
});

test('a thin scrape keeps a richer prior gallery', () => {
  const prior = {
    photoUrls: [
      normalizeGalleryUrl(HERO),
      normalizeGalleryUrl('https://www.compass.com/m/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/origin.jpg'),
      normalizeGalleryUrl('https://www.compass.com/m/cccccccccccccccccccccccccccccccc/origin.jpg'),
    ],
  };
  const kept = choosePhotoSet({ gallery: [HERO], hero: HERO, prior });
  assert.equal(kept.photoUrls.length, 3);
  assert.equal(kept.imageUrl, kept.photoUrls[0]);
});

test('a real gallery replaces the prior set and puts the hero first', () => {
  const second = 'https://www.compass.com/m/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/origin.jpg';
  const third = 'https://www.compass.com/m/cccccccccccccccccccccccccccccccc/origin.jpg';
  const chosen = choosePhotoSet({
    gallery: [second, HERO, third],
    hero: HERO,
    prior: { photoUrls: [normalizeGalleryUrl(second)] },
  });
  assert.equal(chosen.photoUrls.length, 3);
  assert.equal(chosen.photoUrls[0], normalizeGalleryUrl(HERO));
  assert.equal(chosen.imageUrl, normalizeGalleryUrl(HERO));
});

test('missing JSON falls back to the hero instead of inventing photos', () => {
  assert.deepEqual(galleryFromHtml('<html>no data</html>'), []);
  const chosen = choosePhotoSet({ gallery: [], hero: HERO, prior: null });
  assert.deepEqual(chosen.photoUrls, [normalizeGalleryUrl(HERO)]);
});
