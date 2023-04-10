self.addEventListener("install",(e=>{e.waitUntil(caches.open("v1").then((e=>e.addAll(["/","/index.html","/styles.css","/script.js","/icon-192x192.png","/icon-512x512.png"]))))})),self.addEventListener("fetch",(e=>{e.respondWith(caches.match(e.request).then((t=>t||fetch(e.request))))}));
//# sourceMappingURL=sw.js.map
