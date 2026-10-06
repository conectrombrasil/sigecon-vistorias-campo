// Service worker do app Imóveis em Campo (antigo Vistorias em Campo).
// Tudo que é buscado com sucesso fica guardado; se a rede falhar, usa o que já está guardado.

const CACHE_NOME = 'imoveis-campo-v2'; // trocar o número força os celulares a renovarem o cache
const ARQUIVOS_ESSENCIAIS = [
  './imoveis-campo.html',
  './manifest.json',
  './icone.svg',
  './icone-180.png',
  './icone-192.png',
  './icone-512.png',
  './icone-maskable-512.png',
];

self.addEventListener('install', (evento) => {
  self.skipWaiting();
  evento.waitUntil(
    caches.open(CACHE_NOME).then((cache) => cache.addAll(ARQUIVOS_ESSENCIAIS))
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NOME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  if (req.method !== 'GET') return; // POST (sincronização) passa direto

  evento.respondWith(
    fetch(req)
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(CACHE_NOME).then((cache) => cache.put(req, copia)).catch(() => {});
        return resposta;
      })
      .catch(() => caches.match(req).then((cacheado) => cacheado || Promise.reject('offline-sem-cache')))
  );
});
