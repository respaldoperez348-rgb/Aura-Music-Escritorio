const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('auraApi', {
    // Sincronización y Configuración
    getSyncCode: () => ipcRenderer.invoke('get-sync-code'),
    setSyncCode: (code) => ipcRenderer.invoke('set-sync-code', code),
    onSyncData: (callback) => {
        ipcRenderer.on('sync-data-updated', (_event, data) => callback(data));
    },
    getSyncStatus: () => ipcRenderer.invoke('get-sync-status'),
    onSyncError: (callback) => {
        ipcRenderer.on('sync-error', (_event, info) => callback(info));
    },

    // Acciones Push-to-Phone (FCM)
    requestFullSync: () => ipcRenderer.invoke('send-fcm-action', { action: 'REQUEST_FULL_SYNC' }),
    sendFavoriteToPhone: (song, isFavorite = true) => ipcRenderer.invoke('send-fcm-action', {
        action: isFavorite ? 'FAVORITE' : 'UNFAVORITE',
        trackId: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album || 'Aura Desktop',
        thumbnailUrl: song.coverUrl || '',
        videoUrl: song.mediaUri || `https://www.youtube.com/watch?v=${song.id}`
    }),
    sendDownloadToPhone: (song) => ipcRenderer.invoke('send-fcm-action', {
        action: 'DOWNLOAD',
        trackId: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album || 'Aura Desktop',
        thumbnailUrl: song.coverUrl || '',
        videoUrl: song.mediaUri || `https://www.youtube.com/watch?v=${song.id}`
    }),

    // Búsqueda y Extracción de Audio
    getHomeFeed: () => ipcRenderer.invoke('get-home-feed'),
    getArtistDetails: (artistName) => ipcRenderer.invoke('get-artist-details', artistName),
    getAlbumTracks: (albumInfo) => ipcRenderer.invoke('get-album-tracks', albumInfo),
    searchTracks: (query) => ipcRenderer.invoke('search-tracks', query),
    getAudioStream: (trackId) => ipcRenderer.invoke('get-audio-stream', trackId),
    prefetchAudioStream: (trackId) => ipcRenderer.invoke('prefetch-audio-stream', trackId),
    toggleFollowArtist: (payload) => ipcRenderer.invoke('toggle-follow-artist', payload),
    getLyrics: (artist, title) => ipcRenderer.invoke('get-lyrics', { artist, title }),

    // Atajos Globales
    onGlobalShortcut: (callback) => {
        ipcRenderer.on('global-shortcut-triggered', (_event, action) => callback(action));
    },

    // Controles de Ventana y Enlaces Externos
    windowControl: (action) => ipcRenderer.invoke('window-control', action),
    openExternal: (url) => ipcRenderer.invoke('open-external', url)
});

