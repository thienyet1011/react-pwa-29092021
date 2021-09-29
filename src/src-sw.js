import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";

// Used for filtering matches based on status code, header, or both
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Used to limit entries in cache, remove entries after a certain period of time
import { ExpirationPlugin } from 'workbox-expiration';

import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

// This clientClaim() should be at the top level of your service worker, not inside of an event handler
clientsClaim();

/**
 * We are not wrapping it in a 'message' event as per the new update.
 * @see https://developers.google.com/web/tools/workbox/modules/workbox-core
 */
 // eslint-disable-next-line no-undef
 self.skipWaiting();

 // eslint-disable-next-line no-undef
 /*
There are a number of items that are great candidates for precaching: your web app's start URL, 
your offline fallback page, and key JavaScript and CSS files. 
By precaching files, you’ll guarantee that they’re available in the cache when the service worker takes control of the page
 */
 precacheAndRoute(self.__WB_MANIFEST);

/*
Handling a Route with a Workbox Strategy:

+ Stale While Revalidate
    This strategy will use a cached response for a request if it is available and update the cache in the background with a response from the network. 
    (If it’s not cached it will wait for the network response and use that.) This is a fairly safe strategy as it means users are regularly updating their cache. 
    The downside of this strategy is that it’s always requesting an asset from the network, using up the user’s bandwidth.
+ Network First
    This will try to get a response from the network first. If it receives a response, it’ll pass that to the browser and also save it to a cache. 
    If the network request fails, the last cached response will be used.
+ Cache First
    This strategy will check the cache for a response first and use that if one is available. 
    If the request isn’t in the cache, the network will be used and any valid response will be added to the cache before being passed to the browser.
+ Network Only
    Force the response to come from the network.
+ Cache Only
    Force the response to come from the cache.
*/

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


  /*
// Cache page navigations (html) with a Network First strategy
registerRoute(
  // Check to see if the request is a navigation to a new page
  ({ request }) => request.mode === 'navigate',
  // Use a Network First caching strategy
  new NetworkFirst({
    // Put all cached files in a cache named 'pages'
    cacheName: 'pages',
    plugins: [
      // Ensure that only requests that result in a 200 status are cached
      new CacheableResponsePlugin({
        statuses: [200],
      }),
    ],
  }),
);

// Cache CSS, JS, and Web Worker requests with a Stale While Revalidate strategy
registerRoute(
  // Check to see if the request's destination is style for stylesheets, script for JavaScript, or worker for web worker
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  // Use a Stale While Revalidate caching strategy
  new StaleWhileRevalidate({
    // Put all cached files in a cache named 'assets'
    cacheName: 'assets',
    plugins: [
      // Ensure that only requests that result in a 200 status are cached
      new CacheableResponsePlugin({
        statuses: [200],
      }),
    ],
  }),
);

// Cache images with a Cache First strategy
registerRoute(
  // Check to see if the request's destination is style for an image
  ({ request }) => request.destination === 'image',
  // Use a Cache First caching strategy
  new CacheFirst({
    // Put all cached files in a cache named 'images'
    cacheName: 'images',
    plugins: [
      // Ensure that only requests that result in a 200 status are cached
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      // Don't cache more than 50 items, and expire them after 30 days
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
      }),
    ],
  }),
);
  */