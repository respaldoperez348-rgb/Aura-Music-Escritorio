const { app, BrowserWindow, ipcMain, globalShortcut, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const zlib = require('zlib');
const { execFile } = require('child_process');
const ytSearch = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const play = require('play-dl');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

let mainWindow = null;
let firestoreDb = null;
let fcmMessaging = null;
let firestoreUnsubscribers = [];
let currentSyncCode = '';

// -------------------------------------------------------------
// Cachés en memoria de alta velocidad (Respuesta en 0 ms)
// -------------------------------------------------------------
const audioStreamCache = new Map();   // trackId -> { streamUrl, expiresAt }
const searchCache = new Map();        // query -> { results, expiresAt }
const albumTracksCache = new Map();   // key -> { tracks, expiresAt }
const artistDetailsCache = new Map(); // artistName -> { data, expiresAt }
let homeFeedCache = null;             // { feed, expiresAt }

// Validador estricto de IDs de canciones individuales de YouTube (11 caracteres, nunca listas)
function isValidVideoId(id) {
    return typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id) && !id.startsWith('PL') && !id.startsWith('RD') && !id.startsWith('VL');
}

// Motor de Búsqueda Ultra-Rápido vía InnerTube API con GZIP (200-400ms vs 7000ms de scraping)
async function fastYouTubeSearch(query) {
    if (!query || !query.trim()) return [];
    const cleanQ = query.trim().toLowerCase();

    // 1. Si está en caché, respuesta instantánea en 0 ms
    const cached = searchCache.get(cleanQ);
    if (cached && Date.now() < cached.expiresAt) {
        return cached.results;
    }

    const postData = JSON.stringify({
        context: {
            client: {
                clientName: 'WEB',
                clientVersion: '2.20240101.00.00',
                hl: 'es',
                gl: 'US'
            }
        },
        query: query
    });

    const results = await new Promise((resolve) => {
        const req = https.request({
            hostname: 'www.youtube.com',
            port: 443,
            path: '/youtubei/v1/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Accept-Encoding': 'gzip, deflate',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 4000
        }, (res) => {
            const chunks = [];
            const isGzip = res.headers['content-encoding'] === 'gzip';
            const isDeflate = res.headers['content-encoding'] === 'deflate';
            let stream = res;
            if (isGzip) {
                stream = res.pipe(zlib.createGunzip());
            } else if (isDeflate) {
                stream = res.pipe(zlib.createInflate());
            }

            stream.on('data', chunk => chunks.push(chunk));
            stream.on('end', () => {
                try {
                    const rawStr = Buffer.concat(chunks).toString('utf8');
                    const data = JSON.parse(rawStr);
                    const sections = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
                    const tracks = [];

                    for (const section of sections) {
                        const items = section?.itemSectionRenderer?.contents || [];
                        for (const item of items) {
                            // Caso 1: videoRenderer estándar (sólo canciones individuales reales de duración normal)
                            if (item.videoRenderer && isValidVideoId(item.videoRenderer.videoId)) {
                                const v = item.videoRenderer;
                                const title = v.title?.runs?.[0]?.text || v.title?.simpleText || '';
                                if (/\b(mix|playlist|variad[ao]s?|recopilaci[oó]n|compilaci[oó]n|enganchado)\b/i.test(title) || /(las mejores|canciones de todos|exitos de cada|varios artistas)/i.test(title)) {
                                    continue;
                                }

                                const durationStr = v.lengthText?.simpleText || '3:30';
                                const parts = durationStr.split(':');
                                const sec = parts.length === 2 ? (+parts[0] * 60 + +parts[1]) : (+parts[0] * 3600 + +parts[1] * 60 + +parts[2]);

                                // Descartar compilaciones gigantescas de 1-3 horas que no son temas individuales (máx 12 min)
                                if (sec > 0 && sec <= 720) {
                                    const artist = v.ownerText?.runs?.[0]?.text || 'Artista';
                                    tracks.push({
                                        id: v.videoId,
                                        title: title.replace(/\s*\(Official.*?\)/gi, '').replace(/\s*\[Official.*?\]/gi, '').trim(),
                                        artist: artist.replace(/ - Topic$/i, '').replace(/VEVO$/i, '').trim(),
                                        album: 'YouTube Music',
                                        duration: durationStr,
                                        durationMs: sec * 1000,
                                        coverUrl: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                                        mediaUri: `https://www.youtube.com/watch?v=${v.videoId}`,
                                        isFavorite: false
                                    });
                                }
                            }
                            // Caso 2: lockupViewModel moderno de YouTube (ÚNICAMENTE si es explícitamente un VIDEO individual)
                            else if (item.lockupViewModel && item.lockupViewModel.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO' && isValidVideoId(item.lockupViewModel.contentId)) {
                                const vm = item.lockupViewModel;
                                const vidId = vm.contentId;
                                const title = vm.metadata?.lockupMetadataViewModel?.title?.content || '';
                                if (/\b(mix|playlist|variad[ao]s?|recopilaci[oó]n|compilaci[oó]n|enganchado)\b/i.test(title) || /(las mejores|canciones de todos|exitos de cada|varios artistas)/i.test(title)) {
                                    continue;
                                }
                                const artistMeta = vm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts?.[0]?.text?.content || 'Artista';
                                tracks.push({
                                    id: vidId,
                                    title: title.replace(/\s*\(Official.*?\)/gi, '').replace(/\s*\[Official.*?\]/gi, '').trim(),
                                    artist: artistMeta.replace(/ - Topic$/i, '').replace(/VEVO$/i, '').trim(),
                                    album: 'YouTube Music',
                                    duration: '3:30',
                                    durationMs: 210 * 1000,
                                    coverUrl: `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
                                    mediaUri: `https://www.youtube.com/watch?v=${vidId}`,
                                    isFavorite: false
                                });
                            }
                        }
                    }
                    resolve(tracks.slice(0, 30));
                } catch(e) {
                    resolve([]);
                }
            });
            stream.on('error', () => resolve([]));
        });
        req.on('error', () => resolve([]));
        req.on('timeout', () => { req.destroy(); resolve([]); });
        req.write(postData);
        req.end();
    });

    if (results && results.length > 0) {
        searchCache.set(cleanQ, { results, expiresAt: Date.now() + 15 * 60 * 1000 });
        return results;
    }

    // Fallback secundario con filtro de seguridad anti-playlists
    try {
        const fallbackRes = await ytSearch(query.trim());
        const tracks = (fallbackRes.videos || [])
            .filter(v => isValidVideoId(v.videoId) && v.seconds <= 720)
            .slice(0, 20)
            .map(v => ({
                id: v.videoId,
                title: v.title,
                artist: v.author ? v.author.name : 'Artista',
                album: 'YouTube Music',
                duration: v.timestamp || '3:30',
                durationMs: (v.seconds || 210) * 1000,
                coverUrl: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                mediaUri: v.url,
                isFavorite: false
            }));
        if (tracks.length > 0) {
            searchCache.set(cleanQ, { results: tracks, expiresAt: Date.now() + 15 * 60 * 1000 });
        }
        return tracks;
    } catch (err) {
        return [];
    }
}

// -------------------------------------------------------------
// 1. Inicialización de Firebase Admin SDK
// -------------------------------------------------------------
function initFirebase() {
    try {
        const serviceAccountPath = path.join(__dirname, 'service-account.json');
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            if (getApps().length === 0) {
                initializeApp({
                    credential: cert(serviceAccount)
                });
            }
            firestoreDb = getFirestore();
            fcmMessaging = getMessaging();
            console.log(`[Firebase] Conectado exitosamente con proyecto: ${serviceAccount.project_id}`);
        } else {
            console.warn('[Firebase] No se encontró service-account.json en la raíz.');
        }
    } catch (err) {
        console.error('[Firebase] Error al inicializar Firebase Admin:', err.message);
    }
}

// -------------------------------------------------------------
// 2. Persistencia de Configuración Local (userData)
// -------------------------------------------------------------
function getConfigPath() {
    return path.join(app.getPath('userData'), 'aura_config.json');
}

function loadConfig() {
    try {
        const cfgPath = getConfigPath();
        if (fs.existsSync(cfgPath)) {
            const data = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
            if (data.syncCode) {
                currentSyncCode = data.syncCode;
            }
        }
    } catch (e) {
        console.error('[Config] Error leyendo config:', e.message);
    }
}

function saveConfig(updates) {
    try {
        const cfgPath = getConfigPath();
        let existing = {};
        if (fs.existsSync(cfgPath)) {
            existing = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        }
        const updated = { ...existing, ...updates };
        fs.writeFileSync(cfgPath, JSON.stringify(updated, null, 2), 'utf8');
    } catch (e) {
        console.error('[Config] Error guardando config:', e.message);
    }
}

// -------------------------------------------------------------
// 3. Sincronización en Tiempo Real con Cloud Firestore
// -------------------------------------------------------------
function setupFirestoreListeners(syncCode) {
    if (!firestoreDb) return;

    // Desuscribir oyentes anteriores si existían
    firestoreUnsubscribers.forEach(unsub => {
        try { unsub(); } catch (_) {}
    });
    firestoreUnsubscribers = [];

    if (!syncCode) return;

    console.log(`[Firestore] Escuchando cambios en tiempo real para: ${syncCode}`);
    const sessionDocRef = firestoreDb.collection('sync_sessions').doc(syncCode);

    let sessionMeta = {};
    let librarySongs = [];
    let playlists = [];
    let artists = [];
    let albums = [];

    const notifyRenderer = () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('sync-data-updated', {
                syncCode,
                meta: sessionMeta,
                songs: librarySongs,
                playlists,
                artists,
                albums
            });
        }
    };

    // Metadata de la sesión
    const unsubMeta = sessionDocRef.onSnapshot(doc => {
        if (doc.exists) {
            sessionMeta = doc.data();
            notifyRenderer();
        }
    }, err => console.error('[Firestore Meta Error]:', err.message));
    firestoreUnsubscribers.push(unsubMeta);

    // Canciones de la biblioteca
    const unsubLib = sessionDocRef.collection('library').onSnapshot(snap => {
        librarySongs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log(`[Firestore] Canciones sincronizadas recibidas: ${librarySongs.length}`);
        notifyRenderer();
    }, err => console.error('[Firestore Library Error]:', err.message));
    firestoreUnsubscribers.push(unsubLib);

    // Playlists
    const unsubPlaylists = sessionDocRef.collection('playlists').onSnapshot(snap => {
        playlists = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        notifyRenderer();
    }, err => console.error('[Firestore Playlists Error]:', err.message));
    firestoreUnsubscribers.push(unsubPlaylists);

    // Artistas
    const unsubArtists = sessionDocRef.collection('artists').onSnapshot(snap => {
        artists = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        notifyRenderer();
    }, err => console.error('[Firestore Artists Error]:', err.message));
    firestoreUnsubscribers.push(unsubArtists);

    // Álbumes
    const unsubAlbums = sessionDocRef.collection('albums').onSnapshot(snap => {
        albums = snap.docs.map(d => ({ browseId: d.id, ...d.data() }));
        notifyRenderer();
    }, err => console.error('[Firestore Albums Error]:', err.message));
    firestoreUnsubscribers.push(unsubAlbums);
}

// -------------------------------------------------------------
// 4. Creación de la Ventana Principal
// -------------------------------------------------------------
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1260,
        height: 840,
        minWidth: 1000,
        minHeight: 660,
        backgroundColor: '#00000000',
        transparent: true,
        frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.webContents.on('did-finish-load', () => {
        setupFirestoreListeners(currentSyncCode);
    });

    // Registrar Atajos Globales
    registerShortcuts();
}

// -------------------------------------------------------------
// 5. Atajos Globales
// -------------------------------------------------------------
function registerShortcuts() {
    try {
        globalShortcut.unregisterAll();

        // Ctrl+Shift+F: Favorito en el Móvil
        globalShortcut.register('CommandOrControl+Shift+F', () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('global-shortcut-triggered', 'FAVORITE');
            }
        });

        // Ctrl+Shift+D: Descargar en el Móvil
        globalShortcut.register('CommandOrControl+Shift+D', () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('global-shortcut-triggered', 'DOWNLOAD');
            }
        });

        // Ctrl+Shift+S: Abrir Configuración
        globalShortcut.register('CommandOrControl+Shift+S', () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('global-shortcut-triggered', 'SETTINGS');
            }
        });
    } catch (e) {
        console.warn('[Shortcuts] Error registrando atajos globales:', e.message);
    }
}

// -------------------------------------------------------------
// 6. IPC Handlers
// -------------------------------------------------------------
ipcMain.handle('get-sync-code', () => {
    return currentSyncCode;
});

ipcMain.handle('set-sync-code', (_event, newCode) => {
    currentSyncCode = (newCode || '').trim();
    saveConfig({ syncCode: currentSyncCode });
    setupFirestoreListeners(currentSyncCode);
    return currentSyncCode;
});

// Enviar comandos FCM Push-to-Phone
ipcMain.handle('send-fcm-action', async (_event, payload) => {
    if (!fcmMessaging) {
        return { success: false, error: 'Firebase Cloud Messaging no inicializado' };
    }
    if (!currentSyncCode) {
        return { success: false, error: 'Código de sincronización no configurado' };
    }

    try {
        const dataPayload = {
            action: payload.action || 'REQUEST_FULL_SYNC',
            trackId: payload.trackId || payload.id || '',
            title: payload.title || 'Aura Track',
            artist: payload.artist || 'Aura Artist',
            album: payload.album || 'Aura Desktop',
            thumbnailUrl: payload.thumbnailUrl || payload.coverUrl || '',
            videoUrl: payload.videoUrl || payload.mediaUri || ''
        };

        const message = {
            topic: currentSyncCode,
            data: dataPayload,
            android: {
                priority: 'high'
            }
        };

        const response = await fcmMessaging.send(message);
        console.log(`[FCM] Orden ${payload.action} enviada a ${currentSyncCode}: ${response}`);

        // Actualizar Firestore de forma inmediata para sincronización en tiempo real (0 ms de latencia)
        if (firestoreDb && currentSyncCode && dataPayload.trackId) {
            const trackDocRef = firestoreDb.collection('sync_sessions').doc(currentSyncCode).collection('library').doc(dataPayload.trackId);
            if (payload.action === 'UNFAVORITE' || payload.action === 'REMOVE_FAVORITE') {
                trackDocRef.delete().catch(err => console.warn('[Firestore] Error al eliminar favorito:', err.message));
            } else if (payload.action === 'FAVORITE') {
                trackDocRef.set({
                    id: dataPayload.trackId,
                    title: dataPayload.title,
                    artist: dataPayload.artist,
                    album: dataPayload.album,
                    coverUrl: dataPayload.thumbnailUrl,
                    mediaUri: dataPayload.videoUrl,
                    isFavorite: true
                }, { merge: true }).catch(err => console.warn('[Firestore] Error al guardar favorito:', err.message));
            }
        }

        return { success: true, messageId: response };
    } catch (error) {
        console.error('[FCM] Error enviando mensaje push:', error.message);
        return { success: false, error: error.message };
    }
});

// Feed para la pantalla de Inicio (Música real de YouTube con carátulas exactas)
ipcMain.handle('get-home-feed', async () => {
    try {
        if (homeFeedCache && Date.now() < homeFeedCache.expiresAt) {
            return homeFeedCache.feed;
        }

        const [quickPicksRaw, trendingRaw] = await Promise.all([
            fastYouTubeSearch('top hits official music video').catch(() => []),
            fastYouTubeSearch('official music video hits').catch(() => [])
        ]);

        // 1. Selección Rápida (10 canciones con carátula oficial)
        const quickPicks = (quickPicksRaw || []).slice(0, 10);

        // 2. Tendencias Globales (16 canciones para una lista rica y completa)
        const quickIds = new Set(quickPicks.map(q => q.id));
        const trendingTracks = (trendingRaw || []).filter(v => !quickIds.has(v.id)).slice(0, 16);

        // 3. Artistas Populares (Fotos y nombres verificados, amplia cobertura para pantallas panorámicas)
        const popularArtists = [
            {
                name: 'The Weeknd',
                coverUrl: 'https://i.ytimg.com/vi/Mx92lTYxrJQ/hqdefault.jpg',
                role: 'Pop / R&B'
            },
            {
                name: 'Bad Bunny',
                coverUrl: 'https://i.ytimg.com/vi/Cr8K88UcO0s/hqdefault.jpg',
                role: 'Urbano / Trap'
            },
            {
                name: 'Dua Lipa',
                coverUrl: 'https://i.ytimg.com/vi/k2qgadSvNyU/hqdefault.jpg',
                role: 'Dance Pop'
            },
            {
                name: 'Bruno Mars',
                coverUrl: 'https://i.ytimg.com/vi/lY5V4hSLWY8/hqdefault.jpg',
                role: 'Funk / Pop'
            },
            {
                name: 'Billie Eilish',
                coverUrl: 'https://i.ytimg.com/vi/S2dRcipMCpw/hqdefault.jpg',
                role: 'Alternative'
            },
            {
                name: 'Karol G',
                coverUrl: 'https://i.ytimg.com/vi/BgMU9Vuj17Y/hqdefault.jpg',
                role: 'Reggaetón'
            },
            {
                name: 'Coldplay',
                coverUrl: 'https://i.ytimg.com/vi/vGZMvV9KBp8/hqdefault.jpg',
                role: 'Rock / Pop'
            },
            {
                name: 'Daft Punk',
                coverUrl: 'https://i.ytimg.com/vi/a5uQMwRMHcs/hqdefault.jpg',
                role: 'Electronic'
            },
            {
                name: 'Shakira',
                coverUrl: 'https://i.ytimg.com/vi/DUT5rEU6pqM/hqdefault.jpg',
                role: 'Pop Latino'
            },
            {
                name: 'Eminem',
                coverUrl: 'https://i.ytimg.com/vi/YVkUvmDQ3HY/hqdefault.jpg',
                role: 'Hip-Hop / Rap'
            },
            {
                name: 'Drake',
                coverUrl: 'https://i.ytimg.com/vi/uxpDa-c-4Mc/hqdefault.jpg',
                role: 'Hip-Hop / R&B'
            },
            {
                name: 'Taylor Swift',
                coverUrl: 'https://i.ytimg.com/vi/e-ORhEE9VVg/hqdefault.jpg',
                role: 'Pop'
            },
            {
                name: 'Kendrick Lamar',
                coverUrl: 'https://i.ytimg.com/vi/tvTRZJ-4EyI/hqdefault.jpg',
                role: 'Hip-Hop'
            },
            {
                name: 'Post Malone',
                coverUrl: 'https://i.ytimg.com/vi/wXhTHyIgQ_U/hqdefault.jpg',
                role: 'Pop / Rap'
            },
            {
                name: 'Travis Scott',
                coverUrl: 'https://i.ytimg.com/vi/6ONRf7h3Mdk/hqdefault.jpg',
                role: 'Trap / Hip-Hop'
            },
            {
                name: 'Ed Sheeran',
                coverUrl: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
                role: 'Pop / Acoustic'
            },
            {
                name: 'Ariana Grande',
                coverUrl: 'https://i.ytimg.com/vi/QYh6mYIJG2Y/hqdefault.jpg',
                role: 'Pop / R&B'
            },
            {
                name: 'Imagine Dragons',
                coverUrl: 'https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg',
                role: 'Rock / Alt'
            },
            {
                name: 'Daddy Yankee',
                coverUrl: 'https://i.ytimg.com/vi/CCF1_jI8Prk/hqdefault.jpg',
                role: 'Reggaetón'
            },
            {
                name: 'Michael Jackson',
                coverUrl: 'https://i.ytimg.com/vi/Zi_XLOBDo_Y/hqdefault.jpg',
                role: 'Pop / Legend'
            }
        ];

        // 4. Álbumes Destacados (Carátulas oficiales de YouTube garantizadas al 100%, 0 enlaces caídos)
        const featuredAlbums = [
            {
                title: 'After Hours',
                artist: 'The Weeknd',
                coverUrl: 'https://i.ytimg.com/vi/ygTZZpVkmKg/hqdefault.jpg',
                year: '2020'
            },
            {
                title: 'Un Verano Sin Ti',
                artist: 'Bad Bunny',
                coverUrl: 'https://i.ytimg.com/vi/XM_1MvqkSPg/hqdefault.jpg',
                year: '2022'
            },
            {
                title: 'Future Nostalgia',
                artist: 'Dua Lipa',
                coverUrl: 'https://i.ytimg.com/vi/xUSvOFztulY/hqdefault.jpg',
                year: '2020'
            },
            {
                title: 'Random Access Memories',
                artist: 'Daft Punk',
                coverUrl: 'https://i.ytimg.com/vi/wIMSU8otS-g/hqdefault.jpg',
                year: '2013'
            },
            {
                title: 'HIT ME HARD AND SOFT',
                artist: 'Billie Eilish',
                coverUrl: 'https://i.ytimg.com/vi/8uVMU13PZV0/hqdefault.jpg',
                year: '2024'
            },
            {
                title: 'A Head Full of Dreams',
                artist: 'Coldplay',
                coverUrl: 'https://i.ytimg.com/vi/vGZMvV9KBp8/hqdefault.jpg',
                year: '2015'
            },
            {
                title: 'Mañana Será Bonito',
                artist: 'Karol G',
                coverUrl: 'https://i.ytimg.com/vi/BgMU9Vuj17Y/hqdefault.jpg',
                year: '2023'
            },
            {
                title: '24K Magic',
                artist: 'Bruno Mars',
                coverUrl: 'https://i.ytimg.com/vi/UqyT8IEBkvY/hqdefault.jpg',
                year: '2016'
            }
        ];

        const feed = { quickPicks, popularArtists, featuredAlbums, trendingTracks };
        homeFeedCache = { feed, expiresAt: Date.now() + 30 * 60 * 1000 };
        return feed;
    } catch (err) {
        console.error('[HomeFeed] Error:', err.message);
        return null;
    }
});

// Motor dedicado para encontrar Álbumes (Playlists oficiales y Full Albums de larga duración)
async function fastYouTubeAlbums(query) {
    if (!query || !query.trim()) return [];
    const postData = JSON.stringify({
        context: {
            client: {
                clientName: 'WEB',
                clientVersion: '2.20240101.00.00',
                hl: 'es',
                gl: 'US'
            }
        },
        query: query
    });

    return new Promise((resolve) => {
        const req = https.request({
            hostname: 'www.youtube.com',
            port: 443,
            path: '/youtubei/v1/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Accept-Encoding': 'gzip, deflate',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 4500
        }, (res) => {
            const chunks = [];
            const isGzip = res.headers['content-encoding'] === 'gzip';
            const isDeflate = res.headers['content-encoding'] === 'deflate';
            let stream = res;
            if (isGzip) stream = res.pipe(zlib.createGunzip());
            else if (isDeflate) stream = res.pipe(zlib.createInflate());

            stream.on('data', chunk => chunks.push(chunk));
            stream.on('end', () => {
                try {
                    const rawStr = Buffer.concat(chunks).toString('utf8');
                    const data = JSON.parse(rawStr);
                    const sections = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
                    const albums = [];

                    for (const section of sections) {
                        const items = section?.itemSectionRenderer?.contents || [];
                        for (const item of items) {
                            if (item.lockupViewModel && (item.lockupViewModel.contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST' || item.lockupViewModel.contentType === 'LOCKUP_CONTENT_TYPE_ALBUM')) {
                                const vm = item.lockupViewModel;
                                const title = vm.metadata?.lockupMetadataViewModel?.title?.content || '';
                                if (!title.toLowerCase().startsWith('mix -') && !title.toLowerCase().startsWith('mix:')) {
                                    const img = vm.contentImage?.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel?.image?.sources?.[0]?.url;
                                    albums.push({
                                        id: vm.contentId,
                                        title: title.replace(/\s*\(Full Album.*?\)/gi, '').replace(/\s*\[Full Album.*?\]/gi, '').replace(/\s*\(Album Completo.*?\)/gi, '').trim(),
                                        coverUrl: img || 'https://via.placeholder.com/180/121826/00F0FF?text=💿',
                                        tracksCount: 'Álbum oficial'
                                    });
                                }
                            } else if (item.videoRenderer) {
                                const v = item.videoRenderer;
                                const durationStr = v.lengthText?.simpleText || '';
                                const parts = durationStr.split(':');
                                const sec = parts.length === 2 ? (+parts[0] * 60 + +parts[1]) : (+parts[0] * 3600 + +parts[1] * 60 + +parts[2]);
                                if (sec > 600) {
                                    const title = v.title?.runs?.[0]?.text || v.title?.simpleText || '';
                                    if (!title.toLowerCase().startsWith('mix -') && !title.toLowerCase().startsWith('mix:')) {
                                        albums.push({
                                            id: v.videoId,
                                            title: title.replace(/\s*\(Full Album.*?\)/gi, '').replace(/\s*\[Full Album.*?\]/gi, '').replace(/\s*\(Album Completo.*?\)/gi, '').trim(),
                                            coverUrl: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                                            tracksCount: durationStr || 'Álbum completo'
                                        });
                                    }
                                }
                            }
                        }
                    }
                    resolve(albums.slice(0, 10));
                } catch (e) {
                    resolve([]);
                }
            });
            stream.on('error', () => resolve([]));
        });
        req.on('error', () => resolve([]));
        req.on('timeout', () => { req.destroy(); resolve([]); });
        req.write(postData);
        req.end();
    });
}

// Obtener catálogo completo de un artista desde YouTube (Top Canciones, Álbumes reales y Singles con Caché)
ipcMain.handle('get-artist-details', async (_event, artistName) => {
    try {
        if (!artistName || !artistName.trim()) return { songs: [], albums: [], singles: [] };
        const cleanName = artistName.trim();
        const cacheKey = cleanName.toLowerCase();

        // 1. Revisar caché instantáneo (0 ms)
        const cached = artistDetailsCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
            console.log(`[ArtistDetails] Servido desde caché instantáneo (0 ms): "${cleanName}"`);
            return cached.data;
        }

        console.log(`[ArtistDetails] Buscando catálogo ultra-rápido para "${cleanName}"...`);
        const [songsRaw, singlesRaw, albums] = await Promise.all([
            fastYouTubeSearch(`${cleanName} top canciones official`).catch(() => []),
            fastYouTubeSearch(`${cleanName} single official`).catch(() => []),
            fastYouTubeAlbums(`${cleanName} album completo`).catch(() => [])
        ]);

        const songs = (songsRaw || []).slice(0, 20);
        const songIds = new Set(songs.map(s => s.id));
        const singles = (singlesRaw || []).filter(s => !songIds.has(s.id)).slice(0, 10);

        const data = { songs, albums: (albums || []).slice(0, 8), singles };
        artistDetailsCache.set(cacheKey, { data, expiresAt: Date.now() + 60 * 60 * 1000 });
        return data;
    } catch (err) {
        console.error('[ArtistDetails] Error obteniendo datos del artista:', err.message);
        return { songs: [], albums: [], singles: [] };
    }
});

// Obtener canciones de un álbum con caché ultra-rápido (0 ms si ya se abrió)
ipcMain.handle('get-album-tracks', async (_event, albumInfo) => {
    try {
        if (!albumInfo) return [];
        const albumTitle = (albumInfo.title || 'Álbum').trim();
        const artistName = (albumInfo.artist || '').trim();
        const cacheKey = `${albumInfo.id || ''}_${albumTitle}_${artistName}`.toLowerCase();

        // 1. Revisar caché en memoria (0 ms instantáneo)
        const cached = albumTracksCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
            console.log(`[AlbumTracks] Servido desde caché instantáneo (0 ms): "${albumTitle}"`);
            return cached.tracks;
        }

        const playlistId = albumInfo.id && albumInfo.id.startsWith('PL') ? albumInfo.id : null;
        let tracks = [];

        // 2. Si tenemos el ID de lista de YouTube, extraemos con yt-dlp flat-playlist
        if (playlistId) {
            try {
                const jsonStr = await new Promise((resolve, reject) => {
                    execFile('yt-dlp', ['--flat-playlist', '-J', `https://www.youtube.com/playlist?list=${playlistId}`], { maxBuffer: 10 * 1024 * 1024, timeout: 6000 }, (err, stdout) => {
                        if (err) return reject(err);
                        resolve(stdout);
                    });
                });
                const data = JSON.parse(jsonStr);
                tracks = (data.entries || []).map(e => ({
                    id: e.id,
                    title: (e.title || 'Canción')
                        .replace(/\s*\(Official.*?\)/gi, '')
                        .replace(/\s*\[Official.*?\]/gi, '')
                        .replace(/\s*\(Audio.*?\)/gi, '')
                        .replace(/\s*\(Video.*?\)/gi, '')
                        .replace(/\s*\[Audio.*?\]/gi, '')
                        .trim(),
                    artist: artistName || e.uploader || e.channel || 'Artista',
                    album: albumTitle,
                    duration: e.duration ? `${Math.floor(e.duration / 60)}:${(e.duration % 60 < 10 ? '0' : '')}${e.duration % 60}` : '3:30',
                    durationMs: (e.duration || 210) * 1000,
                    coverUrl: (e.thumbnails && e.thumbnails.length > 0) ? e.thumbnails[e.thumbnails.length - 1].url : (albumInfo.coverUrl || `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg`),
                    mediaUri: `https://www.youtube.com/watch?v=${e.id}`,
                    isFavorite: false
                }));
            } catch (err) {
                console.warn(`[AlbumTracks] yt-dlp falló, probando búsqueda rápida:`, err.message);
            }
        }

        // 3. Si no hay lista o falló, búsqueda ultra-rápida con InnerTube (300 ms)
        if (!tracks || tracks.length === 0) {
            const searchQuery = `${artistName} ${albumTitle}`;
            tracks = await fastYouTubeSearch(searchQuery);
        }

        if (tracks && tracks.length > 0) {
            albumTracksCache.set(cacheKey, { tracks, expiresAt: Date.now() + 30 * 60 * 1000 });
        }
        return tracks;
    } catch (err) {
        console.error('[AlbumTracks] Error obteniendo canciones del álbum:', err.message);
        return [];
    }
});

// Búsqueda ultra-rápida con caché en memoria y API InnerTube (300 ms)
ipcMain.handle('search-tracks', async (_event, query) => {
    return await fastYouTubeSearch(query);
});

// Extracción de Stream de Audio ultra-optimizada con Caché Instantáneo (0 ms)
ipcMain.handle('get-audio-stream', async (_event, trackId) => {
    try {
        let cleanId = (trackId || '').trim();
        if (cleanId.includes('v=')) {
            cleanId = cleanId.split('v=')[1].split('&')[0];
        } else if (cleanId.includes('youtu.be/')) {
            cleanId = cleanId.split('youtu.be/')[1].split('?')[0];
        }

        // Si es una playlist o ID inválido, no intentar streaming individual
        if (!cleanId || cleanId.startsWith('PL') || cleanId.startsWith('RD') || cleanId.startsWith('VL')) {
            console.warn(`[AudioStream] ID rechazado (lista/álbum no reproducible directamente): ${cleanId}`);
            return { success: false, error: 'Este elemento es una lista o álbum, no un tema individual.' };
        }

        // 1. Revisar caché en memoria (0 ms instantáneo)
        const cached = audioStreamCache.get(cleanId);
        if (cached && Date.now() < cached.expiresAt) {
            console.log(`[AudioStream] Servido desde CACHÉ INSTANTÁNEO (0 ms) para: ${cleanId}`);
            return { success: true, streamUrl: cached.streamUrl };
        }

        const url = cleanId.startsWith('http') ? cleanId : `https://www.youtube.com/watch?v=${cleanId}`;

        // 2. Extraer con yt-dlp flags de alta velocidad
        try {
            const streamUrl = await new Promise((resolve, reject) => {
                execFile('yt-dlp', [
                    '-g',
                    '-f', '140/ba/b',
                    '--no-playlist',
                    '--no-check-certificates',
                    '--prefer-free-formats',
                    url
                ], { timeout: 8000 }, (error, stdout) => {
                    if (error) return reject(error);
                    const line = (stdout || '').trim().split('\n')[0].trim();
                    if (line && line.startsWith('http')) {
                        resolve(line);
                    } else {
                        reject(new Error('Formato no extraíble'));
                    }
                });
            });

            if (streamUrl) {
                // Guardar en caché por 5 horas (URLs de googlevideo duran 6 horas)
                audioStreamCache.set(cleanId, { streamUrl, expiresAt: Date.now() + 5 * 3600 * 1000 });
                console.log(`[AudioStream] Extraído y cacheado para ${cleanId}`);
                return { success: true, streamUrl };
            }
        } catch (ytDlpErr) {
            console.warn('[AudioStream] Error extrayendo:', ytDlpErr.message);
        }

        return { success: false, error: 'No se pudo extraer el enlace de audio directo.' };
    } catch (e) {
        console.error('[AudioStream] Error general:', e.message);
        return { success: false, error: e.message };
    }
});

// Precarga en segundo plano (Prefetch) para que el siguiente tema cargue en 0 ms
ipcMain.handle('prefetch-audio-stream', async (_event, trackId) => {
    try {
        if (!trackId) return;
        let cleanId = trackId.trim();
        if (cleanId.includes('v=')) cleanId = cleanId.split('v=')[1].split('&')[0];
        if (cleanId.includes('youtu.be/')) cleanId = cleanId.split('youtu.be/')[1].split('?')[0];

        if (!isValidVideoId(cleanId)) return;

        // Si ya está en caché, no hacer nada
        const cached = audioStreamCache.get(cleanId);
        if (cached && Date.now() < cached.expiresAt) return;

        const url = cleanId.startsWith('http') ? cleanId : `https://www.youtube.com/watch?v=${cleanId}`;
        execFile('yt-dlp', [
            '-g',
            '-f', '140/ba/b',
            '--no-playlist',
            '--no-check-certificates',
            '--prefer-free-formats',
            url
        ], { timeout: 8000 }, (error, stdout) => {
            if (!error && stdout) {
                const line = stdout.trim().split('\n')[0].trim();
                if (line && line.startsWith('http')) {
                    audioStreamCache.set(cleanId, { streamUrl: line, expiresAt: Date.now() + 5 * 3600 * 1000 });
                    console.log(`[AudioStream Prefetch] Precargado en segundo plano (0 ms listos) para ${cleanId}`);
                }
            }
        });
    } catch {}
});

// Guardar / Dejar de seguir artista en Firestore
ipcMain.handle('toggle-follow-artist', async (_event, payload) => {
    try {
        if (!currentSyncCode || !payload || !payload.artistName) return { success: false };
        const cleanName = payload.artistName.trim();
        const artistRef = firestoreDb
            .collection('sync_sessions')
            .doc(currentSyncCode)
            .collection('artists')
            .doc(cleanName);

        if (payload.isFollowing) {
            await artistRef.set({
                id: cleanName,
                name: cleanName,
                artist: cleanName,
                coverUrl: payload.coverUrl || '',
                followedAt: new Date().toISOString()
            }, { merge: true });
            console.log(`[Firestore] Artista seguido guardado en la nube: ${cleanName}`);
        } else {
            await artistRef.delete();
            console.log(`[Firestore] Artista eliminado de seguidos: ${cleanName}`);
        }
        return { success: true };
    } catch (err) {
        console.error('[Firestore] Error al actualizar artista seguido:', err.message);
        return { success: false, error: err.message };
    }
});

// Obtener letras de la canción (Lrclib.net + lyrics.ovh con caché instantáneo)
const lyricsCache = new Map();

function fetchJsonUrl(url) {
    return new Promise((resolve) => {
        const req = https.get(url, { headers: { 'User-Agent': 'AuraMusic/1.0' }, timeout: 4500 }, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return resolve(null);
            }
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch(e) { resolve(null); }
            });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
    });
}

ipcMain.handle('get-lyrics', async (_event, payload) => {
    try {
        const title = payload?.title;
        const artist = payload?.artist;
        if (!title || !title.trim()) return { success: false };

        // Limpiar títulos de YouTube con etiquetas accesorias
        let cleanTitle = title
            .replace(/\s*[\(\[](?:Official|Video|Audio|Letra|Lyric|Visualizer|En Vivo|Live|Remastered|HD|4K|HQ|Videoclip|Studio).*?[\)\]]/gi, '')
            .replace(/\s*[\(\[].*?[\)\]]/g, '')
            .trim();

        let cleanArtist = (artist || '')
            .replace(/ - Topic$/i, '')
            .replace(/VEVO$/i, '')
            .replace(/Oficial$/i, '')
            .trim();

        let artistCandidate = cleanArtist;
        let titleCandidate = cleanTitle;

        if (cleanTitle.includes(' - ')) {
            const parts = cleanTitle.split(' - ');
            if (parts.length === 2) {
                const p0 = parts[0].trim();
                const p1 = parts[1].trim();
                if (cleanArtist && p0.toLowerCase().includes(cleanArtist.toLowerCase())) {
                    artistCandidate = p0;
                    titleCandidate = p1;
                } else if (cleanArtist && p1.toLowerCase().includes(cleanArtist.toLowerCase())) {
                    artistCandidate = p1;
                    titleCandidate = p0;
                } else {
                    artistCandidate = p0;
                    titleCandidate = p1;
                }
            }
        }

        const cacheKey = `${artistCandidate}_${titleCandidate}`.toLowerCase();
        const cached = lyricsCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
            return { success: true, ...cached.data };
        }

        const removeAccents = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const variants = [
            { a: artistCandidate, t: titleCandidate },
            { a: removeAccents(artistCandidate), t: removeAccents(titleCandidate) },
            { a: cleanArtist, t: cleanTitle },
            { a: removeAccents(cleanArtist), t: removeAccents(cleanTitle) }
        ];

        // 1. Probar lrclib.net /api/get (coincidencia directa)
        for (const v of variants) {
            if (!v.a || !v.t) continue;
            const lrcUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(v.a)}&track_name=${encodeURIComponent(v.t)}`;
            const lrcData = await fetchJsonUrl(lrcUrl);
            if (lrcData && (lrcData.syncedLyrics || lrcData.plainLyrics)) {
                const result = {
                    syncedLyrics: lrcData.syncedLyrics || null,
                    plainLyrics: lrcData.plainLyrics || null,
                    source: 'lrclib-get'
                };
                lyricsCache.set(cacheKey, { data: result, expiresAt: Date.now() + 24 * 3600 * 1000 });
                return { success: true, ...result };
            }
        }

        // 2. Probar lrclib.net /api/search?q= (búsqueda difusa de respaldo)
        const searchQueries = [
            `${artistCandidate} ${titleCandidate}`,
            `${removeAccents(artistCandidate)} ${removeAccents(titleCandidate)}`,
            titleCandidate
        ];

        for (const q of searchQueries) {
            if (!q || !q.trim()) continue;
            const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(q.trim())}`;
            const searchData = await fetchJsonUrl(searchUrl);
            if (Array.isArray(searchData) && searchData.length > 0) {
                const found = searchData.find(s => s.syncedLyrics || s.plainLyrics);
                if (found) {
                    const result = {
                        syncedLyrics: found.syncedLyrics || null,
                        plainLyrics: found.plainLyrics || null,
                        source: 'lrclib-search'
                    };
                    lyricsCache.set(cacheKey, { data: result, expiresAt: Date.now() + 24 * 3600 * 1000 });
                    return { success: true, ...result };
                }
            }
        }

        // 3. Fallback: lyrics.ovh
        for (const v of variants) {
            if (!v.a || !v.t) continue;
            const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(v.a)}/${encodeURIComponent(v.t)}`;
            const ovhData = await fetchJsonUrl(ovhUrl);
            if (ovhData && ovhData.lyrics && ovhData.lyrics.trim().length > 30) {
                const result = {
                    syncedLyrics: null,
                    plainLyrics: ovhData.lyrics.trim(),
                    source: 'lyrics.ovh'
                };
                lyricsCache.set(cacheKey, { data: result, expiresAt: Date.now() + 24 * 3600 * 1000 });
                return { success: true, ...result };
            }
        }

        return { success: false, message: 'No se encontraron letras' };
    } catch (err) {
        console.error('[Lyrics Error]:', err.message);
        return { success: false, error: err.message };
    }
});

// Controles de Ventana (Min, Max, Cerrar)
ipcMain.handle('window-control', (_event, action) => {
    if (!mainWindow) return;
    switch (action) {
        case 'minimize':
            mainWindow.minimize();
            break;
        case 'maximize':
            if (mainWindow.isMaximized()) mainWindow.unmaximize();
            else mainWindow.maximize();
            break;
        case 'close':
            mainWindow.close();
            break;
    }
});

ipcMain.handle('open-external', async (_event, targetUrl) => {
    if (targetUrl && (targetUrl.startsWith('https://') || targetUrl.startsWith('http://'))) {
        try {
            await shell.openExternal(targetUrl);
            return { ok: true };
        } catch (err) {
            console.error('Error opening external URL:', err);
            return { ok: false, error: err.message };
        }
    }
    return { ok: false, error: 'Invalid URL' };
});

// -------------------------------------------------------------
// 7. Ciclo de Vida de la App
// -------------------------------------------------------------
app.whenReady().then(() => {
    loadConfig();
    initFirebase();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

