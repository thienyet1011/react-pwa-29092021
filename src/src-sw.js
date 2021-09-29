import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

// This clientClaim() should be at the top level
// of your service worker, not inside of e.g.,
// an event handler
clientsClaim();

/**
 * We are not wrapping it in a 'message' event as per the new update.
 * @see https://developers.google.com/web/tools/workbox/modules/workbox-core
 */
 // eslint-disable-next-line no-undef
 self.skipWaiting();

 // eslint-disable-next-line no-undef
 precacheAndRoute(self.__WB_MANIFEST);

 // Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
registerRoute(
    ({url}) => url.origin === 'https://fonts.googleapis.com',
    new StaleWhileRevalidate({
      cacheName: 'google-fonts-stylesheets',
    })
  );
  
  // Cache the underlying font files with a cache-first strategy for 1 year.
  registerRoute(
    ({url}) => url.origin === 'https://fonts.gstatic.com',
    new CacheFirst({
      cacheName: 'google-fonts-webfonts',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 365,
          maxEntries: 30,
        }),
      ],
    })
  );

  // Cache image
  registerRoute(
    ({request}) => request.destination === 'image',
    new CacheFirst({
      cacheName: 'images',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // Cache css and javascript files
  registerRoute(
    ({request}) => request.destination === 'script' ||
                    request.destination === 'style',
    new StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  // Cache third-party api
  registerRoute(
    ({url}) => url.origin === 'https://api.thmoviedb.org' ||
        url.pathname === '/3/discover/tv',
    new StaleWhileRevalidate({
      cacheName: 'movie-api-response',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 1,
        }),
      ]
    })
  );