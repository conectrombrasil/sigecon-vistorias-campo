// Service worker do app de Vistorias em Campo.
// Estratégia simples, pensada pra confiabilidade em vez de sofisticação:
// tudo que é buscado com sucesso fica guardado; se a rede falhar, usa o
// que já está guardado. Isso cobre tanto o próprio app (HTML/CSS/JS)
// quanto os scripts externos (como o do Supabase), que só precisam ser
// baixados uma vez, na primeira visita com internet.

const CACHE_NOME = 'vistorias-campo-v1';
const ARQUIVOS_ESSENCIAIS = [
  './imoveis-campo.html',
  './manifest.json',
  './icone.svg',
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
  if (req.method !== 'GET') return; // POST (ex: chamadas de sincronização) passa direto, nunca é interceptado

  evento.respondWith(
    fetch(req)
      .then((resposta) => {
        // Deu certo: guarda uma cópia atualizada pra próxima vez que faltar rede
        const copia = resposta.clone();
        caches.open(CACHE_NOME).then((cache) => cache.put(req, copia)).catch(() => {});
        return resposta;
      })
      .catch(() => caches.match(req).then((cacheado) => cacheado || Promise.reject('offline-sem-cache')))
  );
});
