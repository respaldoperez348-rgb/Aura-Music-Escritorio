// =========================================================
// AURA MUSIC DESKTOP - RENDERER (CYBERPUNK GLASSMORPHISM)
// =========================================================

let syncData = {
    syncCode: '',
    meta: {},
    songs: [],
    playlists: [],
    artists: [],
    albums: []
};

let currentView = 'home';
let currentQueue = [];
let currentIndex = -1;
let currentTrack = null;
let isAudioPlaying = false;
let searchDebounceTimer = null;
let selectedArtist = null;
let artistActiveTab = 'songs';
const DEFAULT_TRACK_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%23121826'/%3E%3Ccircle cx='50' cy='50' r='32' fill='%230b0e14' stroke='%2300f0ff' stroke-width='2' opacity='0.7'/%3E%3Cpolygon points='44,36 64,50 44,64' fill='%2300f0ff'/%3E%3C/svg%3E";
const DEFAULT_PLAYLIST_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23121826'/%3E%3Cstop offset='100%25' stop-color='%23080b11'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Crect x='10' y='10' width='140' height='140' rx='16' fill='none' stroke='%2300f0ff' stroke-width='2' stroke-opacity='0.4'/%3E%3Ccircle cx='80' cy='80' r='36' fill='%2300f0ff' fill-opacity='0.08'/%3E%3Cpath d='M60 62h40M60 76h40M60 90h24M96 86v18a6 6 0 1 1-6-6h6' stroke='%2300f0ff' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E";

// ---------------------------------------------------------
// SISTEMA DE INTERNACIONALIZACIÓN (i18n) COMPLETO
// ---------------------------------------------------------
const I18N_STRINGS = {
    es: {
        appSubtitle: "Tu biblioteca musical sincronizada en vivo desde tu dispositivo Android",
        navHome: "Inicio",
        navFavorites: "Favoritos",
        navAllSongs: "Todas las Canciones",
        navArtists: "Artistas",
        navAlbums: "Álbumes",
        navPlaylists: "Listas de Reproducción",
        navYouTube: "Búsqueda YouTube",
        themeToggleTooltip: "Alternar Modo Oscuro / Claro",
        settingsTooltip: "Configuración",
        deviceConnectedTooltip: "Dispositivo sincronizado",
        deviceOnlineRealtime: "Sincronizado en tiempo real",
        copyCode: "Copiar código FCM",
        codeCopied: "¡Código copiado al portapapeles!",
        closePanel: "Cerrar panel",
        searchPlaceholder: "Buscar canciones, artistas en YouTube...",
        greetingMorning: "Buenos días",
        greetingAfternoon: "Buenas tardes",
        greetingEvening: "Buenas noches",
        statTracks: "temas",
        statFavorites: "favoritos",
        statArtists: "artistas",
        sectionQuickPicks: "Selección Rápida",
        tagQuickPicks: "Para empezar a escuchar",
        sectionFollowedArtists: "Artistas que sigues",
        tagFollowedArtists: "De tu biblioteca móvil",
        sectionPopularArtists: "Artistas Populares",
        tagPopularArtists: "Tendencias mundiales",
        sectionFeaturedAlbums: "Álbumes Destacados",
        tagFeaturedAlbums: "Discos guardados",
        sectionTrending: "Tendencias Globales",
        tagTrending: "Lo más escuchado",
        followingTag: "Siguiendo",
        titleFavorites: "Mis Favoritos",
        subtitleFavorites: "Canciones marcadas como favoritas en tu teléfono Android",
        titleAllSongs: "Todas las Canciones",
        subtitleAllSongs: "Catálogo unificado de tu biblioteca móvil",
        titleArtists: "Artistas Seguidos",
        subtitleArtists: "Selecciona un artista para abrir su perfil inmersivo con álbumes y biografía",
        titleAlbums: "Álbumes Guardados",
        subtitleAlbums: "Colección de álbumes en tu biblioteca",
        titlePlaylists: "Listas de Reproducción",
        subtitlePlaylists: "Playlists sincronizadas desde tu teléfono",
        filterPlaceholder: "Filtrar en esta lista...",
        btnPlayAll: "REPRODUCIR TODO",
        emptyFavoritesTitle: "Sin favoritos aún",
        emptyFavoritesDesc: "Marca canciones con el corazón desde tu teléfono o en el reproductor.",
        emptyAllSongsTitle: "Biblioteca vacía",
        emptyAllSongsDesc: "Abre Aura Music en tu teléfono y sincroniza tu música.",
        noPlaylistsTitle: "Sin listas de reproducción",
        noPlaylistsDesc: "Tus listas creadas en el teléfono se sincronizan de forma instantánea.",
        playlistEmptyTitle: "Lista sin canciones",
        playlistEmptyDesc: "Abre Aura Music en tu teléfono y sincroniza tu biblioteca para ver todas las pistas.",
        noAlbumsTitle: "Sin álbumes guardados",
        noAlbumsDesc: "Guarda álbumes en la app móvil para verlos organizados aquí.",
        noArtistsTitle: "Sin artistas seguidos",
        noArtistsDesc: "Sigue artistas en tu móvil para explorar sus discografías completas.",
        selectTrack: "Selecciona una pista",
        playerSubDefault: "Aura Music Desktop",
        tooltipLyrics: "Ver letra e imagen de la canción",
        tooltipFav: "Guardar esta canción en Favoritos de tu Teléfono (Ctrl+Shift+F)",
        tooltipDownload: "Descargar audio directamente en tu Celular (Ctrl+Shift+D)",
        lyricsHeaderTitle: "LETRAS EN VIVO",
        btnMinimize: "MINIMIZAR",
        searchingLyrics: "Buscando letra sincronizada...",
        noLyricsAvailable: "No se encontró letra sincronizada para esta canción.",
        songsUppercase: "CANCIONES",
        tracks: "canciones",
        playlistTag: "LISTA DE REPRODUCCIÓN",
        albumTag: "ÁLBUM OFICIAL",
        playPlaylist: "REPRODUCIR LISTA",
        playAlbum: "REPRODUCIR ÁLBUM",
        backToPlaylists: "Volver a Listas de Reproducción",
        backToHome: "Volver al Inicio",
        backToArtists: "Volver al Artista",
        backToAlbums: "Volver a Álbumes",
        syncedFromPhone: "Sincronizada desde tu teléfono",
        settingsTitle: "Configuración de Aura Music",
        tabThemes: "Temas",
        tabLanguages: "Idiomas",
        tabPlayer: "Barra Reproductor",
        tabSync: "Conexión Celular",
        tabAbout: "Creador & Repo",
        langSectionTitle: "Idioma de la Interfaz",
        langSectionDesc: "Selecciona tu idioma preferido para la interfaz y los mensajes del reproductor.",
        activeBadge: "Activo",
        availableBadge: "Disponible",
        playerSettingsTitle: "Ajustes de la Barra Flotante",
        playerSettingsDesc: "Personaliza el tamaño, la opacidad y los efectos del dock de reproducción.",
        toastLangChanged: "Idioma configurado: Español"
    },
    en: {
        appSubtitle: "Your music library live synchronized from your Android device",
        navHome: "Home",
        navFavorites: "Favorites",
        navAllSongs: "All Songs",
        navArtists: "Artists",
        navAlbums: "Albums",
        navPlaylists: "Playlists",
        navYouTube: "YouTube Search",
        themeToggleTooltip: "Toggle Dark / Light Mode",
        settingsTooltip: "Settings",
        deviceConnectedTooltip: "Device synchronized",
        deviceOnlineRealtime: "Live synced in real time",
        copyCode: "Copy FCM code",
        codeCopied: "Code copied to clipboard!",
        closePanel: "Close panel",
        searchPlaceholder: "Search songs, artists on YouTube...",
        greetingMorning: "Good morning",
        greetingAfternoon: "Good afternoon",
        greetingEvening: "Good evening",
        statTracks: "tracks",
        statFavorites: "favorites",
        statArtists: "artists",
        sectionQuickPicks: "Quick Picks",
        tagQuickPicks: "Start listening",
        sectionFollowedArtists: "Artists you follow",
        tagFollowedArtists: "From your mobile library",
        sectionPopularArtists: "Popular Artists",
        tagPopularArtists: "Global Trends",
        sectionFeaturedAlbums: "Featured Albums",
        tagFeaturedAlbums: "Saved records",
        sectionTrending: "Global Trends",
        tagTrending: "Most played",
        followingTag: "Following",
        titleFavorites: "My Favorites",
        subtitleFavorites: "Songs marked as favorites on your Android phone",
        titleAllSongs: "All Songs",
        subtitleAllSongs: "Unified catalog from your mobile library",
        titleArtists: "Followed Artists",
        subtitleArtists: "Select an artist to open their immersive profile with albums and bio",
        titleAlbums: "Saved Albums",
        subtitleAlbums: "Album collection in your library",
        titlePlaylists: "Playlists",
        subtitlePlaylists: "Playlists synchronized from your phone",
        filterPlaceholder: "Filter in this list...",
        btnPlayAll: "PLAY ALL",
        emptyFavoritesTitle: "No favorites yet",
        emptyFavoritesDesc: "Heart tracks from your phone or desktop player to see them here.",
        emptyAllSongsTitle: "Library is empty",
        emptyAllSongsDesc: "Open Aura Music on your phone and sync your music.",
        noPlaylistsTitle: "No playlists",
        noPlaylistsDesc: "Playlists created on your phone sync instantly.",
        playlistEmptyTitle: "Empty playlist",
        playlistEmptyDesc: "Open Aura Music on your phone and sync your library to load all tracks.",
        noAlbumsTitle: "No saved albums",
        noAlbumsDesc: "Save albums in the mobile app to see them organized here.",
        noArtistsTitle: "No followed artists",
        noArtistsDesc: "Follow artists on your phone to explore their complete discography.",
        selectTrack: "Select a track",
        playerSubDefault: "Aura Music Desktop",
        tooltipLyrics: "View live lyrics & album art",
        tooltipFav: "Save track to your Phone Favorites (Ctrl+Shift+F)",
        tooltipDownload: "Download audio directly to your Phone (Ctrl+Shift+D)",
        lyricsHeaderTitle: "LIVE LYRICS",
        btnMinimize: "MINIMIZE",
        searchingLyrics: "Searching synchronized lyrics...",
        noLyricsAvailable: "No synchronized lyrics found for this song.",
        songsUppercase: "SONGS",
        tracks: "tracks",
        playlistTag: "PLAYLIST",
        albumTag: "OFFICIAL ALBUM",
        playPlaylist: "PLAY PLAYLIST",
        playAlbum: "PLAY ALBUM",
        backToPlaylists: "Back to Playlists",
        backToHome: "Back to Home",
        backToArtists: "Back to Artist",
        backToAlbums: "Back to Albums",
        syncedFromPhone: "Synchronized from your phone",
        settingsTitle: "Aura Music Settings",
        tabThemes: "Themes",
        tabLanguages: "Languages",
        tabPlayer: "Player Bar",
        tabSync: "Phone Connection",
        tabAbout: "Creator & Repo",
        langSectionTitle: "Interface Language",
        langSectionDesc: "Select your preferred language for the UI and player notifications.",
        activeBadge: "Active",
        availableBadge: "Available",
        playerSettingsTitle: "Floating Bar Settings",
        playerSettingsDesc: "Customize the size, opacity and visual effects of the player dock.",
        toastLangChanged: "Language set to: English"
    }
};

let currentAppLang = localStorage.getItem('aura-lang') || 'es';

function t(key, fallback = '') {
    const dict = I18N_STRINGS[currentAppLang] || I18N_STRINGS.es;
    return dict[key] !== undefined ? dict[key] : fallback;
}

function applyLanguage(lang) {
    currentAppLang = lang;
    localStorage.setItem('aura-lang', lang);

    // 1. Tooltips de la barra lateral (Sidebar)
    const navHome = document.querySelector('button[data-view="home"]');
    if (navHome) navHome.setAttribute('data-tooltip', t('navHome'));
    const navFavs = document.querySelector('button[data-view="favorites"]');
    if (navFavs) navFavs.setAttribute('data-tooltip', t('navFavorites'));
    const navAll = document.querySelector('button[data-view="all"]');
    if (navAll) navAll.setAttribute('data-tooltip', t('navAllSongs'));
    const navArtists = document.querySelector('button[data-view="artists"]');
    if (navArtists) navArtists.setAttribute('data-tooltip', t('navArtists'));
    const navAlbums = document.querySelector('button[data-view="albums"]');
    if (navAlbums) navAlbums.setAttribute('data-tooltip', t('navAlbums'));
    const navPlaylists = document.querySelector('button[data-view="playlists"]');
    if (navPlaylists) navPlaylists.setAttribute('data-tooltip', t('navPlaylists'));
    const navYT = document.querySelector('button[data-view="youtube"]');
    if (navYT) navYT.setAttribute('data-tooltip', t('navYouTube'));

    const btnTheme = document.getElementById('btnThemeToggle');
    if (btnTheme) btnTheme.setAttribute('data-tooltip', t('themeToggleTooltip'));
    const btnSettings = document.getElementById('btnOpenSettings');
    if (btnSettings) btnSettings.setAttribute('data-tooltip', t('settingsTooltip'));

    // 2. Encabezado principal y buscador
    const appSub = document.querySelector('.home-greeting-subtitle');
    if (appSub) appSub.textContent = t('appSubtitle');

    const searchInput = document.getElementById('globalSearchInput') || document.querySelector('.search-input');
    if (searchInput) searchInput.placeholder = t('searchPlaceholder');
    if (filterInput) filterInput.placeholder = t('filterPlaceholder');

    // Stats
    const lblSongs = document.getElementById('labelStatSongs');
    if (lblSongs) lblSongs.textContent = t('statTracks');
    const lblFavs = document.getElementById('labelStatFavs');
    if (lblFavs) lblFavs.textContent = t('statFavorites');
    const lblArtists = document.getElementById('labelStatArtists');
    if (lblArtists) lblArtists.textContent = t('statArtists');

    // 3. Títulos y subtítulos de secciones Home
    const hQuickTitle = document.getElementById('homeTitleQuickPicks');
    if (hQuickTitle) hQuickTitle.textContent = t('sectionQuickPicks');
    const hQuickTag = document.getElementById('homeTagQuickPicks');
    if (hQuickTag) hQuickTag.textContent = t('tagQuickPicks');

    const hFollowTitle = document.getElementById('homeTitleFollowedArtists');
    if (hFollowTitle) hFollowTitle.textContent = t('sectionFollowedArtists');
    const hFollowTag = document.getElementById('tagFollowedArtistsCount');
    if (hFollowTag) hFollowTag.textContent = t('tagFollowedArtists');

    const hPopTitle = document.getElementById('homeTitlePopularArtists');
    if (hPopTitle) hPopTitle.textContent = t('sectionPopularArtists');
    const hPopTag = document.getElementById('homeTagPopularArtists');
    if (hPopTag) hPopTag.textContent = t('tagPopularArtists');

    const hAlbumsTitle = document.getElementById('homeTitleFeaturedAlbums');
    if (hAlbumsTitle) hAlbumsTitle.textContent = t('sectionFeaturedAlbums');
    const hAlbumsTag = document.getElementById('homeTagFeaturedAlbums');
    if (hAlbumsTag) hAlbumsTag.textContent = t('tagFeaturedAlbums');

    const hTrendTitle = document.getElementById('homeTitleTrending');
    if (hTrendTitle) hTrendTitle.textContent = t('sectionTrending');
    const hTrendTag = document.getElementById('homeTagTrending');
    if (hTrendTag) hTrendTag.textContent = t('tagTrending');

    // 4. Botones y controles
    if (btnPlayAll) {
        const span = btnPlayAll.querySelector('span');
        if (span) span.textContent = t('btnPlayAll');
    }

    const btnMinLyrics = document.getElementById('btnMinimizeLyrics');
    if (btnMinLyrics) {
        const span = btnMinLyrics.querySelector('span');
        if (span) span.textContent = t('btnMinimize');
    }
    const badgeLyrics = document.getElementById('badgeLyricsStatus');
    if (badgeLyrics) badgeLyrics.textContent = t('lyricsHeaderTitle');

    if (btnToggleLyrics) btnToggleLyrics.title = t('tooltipLyrics');
    if (btnPushFavorite) btnPushFavorite.title = t('tooltipFav');
    if (btnPushDownload) btnPushDownload.title = t('tooltipDownload');

    // 5. Configuración Modal
    const settingsModalEl = document.getElementById('settingsModal');
    if (settingsModalEl) {
        const titleEl = settingsModalEl.querySelector('.settings-modal-title');
        if (titleEl) titleEl.textContent = t('settingsTitle');

        const tabThemes = settingsModalEl.querySelector('button[data-tab="tab-themes"] span');
        if (tabThemes) tabThemes.textContent = t('tabThemes');
        const tabLangs = settingsModalEl.querySelector('button[data-tab="tab-languages"] span');
        if (tabLangs) tabLangs.textContent = t('tabLanguages');
        const tabPlayer = settingsModalEl.querySelector('button[data-tab="tab-player"] span');
        if (tabPlayer) tabPlayer.textContent = t('tabPlayer');
        const tabSync = settingsModalEl.querySelector('button[data-tab="tab-sync"] span');
        if (tabSync) tabSync.textContent = t('tabSync');
        const tabAbout = settingsModalEl.querySelector('button[data-tab="tab-about"] span');
        if (tabAbout) tabAbout.textContent = t('tabAbout');

        const langTitle = document.querySelector('#tab-languages .settings-section-title');
        if (langTitle) langTitle.textContent = t('langSectionTitle');
        const langDesc = document.querySelector('#tab-languages .settings-section-desc');
        if (langDesc) langDesc.textContent = t('langSectionDesc');

        document.querySelectorAll('.language-card').forEach(card => {
            const input = card.querySelector('input');
            const badge = card.querySelector('.language-badge');
            if (input && badge) {
                badge.textContent = input.value === lang ? t('activeBadge') : t('availableBadge');
            }
        });
    }

    updateLiveDate();
    if (currentView !== 'home') {
        renderCurrentView();
    }
}

// DOM Elements
const audioElement = document.getElementById('audioElement');
const homeViewWrapper = document.getElementById('homeViewWrapper');
const standardViewWrapper = document.getElementById('standardViewWrapper');
const artistDetailView = document.getElementById('artistDetailView');
const tracksContainer = document.getElementById('tracksContainer');
const viewTitle = document.getElementById('viewTitle');
const viewSubtitle = document.getElementById('viewSubtitle');
const filterInput = document.getElementById('filterInput');
const globalSearchInput = document.getElementById('globalSearchInput');
const btnPlayAll = document.getElementById('btnPlayAll');

// Player Elements
const currentCover = document.getElementById('currentCover');
const currentTitle = document.getElementById('currentTitle');
const currentArtist = document.getElementById('currentArtist');
const btnPlayPause = document.getElementById('btnPlayPause');
const iconPlayPause = document.getElementById('iconPlayPause');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const progressBar = document.getElementById('progressBar');
const currentTime = document.getElementById('currentTime');
const totalDuration = document.getElementById('totalDuration');
const volumeSlider = document.getElementById('volumeSlider');
const volIcon = document.getElementById('volIcon');
const btnPushFavorite = document.getElementById('btnPushFavorite');
const btnPushDownload = document.getElementById('btnPushDownload');
const playerTrackInfo = document.getElementById('playerTrackInfo');
const btnToggleLyrics = document.getElementById('btnToggleLyrics');

// Elementos de la vista expandida de Letras e Imagen (Split View)
const lyricsOverlay = document.getElementById('lyricsOverlay');
const btnCollapseLyrics = document.getElementById('btnCollapseLyrics');
const lyricsBackdrop = document.getElementById('lyricsBackdrop');
const lyricsGiantCover = document.getElementById('lyricsGiantCover');
const lyricsCoverGlow = document.getElementById('lyricsCoverGlow');
const lyricsTrackTitle = document.getElementById('lyricsTrackTitle');
const lyricsTrackArtist = document.getElementById('lyricsTrackArtist');
const lyricsScrollBox = document.getElementById('lyricsScrollBox');
const lyricsProgressBar = document.getElementById('lyricsProgressBar');
const lyricsCurrentTime = document.getElementById('lyricsCurrentTime');
const lyricsTotalDuration = document.getElementById('lyricsTotalDuration');
const lyricsBtnPrev = document.getElementById('lyricsBtnPrev');
const lyricsBtnPlayPause = document.getElementById('lyricsBtnPlayPause');
const lyricsIconPlayPause = document.getElementById('lyricsIconPlayPause');
const lyricsBtnNext = document.getElementById('lyricsBtnNext');
const lyricsBtnFav = document.getElementById('lyricsBtnFav');

let isLyricsViewOpen = false;
let parsedLyrics = [];
let isSyncedLyrics = false;
let currentLyricsTrackId = null;

// Sync & Header Elements
const pillSyncCode = document.getElementById('pillSyncCode');
const syncCodeDisplay = document.getElementById('syncCodeDisplay');
const syncDeviceModel = document.getElementById('syncDeviceModel');
const syncLastTime = document.getElementById('syncLastTime');
const btnForceSync = document.getElementById('btnForceSync');
const btnCopyCode = document.getElementById('btnCopyCode');
const btnEditSync = document.getElementById('btnEditSync');

// Badges
const badgeFavorites = document.getElementById('badgeFavorites');
const badgeAll = document.getElementById('badgeAll');
const badgeArtists = document.getElementById('badgeArtists');
const badgeAlbums = document.getElementById('badgeAlbums');
const badgePlaylists = document.getElementById('badgePlaylists');

// Artist Detail Elements
const btnBackToArtists = document.getElementById('btnBackToArtists');
const artistBackdrop = document.getElementById('artistBackdrop');
const artistHeroAvatar = document.getElementById('artistHeroAvatar');
const artistHeroName = document.getElementById('artistHeroName');
const artistHeroListeners = document.getElementById('artistHeroListeners');
const artistHeroBio = document.getElementById('artistHeroBio');
const btnArtistPlayAll = document.getElementById('btnArtistPlayAll');
const btnArtistFollow = document.getElementById('btnArtistFollow');
const artistTabContent = document.getElementById('artistTabContent');

// Album Detail Elements
const albumDetailView = document.getElementById('albumDetailView');
const btnBackFromAlbum = document.getElementById('btnBackFromAlbum');
const albumBackText = document.getElementById('albumBackText');
const albumBackdrop = document.getElementById('albumBackdrop');
const albumHeroCover = document.getElementById('albumHeroCover');
const albumHeroTitle = document.getElementById('albumHeroTitle');
const albumHeroArtist = document.getElementById('albumHeroArtist');
const albumHeroTracksCount = document.getElementById('albumHeroTracksCount');
const btnAlbumPlayAll = document.getElementById('btnAlbumPlayAll');
const albumTracksContainer = document.getElementById('albumTracksContainer');

let selectedAlbum = null;
let previousViewForAlbum = 'home';
let currentAlbumTracksCache = [];

// Modal Elements
const syncModal = document.getElementById('syncModal');
const inputSyncCode = document.getElementById('inputSyncCode');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnCancelModal = document.getElementById('btnCancelModal');
const btnSaveModal = document.getElementById('btnSaveModal');

// Window Controls
document.getElementById('btnMinimize').addEventListener('click', () => window.auraApi.windowControl('minimize'));
document.getElementById('btnMaximize').addEventListener('click', () => window.auraApi.windowControl('maximize'));
document.getElementById('btnClose').addEventListener('click', () => window.auraApi.windowControl('close'));

function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// ---------------------------------------------------------
// 1. Inicialización y Conexión en Tiempo Real
// ---------------------------------------------------------
async function init() {
    refreshIcons();

    const code = await window.auraApi.getSyncCode();
    updateSyncCodeUI(code);

    // Avisar si Firebase no está configurado en este equipo (causa típica del error al conectar en Windows)
    try {
        const status = await window.auraApi.getSyncStatus();
        if (status && !status.firebaseReady && status.error) {
            showToast(escapeHtml(status.error), 'normal', 'alert-circle');
        }
    } catch (_) {}

    window.auraApi.onSyncError(info => {
        const msg = info && info.message ? info.message : 'Error desconocido';
        let hint = '';
        if (/PERMISSION_DENIED|permission/i.test(msg)) hint = ' (revisa los permisos de la clave de servicio en Firebase)';
        showToast(escapeHtml(`Error de sincronización: ${msg}${hint}`), 'normal', 'alert-circle');
    });

    // Escuchar actualizaciones en tiempo real desde Firestore
    window.auraApi.onSyncData(data => {
        console.log('[Sync] Datos recibidos de Firestore:', data);
        if (data && data.songs) {
            data.songs.forEach(s => {
                if (s.id && /^[a-zA-Z0-9_-]{11}$/.test(s.id) && (!s.coverUrl || s.coverUrl.startsWith('/storage') || s.coverUrl.startsWith('content://'))) {
                    s.coverUrl = `https://i.ytimg.com/vi/${s.id}/hqdefault.jpg`;
                }
            });
        }
        syncData = data;
        updateSyncCodeUI(data.syncCode);
        updateMetadataUI(data.meta);
        updateBadges();

        if (artistDetailView.style.display !== 'none' && selectedArtist) {
            renderArtistTabs();
        } else {
            renderCurrentView();
        }
    });

    // Escuchar atajos globales
    window.auraApi.onGlobalShortcut(action => {
        if (action === 'SETTINGS') {
            const settingsModal = document.getElementById('settingsModal');
            if (settingsModal) {
                if (settingsModal.classList.contains('open')) {
                    settingsModal.classList.remove('open');
                } else {
                    const btnOpen = document.getElementById('btnOpenSettings');
                    if (btnOpen) btnOpen.click();
                }
            }
            return;
        }

        if (!currentTrack) {
            showToast('No hay ninguna pista en reproducción.', 'normal', 'alert-circle');
            return;
        }
        if (action === 'FAVORITE') {
            handleTrackFavoriteAction(currentTrack);
        } else if (action === 'DOWNLOAD') {
            sendDownloadToPhone(currentTrack);
        }
    });

    applyLanguage(currentAppLang);
    setupEvents();
    selectedArtist = null;
    artistDetailView.style.display = 'none';
    showHomeView();
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function updateSyncCodeUI(code) {
    pillSyncCode.textContent = code || 'Sin vincular';
    syncCodeDisplay.textContent = code || '---';
    inputSyncCode.value = code || '';

    const badge = document.getElementById('pillSyncBadge');
    if (badge) badge.textContent = code ? 'VINCULADO' : 'SIN VINCULAR';
    const loadingCode = document.getElementById('loadingSyncCode');
    if (loadingCode) loadingCode.textContent = code || '...';
    const settingsCode = document.getElementById('settingsCurrentSyncCode');
    if (settingsCode) settingsCode.textContent = code || '---';
    if (typeof syncData === 'object' && syncData && code) syncData.syncCode = code;
}

function updateMetadataUI(meta) {
    if (!meta) return;
    if (meta.deviceModel) {
        syncDeviceModel.textContent = `${meta.deviceModel}`;
        const btnToggleDevicePanel = document.getElementById('btnToggleDevicePanel');
        if (btnToggleDevicePanel) {
            btnToggleDevicePanel.setAttribute('data-tooltip', `${meta.deviceModel} (Sincronizado)`);
        }
    }
    if (meta.lastSyncedAt) {
        const dateStr = new Date(meta.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        syncLastTime.textContent = `Sincronizado a las ${dateStr}`;
    }
}

function updateBadges() {
    const favCount = syncData.songs.filter(s => s.isFavorite).length;
    badgeFavorites.textContent = favCount;
    badgeAll.textContent = syncData.songs.length;
    badgeArtists.textContent = syncData.artists.length;
    badgeAlbums.textContent = syncData.albums.length;
    badgePlaylists.textContent = syncData.playlists.length;
}

// ---------------------------------------------------------
// 2. Renderizado de Vistas
// ---------------------------------------------------------
function updateLiveDate() {
    const elDate = document.getElementById('homeLiveDate');
    const elGreeting = document.getElementById('homeGreetingTitle');
    if (!elDate) return;

    const now = new Date();
    const isEn = currentAppLang === 'en';
    const locale = isEn ? 'en-US' : 'es-ES';
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString(locale, options);
    elDate.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    if (elGreeting) {
        const hour = now.getHours();
        let greeting = t('greetingEvening', 'Buenas noches');
        if (hour >= 6 && hour < 12) greeting = t('greetingMorning', 'Buenos días');
        else if (hour >= 12 && hour < 20) greeting = t('greetingAfternoon', 'Buenas tardes');
        elGreeting.textContent = `${greeting}, David`;
    }
}

// Actualizar fecha cada 60 segundos
setInterval(updateLiveDate, 60000);

function showStandardView() {
    if (homeViewWrapper) homeViewWrapper.style.display = 'none';
    if (artistDetailView) artistDetailView.style.display = 'none';
    if (albumDetailView) albumDetailView.style.display = 'none';
    standardViewWrapper.style.display = 'block';
}

function showHomeView() {
    if (homeViewWrapper) homeViewWrapper.style.display = 'flex';
    if (standardViewWrapper) standardViewWrapper.style.display = 'none';
    if (artistDetailView) artistDetailView.style.display = 'none';
    if (albumDetailView) albumDetailView.style.display = 'none';
    const mainEl = document.querySelector('.main-content');
    if (mainEl) mainEl.scrollTop = 0;
    renderHomeView();
}

// ---------------------------------------------------------
// Helper centralizado para Favoritos en ROJO VIBRANTE (#ff1a40)
// ---------------------------------------------------------
function isTrackFavorite(track) {
    if (!track) return false;
    const trackId = (track.id || '').trim();
    if (trackId) {
        const found = (syncData.songs || []).find(s => s.id === trackId);
        if (found) return found.isFavorite === true;
    }
    return track.isFavorite === true;
}

function toggleTrackFavorite(track, makeFav) {
    if (!track) return;
    track.isFavorite = makeFav;
    const trackId = (track.id || '').trim();

    let found = false;
    (syncData.songs || []).forEach(s => {
        if (trackId && s.id === trackId) {
            s.isFavorite = makeFav;
            found = true;
        }
    });

    if (!found && makeFav) {
        syncData.songs.unshift({
            id: track.id,
            title: track.title,
            artist: track.artist,
            album: track.album || 'YouTube Music',
            duration: track.duration,
            durationMs: track.durationMs,
            coverUrl: track.coverUrl,
            mediaUri: track.mediaUri,
            isFavorite: true
        });
    }

    updateBadges();
    if (currentTrack && trackId && currentTrack.id === trackId) {
        currentTrack.isFavorite = makeFav;
        updatePlayerFavButtonUI();
    }
}

function updateTrackFavButtonUI(btn, isFav) {
    if (!btn) return;
    if (isFav) {
        btn.classList.add('active', 'is-favorite');
        btn.title = '❤️ En Favoritos del Móvil (Clic para quitar)';
        const icon = btn.querySelector('.row-action-icon') || btn.querySelector('i') || btn.querySelector('svg');
        if (icon) {
            icon.style.fill = '#ff1a40';
            icon.style.stroke = '#ff1a40';
        }
        btn.style.color = '#ff1a40';
        btn.style.borderColor = '#ff1a40';
        btn.style.background = 'rgba(255, 26, 64, 0.18)';
    } else {
        btn.classList.remove('active', 'is-favorite');
        btn.title = 'Guardar como Favorito en Móvil';
        const icon = btn.querySelector('.row-action-icon') || btn.querySelector('i') || btn.querySelector('svg');
        if (icon) {
            icon.style.fill = 'none';
            icon.style.stroke = 'currentColor';
        }
        btn.style.color = '';
        btn.style.borderColor = '';
        btn.style.background = '';
    }
}

function updatePlayerFavButtonUI() {
    const isFav = currentTrack ? isTrackFavorite(currentTrack) : false;
    [btnPushFavorite, lyricsBtnFav].forEach(btn => {
        if (!btn) return;
        const icon = btn.querySelector('.push-icon-heart');
        const text = btn.querySelector('.push-text');

        if (isFav) {
            btn.classList.add('is-favorite');
            btn.style.background = '#ff1a40';
            btn.style.borderColor = '#ff1a40';
            btn.style.color = '#ffffff';
            btn.style.boxShadow = '0 0 18px rgba(255, 26, 64, 0.6)';
            if (icon) {
                icon.style.fill = '#ffffff';
                icon.style.stroke = '#ffffff';
            }
            if (text) text.textContent = 'EN FAVORITOS ❤️';
        } else {
            btn.classList.remove('is-favorite');
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.color = '';
            btn.style.boxShadow = '';
            if (icon) {
                icon.style.fill = 'none';
                icon.style.stroke = 'currentColor';
            }
            if (text) text.textContent = 'FAVORITO MÓVIL';
        }
    });
}

// Normalizar títulos para comparar si ya existe en favoritos
function cleanTitleForComparison(title, artist = '') {
    if (!title) return '';
    let clean = title
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s*\(official.*?\)/gi, '')
        .replace(/\s*\[official.*?\]/gi, '')
        .replace(/\s*\(video.*?\)/gi, '')
        .replace(/\s*\[video.*?\]/gi, '')
        .replace(/\s*\(audio.*?\)/gi, '')
        .replace(/\s*\[audio.*?\]/gi, '')
        .replace(/\s*\(letra.*?\)/gi, '')
        .replace(/\s*\[letra.*?\]/gi, '')
        .replace(/\s*\(visualizer.*?\)/gi, '')
        .replace(/\s*\[visualizer.*?\]/gi, '')
        .replace(/\s*\(video musical.*?\)/gi, '')
        .replace(/\s*\(videoclip.*?\)/gi, '')
        .replace(/\s*\(en vivo.*?\)/gi, '')
        .replace(/\s*\[en vivo.*?\]/gi, '')
        .replace(/\s*\(live.*?\)/gi, '')
        .replace(/\s*\[live.*?\]/gi, '');

    // Si el título viene con prefijo del artista ("Bad Bunny - Tití Me Preguntó"), limpiarlo
    if (artist && artist.trim()) {
        const cleanArtist = artist.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        if (clean.startsWith(cleanArtist + ' -')) {
            clean = clean.substring(cleanArtist.length + 2).trim();
        } else if (clean.startsWith(cleanArtist + '-')) {
            clean = clean.substring(cleanArtist.length + 1).trim();
        }
    }

    return clean.replace(/[\W_]+/g, ' ').trim();
}

function findDuplicateFavoriteTitle(track) {
    if (!track || !track.title) return null;
    const normNew = cleanTitleForComparison(track.title, track.artist);
    if (!normNew) return null;

    const trackId = (track.id || '').trim();
    return (syncData.songs || []).find(s => {
        if (!s.isFavorite) return false;
        // Si es el mismo track exacto por ID, no es un duplicado nuevo
        if (trackId && s.id && s.id === trackId) return false;
        const normExisting = cleanTitleForComparison(s.title, s.artist);
        return normExisting && normExisting === normNew;
    });
}

function handleTrackFavoriteAction(track, btn = null) {
    if (!track) return;
    const willBeFav = !isTrackFavorite(track);

    if (willBeFav) {
        // Regla: Notificar si ya existe una canción con el mismo nombre en favoritos
        const duplicate = findDuplicateFavoriteTitle(track);
        if (duplicate) {
            showToast('Hay una canción guardada con el mismo nombre', 'warning', 'alert-triangle');
        }
    }

    toggleTrackFavorite(track, willBeFav);
    if (btn) updateTrackFavButtonUI(btn, willBeFav);
    sendFavoriteToPhone(track, willBeFav);

    // Actualizar todas las filas en pantalla que coincidan con este ID
    const trackId = (track.id || '').trim();
    if (trackId) {
        document.querySelectorAll('.track-row').forEach(row => {
            if (row.dataset && row.dataset.trackId === trackId) {
                const favBtn = row.querySelector('.btn-track-fav');
                if (favBtn) updateTrackFavButtonUI(favBtn, willBeFav);
            }
        });
    }

    // Si estamos en la vista de favoritos y quitamos una canción, refrescar la lista
    if (!willBeFav && currentView === 'favorites') {
        renderCurrentView();
    }
}

let homeFeedData = null;

function getCleanFollowedArtist(art) {
    let name = (art.name || '').trim();
    const id = (art.id || '').trim();
    let coverUrl = art.coverUrl;

    if (id === 'UC4AhfNK5YzbU1CEmrdfd9Pw' || name.toLowerCase().includes('pedro')) {
        name = 'Pedro Suárez-Vértiz';
        coverUrl = 'https://yt3.ggpht.com/ytc/AIdro_mlaCQQm9EWnAme2UV11II3wDltUcMRk72jwg_hjjqzgw=w1342-h559-l90-rj-dcLVWYrqEJ';
    } else if (id === 'UC03jIQv4WXBSHdr1DlCLYDw') {
        name = 'Pitbull';
        coverUrl = 'https://lh3.googleusercontent.com/HmMAol83AWxVt46vykUTd8_clsx_sPOEDJA72HL6lMVwMyCKPdShn3O3BDY7-jv9iZNfBHkcrhxJ3g=w2880-h1200-p-l90-rj';
    } else if (id === 'UC9zGoN468pvQbLSciziQCSQ') {
        name = 'Los Rodríguez';
        coverUrl = 'https://lh3.googleusercontent.com/tT3yTVFo8EIiYhe8vmRW1_oso2USH-o7JhUj5CSvVLmG-Qg1VK6iADkDT0hwwyIktsJMLw0faRb_Ds8=w2880-h1200-p-l90-rj';
    } else if (id === 'UCxtvuCXJMwEzD0_t8GbZcNg') {
        name = 'Juan Luis Guerra';
        coverUrl = 'https://lh3.googleusercontent.com/-7DbJBEgm3fUK1sE-Kltq4vH64-fvO8XI46GTrDGhT1BKfnR12GUHBnTWm9wUjCuqI1YkQrwEr1SBxlr=w1080-h450-p-l90-rj';
    } else if (id === 'Christian Meier' || name.toLowerCase().includes('christian meier')) {
        name = 'Christian Meier';
        coverUrl = 'https://yt3.googleusercontent.com/5ffnF5Mcli7o4JFvne6HSIDsr3X6JgD0V918mmN9YvgOyW19CAqdEwdNzWUcANlorNgBeSr8yQ=s900-c-k-c0x00ffffff-no-rj';
    } else if (id && !id.startsWith('UC') && !/^\d+$/.test(id)) {
        name = id;
    } else if (name.match(/^[\d,.]+\s*[KM]?$/i) || name === 'Artista' || !name) {
        name = id;
    }

    if (!coverUrl || coverUrl.startsWith('/storage/') || coverUrl.includes('placeholder')) {
        const matchingSong = (syncData.songs || []).find(s => (s.artist || '').toLowerCase().includes(name.toLowerCase()));
        if (matchingSong && matchingSong.coverUrl && !matchingSong.coverUrl.startsWith('/storage/')) {
            coverUrl = matchingSong.coverUrl;
        } else {
            coverUrl = `https://via.placeholder.com/150/121826/00F0FF?text=${encodeURIComponent(name.charAt(0))}`;
        }
    }

    return {
        id: art.id || name,
        name,
        coverUrl,
        role: 'Siguiendo en móvil'
    };
}

async function renderHomeView() {
    updateLiveDate();

    // Stats en la píldora (temas, favoritos, artistas de la biblioteca)
    const favCount = syncData.songs.filter(s => s.isFavorite).length;
    const statSongs = document.getElementById('homeStatSongs');
    const statFavs = document.getElementById('homeStatFavs');
    const statArtists = document.getElementById('homeStatArtists');
    if (statSongs) statSongs.textContent = syncData.songs.length;
    if (statFavs) statFavs.textContent = favCount;
    if (statArtists) statArtists.textContent = syncData.artists.length;

    // Si aún no tenemos los datos del feed de YouTube, los solicitamos a main
    if (!homeFeedData) {
        homeFeedData = await window.auraApi.getHomeFeed();
    }

    const feed = homeFeedData || {
        quickPicks: [],
        popularArtists: [],
        featuredAlbums: [],
        trendingTracks: []
    };

    // 1. Selección Rápida (Éxitos con carátula real de YouTube)
    const containerPicks = document.getElementById('homeQuickPicks');
    if (containerPicks) {
        containerPicks.innerHTML = '';
        const picks = (feed.quickPicks && feed.quickPicks.length > 0) ? feed.quickPicks : syncData.songs.slice(0, 6);

        if (picks.length === 0) {
            containerPicks.innerHTML = `<p style="color:var(--text-muted); font-size:12px; grid-column:1/-1;">Cargando selección de música...</p>`;
        } else {
            picks.forEach(track => {
                const card = document.createElement('div');
                card.className = 'quick-pick-card';
                let cover = track.coverUrl || '';
                if (!cover || cover.startsWith('content://') || cover.startsWith('/storage')) {
                    if (track.id && /^[a-zA-Z0-9_-]{11}$/.test(track.id) && !track.id.startsWith('PL') && !track.id.startsWith('RD')) {
                        cover = `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
                    } else {
                        cover = DEFAULT_TRACK_COVER;
                    }
                }
                card.innerHTML = `
                    <img src="${cover}" alt="${track.title}" class="quick-pick-cover" onerror="this.src='${DEFAULT_TRACK_COVER}'">
                    <div class="quick-pick-info">
                        <span class="quick-pick-title" title="${track.title}">${track.title}</span>
                        <span class="quick-pick-artist" title="${track.artist}">${track.artist}</span>
                    </div>
                    <button class="quick-pick-play-btn" title="Reproducir">
                        <i data-lucide="play" style="width:14px; height:14px; fill:currentColor; stroke:none; margin-left:2px;"></i>
                    </button>
                `;

                let qkHover = null;
                card.addEventListener('mouseenter', () => {
                    qkHover = setTimeout(() => {
                        if (track && track.id && window.auraApi.prefetchAudioStream) {
                            window.auraApi.prefetchAudioStream(track.id);
                        }
                    }, 140);
                });
                card.addEventListener('mouseleave', () => {
                    if (qkHover) clearTimeout(qkHover);
                });

                card.addEventListener('click', () => {
                    if (!track || !track.id || track.id.startsWith('PL') || track.id.startsWith('RD') || track.id.startsWith('VL')) {
                        showToast('Este elemento no es un tema individual reproducible.', 'normal', 'alert-circle');
                        return;
                    }
                    playTrack(track, picks, picks.findIndex(s => s.id === track.id));
                });
                containerPicks.appendChild(card);
            });
        }
    }

    // 2. Artistas que sigues (Sincronizados desde tu teléfono Android)
    const containerFollowed = document.getElementById('homeFollowedArtists');
    const sectionFollowed = document.getElementById('sectionFollowedArtists');
    const tagFollowed = document.getElementById('tagFollowedArtistsCount');

    if (containerFollowed) {
        containerFollowed.innerHTML = '';
        const rawArtists = syncData.artists || [];
        const seenNames = new Set();
        const followedClean = [];

        rawArtists.forEach(art => {
            const clean = getCleanFollowedArtist(art);
            const lower = clean.name.toLowerCase();
            if (!seenNames.has(lower) && clean.name !== 'Artista') {
                seenNames.add(lower);
                followedClean.push(clean);
            }
        });

        if (tagFollowed) {
            tagFollowed.textContent = `${followedClean.length} en tu biblioteca móvil`;
        }

        if (followedClean.length === 0) {
            if (sectionFollowed) sectionFollowed.style.display = 'none';
        } else {
            if (sectionFollowed) sectionFollowed.style.display = 'block';
            followedClean.forEach(artist => {
                const card = document.createElement('div');
                card.className = 'home-artist-card followed';
                card.innerHTML = `
                    <div style="position:relative; width:76px; height:76px; margin-bottom:10px;">
                        <img src="${artist.coverUrl}" alt="${artist.name}" class="home-artist-avatar" style="margin-bottom:0;" onerror="this.src='https://via.placeholder.com/80/121826/00F0FF?text=🎤'">
                        <div style="position:absolute; bottom:0; right:0; width:20px; height:20px; border-radius:50%; background:#0A0E17; border:1px solid rgba(0,240,255,0.4); display:flex; align-items:center; justify-content:center; box-shadow:0 0 8px rgba(0,240,255,0.3);">
                            <i data-lucide="heart" style="width:11px; height:11px; color:var(--cyber-pink); fill:var(--cyber-pink);"></i>
                        </div>
                    </div>
                    <span class="home-artist-name" title="${artist.name}">${artist.name}</span>
                    <span class="home-artist-role" style="color:var(--cyber-cyan);">Siguiendo</span>
                `;
                card.addEventListener('click', () => {
                    openArtistDetail(artist);
                });
                containerFollowed.appendChild(card);
            });
        }
    }

    // 3. Artistas Populares Reales (Fotos de alta calidad, tendencias mundiales)
    const containerArtists = document.getElementById('homeTopArtists');
    if (containerArtists) {
        containerArtists.innerHTML = '';
        const artists = (feed.popularArtists && feed.popularArtists.length > 0) ? feed.popularArtists : [];

        artists.forEach(artist => {
            const card = document.createElement('div');
            card.className = 'home-artist-card';
            card.innerHTML = `
                <img src="${artist.coverUrl}" alt="${artist.name}" class="home-artist-avatar" onerror="this.src='https://via.placeholder.com/80/121826/00F0FF?text=🎤'">
                <span class="home-artist-name" title="${artist.name}">${artist.name}</span>
                <span class="home-artist-role">${artist.role || 'Artista'}</span>
            `;
            card.addEventListener('click', () => {
                openArtistDetail(artist);
            });
            containerArtists.appendChild(card);
        });
    }

    // 3. Álbumes Destacados Reales (Carátulas de discos icónicos)
    const containerAlbums = document.getElementById('homeFeaturedAlbums');
    if (containerAlbums) {
        containerAlbums.innerHTML = '';
        const albums = (feed.featuredAlbums && feed.featuredAlbums.length > 0) ? feed.featuredAlbums : [];

        albums.forEach(album => {
            const card = document.createElement('div');
            card.className = 'home-album-card';
            card.innerHTML = `
                <img src="${album.coverUrl}" alt="${album.title}" class="home-album-cover" onerror="this.src='https://via.placeholder.com/150/121826/00F0FF?text=💿'">
                <span class="home-album-title" title="${album.title}">${album.title}</span>
                <span class="home-album-artist" title="${album.artist}">${album.artist} • ${album.year}</span>
            `;
            card.addEventListener('click', () => {
                openAlbumDetail(album, 'home');
            });
            containerAlbums.appendChild(card);
        });
    }

    // 4. Tendencias Globales (Canciones reales de YouTube con CSS exacto y portadas reales)
    const containerTrending = document.getElementById('homeTrendingTracks');
    if (containerTrending) {
        containerTrending.innerHTML = '';
        const trendingTracks = (feed.trendingTracks && feed.trendingTracks.length > 0) ? feed.trendingTracks : syncData.songs.slice(0, 8);

        if (trendingTracks.length === 0) {
            containerTrending.innerHTML = `<p style="color:var(--text-muted); font-size:12px;">Cargando tendencias globales...</p>`;
        } else {
            trendingTracks.forEach((track, index) => {
                const row = document.createElement('div');
                row.className = `track-row ${currentTrack && currentTrack.id === track.id ? 'playing' : ''}`;
                row.dataset.trackId = track.id || '';
                const duration = track.duration || formatDuration(track.durationMs);

                const isFav = isTrackFavorite(track);
                row.innerHTML = `
                    <span class="track-index">${index + 1}</span>
                    <img src="${track.coverUrl}" class="track-cover-sm" alt="Cover" onerror="this.src='${DEFAULT_TRACK_COVER}'">
                    <div class="track-info-col">
                        <div class="track-name" title="${track.title}">${track.title}</div>
                        <div class="track-artist-sub" title="Ver ${track.artist}">${track.artist}</div>
                    </div>
                    <div class="track-album-col">${track.album || 'YouTube Music'}</div>
                    <div class="track-duration-col">${duration}</div>
                    <div class="track-actions-col">
                        <button class="row-action-btn btn-track-play" title="Reproducir en PC">
                            <i data-lucide="play" class="row-action-icon"></i>
                        </button>
                        <button class="row-action-btn fav-btn btn-track-fav ${isFav ? 'active is-favorite' : ''}" title="${isFav ? '❤️ En Favoritos del Móvil (Clic para quitar)' : 'Guardar como Favorito en Móvil'}" style="${isFav ? 'color:#ff1a40; border-color:#ff1a40; background:rgba(255,26,64,0.18);' : ''}">
                            <i data-lucide="heart" class="row-action-icon" style="${isFav ? 'fill:#ff1a40; stroke:#ff1a40;' : ''}"></i>
                        </button>
                        <button class="row-action-btn download-btn btn-track-download" title="📲 Descargar en teléfono">
                            <i data-lucide="arrow-down-to-line" class="row-action-icon"></i>
                        </button>
                    </div>
                `;

                row.querySelector('.btn-track-play').addEventListener('click', (e) => {
                    e.stopPropagation();
                    playTrack(track, trendingTracks, index);
                });

                row.querySelector('.btn-track-fav').addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleTrackFavoriteAction(track, e.currentTarget);
                });

                row.querySelector('.btn-track-download').addEventListener('click', (e) => {
                    e.stopPropagation();
                    sendDownloadToPhone(track);
                });

                row.addEventListener('click', () => {
                    playTrack(track, trendingTracks, index);
                });

                containerTrending.appendChild(row);
            });
        }
    }

    refreshIcons();
}

function renderCurrentView() {
    if (currentView === 'home') {
        showHomeView();
        return;
    }

    showStandardView();
    const filterText = (filterInput.value || '').toLowerCase().trim();

    if (currentView === 'favorites') {
        viewTitle.innerHTML = `${t('titleFavorites', 'Mis Favoritos')} <span style="font-size:18px; color:var(--neon-pink)">❤️</span>`;
        viewSubtitle.textContent = t('subtitleFavorites', 'Canciones marcadas como favoritas en tu teléfono Android');
        let tracks = syncData.songs.filter(s => s.isFavorite);
        if (filterText) {
            tracks = tracks.filter(t => (t.title || '').toLowerCase().includes(filterText) || (t.artist || '').toLowerCase().includes(filterText));
        }
        renderTracks(tracks);
    } else if (currentView === 'all') {
        viewTitle.innerHTML = `${t('titleAllSongs', 'Todas las Canciones')} <span style="font-size:18px; color:var(--cyber-cyan)">🎵</span>`;
        viewSubtitle.textContent = t('subtitleAllSongs', 'Catálogo unificado de tu biblioteca móvil');
        let tracks = syncData.songs;
        if (filterText) {
            tracks = tracks.filter(t => (t.title || '').toLowerCase().includes(filterText) || (t.artist || '').toLowerCase().includes(filterText));
        }
        renderTracks(tracks);
    } else if (currentView === 'artists') {
        viewTitle.innerHTML = `${t('titleArtists', 'Artistas Seguidos')} <span style="font-size:18px; color:var(--cyber-cyan)">🎤</span>`;
        viewSubtitle.textContent = t('subtitleArtists', 'Selecciona un artista para abrir su perfil inmersivo con álbumes y biografía');
        renderArtists(syncData.artists);
    } else if (currentView === 'albums') {
        viewTitle.innerHTML = `${t('titleAlbums', 'Álbumes Guardados')} <span style="font-size:18px; color:var(--cyber-cyan)">💿</span>`;
        viewSubtitle.textContent = t('subtitleAlbums', 'Colección de álbumes en tu biblioteca');
        renderAlbums(syncData.albums);
    } else if (currentView === 'playlists') {
        viewTitle.innerHTML = `${t('titlePlaylists', 'Listas de Reproducción')} <span style="font-size:18px; color:var(--cyber-cyan)">📂</span>`;
        viewSubtitle.textContent = t('subtitlePlaylists', 'Playlists sincronizadas desde tu teléfono');
        renderPlaylists(syncData.playlists);
    }
}

function renderTracks(tracks) {
    currentQueue = tracks;
    tracksContainer.innerHTML = '';

    if (!tracks || tracks.length === 0) {
        tracksContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="music" style="width:44px; height:44px; color:var(--text-muted); stroke-width:1.5;"></i>
                <h3 style="margin-top:12px;">No hay canciones en esta sección</h3>
                <p>Pulsa "FORZAR SYNC MÓVIL" o realiza una búsqueda en YouTube para agregar más música.</p>
            </div>
        `;
        refreshIcons();
        return;
    }

    tracks.forEach((track, idx) => {
        const row = document.createElement('div');
        row.className = `track-row ${currentTrack && currentTrack.id === track.id ? 'playing' : ''}`;
        row.dataset.trackId = track.id || '';
        
        const durationFormatted = formatDuration(track.durationMs || track.duration || 0);
        let coverSrc = track.coverUrl || track.thumbnailUrl || '';
        if (!coverSrc || coverSrc.startsWith('/storage') || coverSrc.startsWith('content://')) {
            if (track.id && /^[a-zA-Z0-9_-]{11}$/.test(track.id) && !track.id.startsWith('PL') && !track.id.startsWith('RD')) {
                coverSrc = `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
            } else {
                coverSrc = DEFAULT_TRACK_COVER;
            }
        }

        const isFav = isTrackFavorite(track);
        row.innerHTML = `
            <span class="track-index">${idx + 1}</span>
            <img src="${coverSrc}" class="track-cover-sm" alt="Cover" onerror="this.src='${DEFAULT_TRACK_COVER}'">
            <div class="track-info-col">
                <div class="track-name" title="${track.title}">${track.title}</div>
                <div class="track-artist-sub" title="Ver perfil de ${track.artist}">${track.artist}</div>
            </div>
            <div class="track-album-col" title="${track.album || ''}">${track.album || 'Single'}</div>
            <div class="track-duration-col">${durationFormatted}</div>
            <div class="track-actions-col">
                <button class="row-action-btn btn-track-play" title="Reproducir en PC">
                    <i data-lucide="play" class="row-action-icon"></i>
                </button>
                <button class="row-action-btn fav-btn btn-track-fav ${isFav ? 'active is-favorite' : ''}" title="${isFav ? '❤️ En Favoritos del Móvil (Clic para quitar)' : 'Guardar como Favorito en Móvil'}" style="${isFav ? 'color:#ff1a40; border-color:#ff1a40; background:rgba(255,26,64,0.18);' : ''}">
                    <i data-lucide="heart" class="row-action-icon" style="${isFav ? 'fill:#ff1a40; stroke:#ff1a40;' : ''}"></i>
                </button>
                <button class="row-action-btn download-btn btn-track-download" title="Descargar en mi Teléfono">
                    <i data-lucide="arrow-down-to-line" class="row-action-icon"></i>
                </button>
            </div>
        `;

        row.querySelector('.btn-track-play').addEventListener('click', (e) => {
            e.stopPropagation();
            playTrack(track, tracks, idx);
        });

        row.querySelector('.btn-track-fav').addEventListener('click', (e) => {
            e.stopPropagation();
            handleTrackFavoriteAction(track, e.currentTarget);
        });

        row.querySelector('.btn-track-download').addEventListener('click', (e) => {
            e.stopPropagation();
            sendDownloadToPhone(track);
        });

        row.querySelector('.track-artist-sub').addEventListener('click', (e) => {
            e.stopPropagation();
            openArtistDetail({ name: track.artist, coverUrl: track.coverUrl });
        });

        let hoverTimer = null;
        row.addEventListener('mouseenter', () => {
            hoverTimer = setTimeout(() => {
                if (track && track.id && window.auraApi.prefetchAudioStream) {
                    window.auraApi.prefetchAudioStream(track.id);
                }
            }, 140);
        });
        row.addEventListener('mouseleave', () => {
            if (hoverTimer) clearTimeout(hoverTimer);
        });

        row.addEventListener('click', (e) => {
            if (e.target.closest('.row-action-btn') || e.target.closest('.track-artist-sub')) return;
            playTrack(track, tracks, idx);
        });

        row.addEventListener('dblclick', () => {
            playTrack(track, tracks, idx);
        });

        tracksContainer.appendChild(row);
    });

    refreshIcons();
}

// ---------------------------------------------------------
// 3. Artistas y Vista de Detalle Inmersiva
// ---------------------------------------------------------
function renderArtists(artists) {
    tracksContainer.innerHTML = '';
    const rawArtists = artists || [];
    const seenNames = new Set();
    const cleanArtists = [];

    rawArtists.forEach(art => {
        const clean = getCleanFollowedArtist(art);
        const lower = clean.name.toLowerCase();
        if (!seenNames.has(lower) && clean.name !== 'Artista') {
            seenNames.add(lower);
            cleanArtists.push(clean);
        }
    });

    if (cleanArtists.length === 0) {
        tracksContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="users" style="width:44px; height:44px; color:var(--text-muted); stroke-width:1.5;"></i>
                <h3 style="margin-top:12px;">Sin artistas seguidos</h3>
                <p>Sincroniza desde tu móvil para importar los artistas que sigues en tu biblioteca.</p>
            </div>
        `;
        refreshIcons();
        return;
    }

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; padding: 10px 0;';

    cleanArtists.forEach(art => {
        const artistName = art.name;
        const coverSrc = art.coverUrl;

        const card = document.createElement('div');
        card.style.cssText = 'background:var(--bg-glass-card); border:1px solid var(--border-glass); border-radius:16px; padding:18px 14px; text-align:center; cursor:pointer; transition:all 0.2s cubic-bezier(0.16, 1, 0.3, 1);';
        card.innerHTML = `
            <div style="position:relative; width:110px; height:110px; margin:0 auto 14px;">
                <img src="${coverSrc}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; border:2.5px solid var(--cyber-cyan-border); box-shadow:0 0 16px var(--cyber-cyan-dim);" onerror="this.src='https://via.placeholder.com/130/121826/00F0FF?text=🎤'">
            </div>
            <div style="font-size:14px; font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${artistName}</div>
            <div style="font-size:11px; font-family:var(--font-mono); color:var(--cyber-cyan); margin-top:4px;">VER PERFIL →</div>
        `;

        card.addEventListener('mouseenter', () => {
            card.style.borderColor = 'var(--cyber-cyan)';
            card.style.transform = 'translateY(-3px)';
            card.style.boxShadow = '0 8px 24px rgba(0, 240, 255, 0.2)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.borderColor = 'var(--border-glass)';
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });

        card.addEventListener('click', () => {
            openArtistDetail(art);
        });

        grid.appendChild(card);
    });

    tracksContainer.appendChild(grid);
    refreshIcons();
}

let currentArtistDetailsCache = null;

function openArtistDetail(artist) {
    selectedArtist = artist;
    currentArtistDetailsCache = null; // Reiniciar cache para consultar datos del nuevo artista
    if (homeViewWrapper) homeViewWrapper.style.display = 'none';
    if (standardViewWrapper) standardViewWrapper.style.display = 'none';
    if (albumDetailView) albumDetailView.style.display = 'none';
    artistDetailView.style.display = 'flex';

    const artistName = (artist.name || artist.artist || 'Artista').trim();
    const coverSrc = artist.coverUrl || 'https://via.placeholder.com/150/121826/00F0FF?text=🎤';

    artistHeroName.textContent = artistName;
    artistHeroAvatar.src = coverSrc;
    artistBackdrop.style.backgroundImage = `url('${coverSrc}')`;

    // Comprobar si el usuario realmente sigue a este artista en su biblioteca
    const isFollowedInPhone = (syncData.artists || []).some(a => {
        const cleanA = getCleanFollowedArtist(a);
        return cleanA.name.toLowerCase() === artistName.toLowerCase() ||
               (a.id && a.id.toLowerCase() === artistName.toLowerCase()) ||
               (a.name && a.name.toLowerCase() === artistName.toLowerCase());
    });

    if (isFollowedInPhone) {
        artistHeroListeners.textContent = `Artista en tu biblioteca móvil • Aura Music`;
        artistHeroBio.textContent = `${artistName} está en tu biblioteca de Android. Puedes escuchar sus temas sincronizados o reproducir su discografía completa desde YouTube.`;
        btnArtistFollow.classList.add('following');
        btnArtistFollow.innerHTML = `<i data-lucide="check" class="hero-action-icon"></i> <span>SIGUIENDO</span>`;
    } else {
        artistHeroListeners.textContent = `Catálogo Oficial • YouTube Music`;
        artistHeroBio.textContent = `Explora los temas más populares y álbumes oficiales de ${artistName} en streaming.`;
        btnArtistFollow.classList.remove('following');
        btnArtistFollow.innerHTML = `<i data-lucide="heart" class="hero-action-icon"></i> <span>SEGUIR</span>`;
    }

    artistActiveTab = 'songs';
    document.querySelectorAll('.artist-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.artist-tab[data-tab="songs"]').classList.add('active');

    renderArtistTabs();
    refreshIcons();
}

async function openAlbumDetail(album, fromView = 'home') {
    if (!album) return;
    selectedAlbum = album;
    previousViewForAlbum = fromView;

    if (homeViewWrapper) homeViewWrapper.style.display = 'none';
    if (standardViewWrapper) standardViewWrapper.style.display = 'none';
    if (artistDetailView) artistDetailView.style.display = 'none';
    albumDetailView.style.display = 'flex';

    if (fromView === 'artist') {
        albumBackText.textContent = selectedArtist ? `${t('backToArtists', 'Volver al Artista')} (${selectedArtist.name || selectedArtist.artist || ''})` : t('backToArtists', 'Volver al Artista');
    } else if (fromView === 'home') {
        albumBackText.textContent = t('backToHome', 'Volver al Inicio');
    } else {
        albumBackText.textContent = t('backToAlbums', 'Volver a Álbumes');
    }

    const typeTag = albumDetailView.querySelector('.artist-type-tag');
    if (typeTag) typeTag.textContent = t('albumTag', 'ÁLBUM OFICIAL');

    const playAllSpan = btnAlbumPlayAll ? btnAlbumPlayAll.querySelector('span') : null;
    if (playAllSpan) playAllSpan.textContent = t('playAlbum', 'REPRODUCIR ÁLBUM');

    const cover = album.coverUrl || 'https://via.placeholder.com/180/121826/00F0FF?text=💿';
    albumHeroCover.src = cover;
    albumBackdrop.style.backgroundImage = `url('${cover}')`;
    albumHeroTitle.textContent = album.title || 'Álbum';
    albumHeroArtist.textContent = `${album.artist || 'Artista'} • ${album.year || 'Álbum oficial'}`;
    albumHeroTracksCount.textContent = 'Cargando canciones del disco...';

    albumTracksContainer.innerHTML = `
        <div class="empty-state" style="padding: 40px 0;">
            <i data-lucide="loader-2" class="empty-spinner" style="width:36px; height:36px; color:var(--cyber-cyan); animation: spin 1s linear infinite;"></i>
            <h3 style="margin-top:14px; font-size:16px; font-weight:600;">Cargando pistas de "${album.title}"...</h3>
            <p style="font-size:12px; color:var(--text-muted); margin-top:4px;">Extrayendo el catálogo oficial de canciones</p>
        </div>
    `;
    refreshIcons();

    try {
        const tracks = await window.auraApi.getAlbumTracks(album);
        currentAlbumTracksCache = tracks || [];

        if (currentAlbumTracksCache.length === 0) {
            albumTracksContainer.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="disc-3" style="width:40px; height:40px; color:var(--text-muted); stroke-width:1.5;"></i>
                    <h3 style="margin-top:12px;">Sin pistas encontradas</h3>
                    <p>No se encontraron canciones en streaming para este álbum.</p>
                </div>
            `;
            albumHeroTracksCount.textContent = '0 canciones disponibles';
            refreshIcons();
            return;
        }

        albumHeroTracksCount.textContent = `${currentAlbumTracksCache.length} ${t('tracks', 'canciones')} • Catálogo oficial`;
        renderAlbumTrackRows(currentAlbumTracksCache, cover);
    } catch (err) {
        console.error('Error al abrir álbum:', err);
        albumTracksContainer.innerHTML = `<div class="empty-state"><p>Error al cargar canciones del álbum.</p></div>`;
    }
}

function renderAlbumTrackRows(tracks, fallbackCover) {
    albumTracksContainer.innerHTML = '';
    tracks.forEach((track, idx) => {
        const row = document.createElement('div');
        row.className = `track-row ${currentTrack && currentTrack.id === track.id ? 'playing' : ''}`;
        row.dataset.trackId = track.id || '';
        const coverSrc = track.coverUrl || fallbackCover || DEFAULT_TRACK_COVER;
        const isFav = isTrackFavorite(track);

        row.innerHTML = `
            <span class="track-index">${idx + 1}</span>
            <img src="${coverSrc}" class="track-cover-sm" alt="Cover" onerror="this.src='${DEFAULT_TRACK_COVER}'">
            <div class="track-info-col">
                <div class="track-name" title="${track.title}">${track.title}</div>
                <div class="track-artist-sub">${track.artist}</div>
            </div>
            <div class="track-album-col">${track.album || ''}</div>
            <div class="track-duration-col">${track.duration || formatDuration(track.durationMs || 0)}</div>
            <div class="track-actions-col">
                <button class="row-action-btn btn-track-play" title="Reproducir">
                    <i data-lucide="play" class="row-action-icon"></i>
                </button>
                <button class="row-action-btn fav-btn btn-track-fav ${isFav ? 'active is-favorite' : ''}" title="${isFav ? '❤️ En Favoritos' : 'Guardar en Favoritos'}" style="${isFav ? 'color:#ff1a40; border-color:#ff1a40; background:rgba(255,26,64,0.18);' : ''}">
                    <i data-lucide="heart" class="row-action-icon" style="${isFav ? 'fill:#ff1a40; stroke:#ff1a40;' : ''}"></i>
                </button>
                <button class="row-action-btn download-btn btn-track-download" title="${t('tooltipDownload', 'Descargar en mi Teléfono')}">
                    <i data-lucide="arrow-down-to-line" class="row-action-icon"></i>
                </button>
            </div>
        `;

        row.querySelector('.btn-track-play').addEventListener('click', () => {
            playTrack(track, tracks, idx);
        });
        row.querySelector('.btn-track-fav').addEventListener('click', (e) => {
            e.stopPropagation();
            handleTrackFavoriteAction(track, e.currentTarget);
        });
        row.querySelector('.btn-track-download').addEventListener('click', (e) => {
            e.stopPropagation();
            sendDownloadToPhone(track);
        });

        let albHoverTimer = null;
        row.addEventListener('mouseenter', () => {
            albHoverTimer = setTimeout(() => {
                if (track && track.id && window.auraApi.prefetchAudioStream) {
                    window.auraApi.prefetchAudioStream(track.id);
                }
            }, 140);
        });
        row.addEventListener('mouseleave', () => {
            if (albHoverTimer) clearTimeout(albHoverTimer);
        });

        row.addEventListener('click', (e) => {
            if (e.target.closest('.row-action-btn')) return;
            playTrack(track, tracks, idx);
        });

        albumTracksContainer.appendChild(row);
    });
    refreshIcons();
}

function openPlaylistDetail(playlist) {
    if (!playlist) return;
    selectedAlbum = null;
    previousViewForAlbum = 'sidebar-playlists';
    currentView = 'playlists';

    if (homeViewWrapper) homeViewWrapper.style.display = 'none';
    if (standardViewWrapper) standardViewWrapper.style.display = 'none';
    if (artistDetailView) artistDetailView.style.display = 'none';
    albumDetailView.style.display = 'flex';

    albumBackText.textContent = t('backToPlaylists', 'Volver a Listas de Reproducción');

    const firstTrackCover = playlist.tracks && playlist.tracks[0] && playlist.tracks[0].coverUrl;
    const cover = (playlist.coverUrl && !playlist.coverUrl.includes('placeholder.com')) ? playlist.coverUrl : (firstTrackCover || DEFAULT_PLAYLIST_COVER);
    albumHeroCover.src = cover;
    albumHeroCover.onerror = () => { albumHeroCover.src = DEFAULT_PLAYLIST_COVER; };
    albumBackdrop.style.backgroundImage = `url('${cover}')`;
    albumHeroTitle.textContent = playlist.title || 'Playlist';
    albumHeroArtist.textContent = playlist.description || t('syncedFromPhone', 'Sincronizada desde tu teléfono');

    const typeTag = albumDetailView.querySelector('.artist-type-tag');
    if (typeTag) typeTag.textContent = t('playlistTag', 'LISTA DE REPRODUCCIÓN');

    const playAllSpan = btnAlbumPlayAll ? btnAlbumPlayAll.querySelector('span') : null;
    if (playAllSpan) playAllSpan.textContent = t('playPlaylist', 'REPRODUCIR LISTA');

    // Extraer canciones de la playlist
    let tracks = playlist.tracks || [];
    if (!tracks || tracks.length === 0) {
        if (syncData && syncData.songs && syncData.songs.length > 0) {
            tracks = syncData.songs.filter(s => s.playlistId === playlist.id);
            if (tracks.length === 0 && playlist.title) {
                const cleanPlTitle = playlist.title.toLowerCase().trim();
                tracks = syncData.songs.filter(s => {
                    const artist = (s.artist || '').toLowerCase();
                    return artist === cleanPlTitle || (cleanPlTitle.length > 3 && artist.includes(cleanPlTitle));
                });
            }
        }
    }

    currentAlbumTracksCache = tracks;
    albumHeroTracksCount.textContent = `${tracks.length} ${t('tracks', 'canciones')}`;

    if (!tracks || tracks.length === 0) {
        albumTracksContainer.innerHTML = `
            <div class="empty-state" style="padding: 40px 0;">
                <i data-lucide="list-music" style="width:40px; height:40px; color:var(--cyber-cyan); opacity:0.8;"></i>
                <h3 style="margin-top:14px; font-size:16px; font-weight:600;">${t('playlistEmptyTitle', 'Lista sin canciones')}</h3>
                <p style="font-size:12px; color:var(--text-muted); margin-top:4px;">${t('playlistEmptyDesc', 'Abre Aura Music en tu teléfono y pulsa sincronizar para ver todas las pistas.')}</p>
            </div>
        `;
        refreshIcons();
        return;
    }

    renderAlbumTrackRows(tracks, cover);
}

async function renderArtistTabs() {
    if (!selectedArtist) return;
    const artistName = (selectedArtist.name || selectedArtist.artist || '').trim();

    // Obtener catálogo completo de YouTube si no está cacheado
    if (!currentArtistDetailsCache || currentArtistDetailsCache.name.toLowerCase() !== artistName.toLowerCase()) {
        artistTabContent.innerHTML = `
            <div class="empty-state" style="padding: 40px 0;">
                <i data-lucide="loader-2" class="empty-spinner" style="width:36px; height:36px; color:var(--cyber-cyan); animation: spin 1s linear infinite;"></i>
                <h3 style="margin-top:14px; font-size:16px; font-weight:600;">Cargando catálogo oficial de ${artistName}...</h3>
                <p style="font-size:12px; color:var(--text-muted); margin-top:4px;">Obteniendo canciones, álbumes y singles oficiales desde YouTube Music</p>
            </div>
        `;
        refreshIcons();

        try {
            const result = await window.auraApi.getArtistDetails(artistName);
            currentArtistDetailsCache = {
                name: artistName,
                songs: (result && result.songs) || [],
                albums: (result && result.albums) || [],
                singles: (result && result.singles) || []
            };
        } catch (e) {
            console.error('Error al cargar catálogo de artista:', e);
            currentArtistDetailsCache = { name: artistName, songs: [], albums: [], singles: [] };
        }
    }

    const { songs, albums, singles } = currentArtistDetailsCache;
    artistTabContent.innerHTML = '';

    if (artistActiveTab === 'songs') {
        if (!songs || songs.length === 0) {
            artistTabContent.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="music" style="width:40px; height:40px; color:var(--text-muted); stroke-width:1.5;"></i>
                    <h3 style="margin-top:12px;">Sin canciones disponibles</h3>
                    <p>No se encontraron canciones populares para este artista.</p>
                </div>
            `;
            refreshIcons();
            return;
        }

        const container = document.createElement('div');
        container.className = 'tracks-container';
        songs.forEach((track, idx) => {
            const row = document.createElement('div');
            row.className = `track-row ${currentTrack && currentTrack.id === track.id ? 'playing' : ''}`;
            row.dataset.trackId = track.id || '';
            const coverSrc = track.coverUrl || track.thumbnailUrl || 'https://via.placeholder.com/44';

            const isFav = isTrackFavorite(track);

            row.innerHTML = `
                <span class="track-index">${idx + 1}</span>
                <img src="${coverSrc}" class="track-cover-sm" alt="Cover" onerror="this.src='${DEFAULT_TRACK_COVER}'">
                <div class="track-info-col">
                    <div class="track-name" title="${track.title}">${track.title}</div>
                    <div class="track-artist-sub">${track.artist}</div>
                </div>
                <div class="track-album-col">${track.album || 'Single'}</div>
                <div class="track-duration-col">${track.duration || formatDuration(track.durationMs || 0)}</div>
                <div class="track-actions-col">
                    <button class="row-action-btn btn-track-play" title="Reproducir en PC">
                        <i data-lucide="play" class="row-action-icon"></i>
                    </button>
                    <button class="row-action-btn fav-btn btn-track-fav ${isFav ? 'active is-favorite' : ''}" title="${isFav ? '❤️ En Favoritos del Móvil (Clic para quitar)' : 'Guardar en Favoritos del Móvil'}" style="${isFav ? 'color:#ff1a40; border-color:#ff1a40; background:rgba(255,26,64,0.18);' : ''}">
                        <i data-lucide="heart" class="row-action-icon" style="${isFav ? 'fill:#ff1a40; stroke:#ff1a40;' : ''}"></i>
                    </button>
                    <button class="row-action-btn download-btn btn-track-download" title="Descargar en mi Teléfono">
                        <i data-lucide="arrow-down-to-line" class="row-action-icon"></i>
                    </button>
                </div>
            `;

            row.querySelector('.btn-track-play').addEventListener('click', () => playTrack(track, songs, idx));
            row.querySelector('.btn-track-fav').addEventListener('click', (e) => {
                e.stopPropagation();
                handleTrackFavoriteAction(track, e.currentTarget);
            });
            row.querySelector('.btn-track-download').addEventListener('click', (e) => {
                e.stopPropagation();
                sendDownloadToPhone(track);
            });
            container.appendChild(row);
        });

        artistTabContent.appendChild(container);
    } else if (artistActiveTab === 'albums') {
        if (!albums || albums.length === 0) {
            artistTabContent.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="disc-3" style="width:40px; height:40px; color:var(--text-muted); stroke-width:1.5;"></i>
                    <h3 style="margin-top:12px;">Sin álbumes disponibles</h3>
                    <p>No se encontraron álbumes oficiales de ${artistName} en YouTube Music.</p>
                </div>
            `;
            refreshIcons();
            return;
        }

        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; padding: 10px 0;';

        albums.forEach(alb => {
            const card = document.createElement('div');
            card.style.cssText = 'background:var(--bg-glass-card); border:1px solid var(--border-glass); border-radius:14px; padding:14px; cursor:pointer; transition:all 0.25s cubic-bezier(0.16,1,0.3,1); position:relative; overflow:hidden;';
            card.innerHTML = `
                <div style="position:relative; width:100%; aspect-ratio:1/1; border-radius:10px; overflow:hidden; margin-bottom:12px; background:#0e131f;">
                    <img src="${alb.coverUrl || 'https://via.placeholder.com/180'}" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.src='https://via.placeholder.com/180'">
                    <div class="album-hover-play" style="position:absolute; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.2s;">
                        <div style="width:42px; height:42px; border-radius:50%; background:var(--cyber-cyan); display:flex; align-items:center; justify-content:center; box-shadow:0 0 15px rgba(0,240,255,0.6);">
                            <i data-lucide="play" style="width:20px; height:20px; color:#0A0E17; fill:#0A0E17; margin-left:2px;"></i>
                        </div>
                    </div>
                </div>
                <div style="font-size:13px; font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${alb.title}">${alb.title}</div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">${alb.tracksCount || 'Álbum oficial'}</div>
            `;

            card.addEventListener('mouseenter', () => {
                card.style.borderColor = 'rgba(0, 240, 255, 0.4)';
                card.style.transform = 'translateY(-3px)';
                const playOverlay = card.querySelector('.album-hover-play');
                if (playOverlay) playOverlay.style.opacity = '1';
            });
            card.addEventListener('mouseleave', () => {
                card.style.borderColor = 'var(--border-glass)';
                card.style.transform = 'translateY(0)';
                const playOverlay = card.querySelector('.album-hover-play');
                if (playOverlay) playOverlay.style.opacity = '0';
            });

            card.addEventListener('click', () => {
                openAlbumDetail({ ...alb, artist: artistName }, 'artist');
            });

            grid.appendChild(card);
        });

        artistTabContent.appendChild(grid);
    } else if (artistActiveTab === 'singles') {
        if (!singles || singles.length === 0) {
            artistTabContent.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="disc" style="width:40px; height:40px; color:var(--text-muted); stroke-width:1.5;"></i>
                    <h3 style="margin-top:12px;">Sin singles o EPs</h3>
                    <p>No se encontraron lanzamientos individuales recientes para este artista.</p>
                </div>
            `;
            refreshIcons();
            return;
        }

        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; padding: 10px 0;';

        singles.forEach((single, idx) => {
            const card = document.createElement('div');
            card.style.cssText = 'background:var(--bg-glass-card); border:1px solid var(--border-glass); border-radius:14px; padding:14px; cursor:pointer; transition:all 0.25s cubic-bezier(0.16,1,0.3,1); position:relative; overflow:hidden;';
            card.innerHTML = `
                <div style="position:relative; width:100%; aspect-ratio:1/1; border-radius:10px; overflow:hidden; margin-bottom:12px; background:#0e131f;">
                    <img src="${single.coverUrl || 'https://via.placeholder.com/180'}" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.src='https://via.placeholder.com/180'">
                    <div class="single-hover-play" style="position:absolute; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.2s;">
                        <div style="width:42px; height:42px; border-radius:50%; background:var(--cyber-cyan); display:flex; align-items:center; justify-content:center; box-shadow:0 0 15px rgba(0,240,255,0.6);">
                            <i data-lucide="play" style="width:20px; height:20px; color:#0A0E17; fill:#0A0E17; margin-left:2px;"></i>
                        </div>
                    </div>
                </div>
                <div style="font-size:13px; font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${single.title}">${single.title}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                    <span style="font-size:11px; color:var(--cyber-cyan); font-weight:600;">Single</span>
                    <span style="font-size:11px; color:var(--text-muted);">${single.duration || '3:30'}</span>
                </div>
            `;

            card.addEventListener('mouseenter', () => {
                card.style.borderColor = 'rgba(0, 240, 255, 0.4)';
                card.style.transform = 'translateY(-3px)';
                const playOverlay = card.querySelector('.single-hover-play');
                if (playOverlay) playOverlay.style.opacity = '1';
            });
            card.addEventListener('mouseleave', () => {
                card.style.borderColor = 'var(--border-glass)';
                card.style.transform = 'translateY(0)';
                const playOverlay = card.querySelector('.single-hover-play');
                if (playOverlay) playOverlay.style.opacity = '0';
            });

            card.addEventListener('click', () => {
                playTrack(single, singles, idx);
            });

            grid.appendChild(card);
        });

        artistTabContent.appendChild(grid);
    }

    refreshIcons();
}

function renderAlbums(albums) {
    tracksContainer.innerHTML = '';
    if (!albums || albums.length === 0) {
        tracksContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="disc-3" style="width:44px; height:44px; color:var(--text-muted); stroke-width:1.5;"></i>
                <h3 style="margin-top:12px;">Sin álbumes guardados</h3>
                <p>Los álbumes que guardes en Aura Android aparecerán aquí al sincronizar.</p>
            </div>
        `;
        refreshIcons();
        return;
    }

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; padding: 10px 0;';

    albums.forEach(alb => {
        const card = document.createElement('div');
        card.style.cssText = 'background:var(--bg-glass-card); border:1px solid var(--border-glass); border-radius:14px; padding:14px; cursor:pointer; transition:all 0.2s;';
        card.innerHTML = `
            <img src="${alb.coverUrl || 'https://via.placeholder.com/150'}" style="width:100%; aspect-ratio:1/1; border-radius:10px; object-fit:cover; margin-bottom:10px; display:block;" onerror="this.src='https://via.placeholder.com/150'">
            <div style="font-size:13px; font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${alb.title}</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${alb.year || 'Álbum'}</div>
        `;
        card.addEventListener('mouseenter', () => card.style.borderColor = 'var(--cyber-cyan)');
        card.addEventListener('mouseleave', () => card.style.borderColor = 'var(--border-glass)');
        card.addEventListener('click', () => {
            openAlbumDetail(alb, 'sidebar-albums');
        });
        grid.appendChild(card);
    });

    tracksContainer.appendChild(grid);
    refreshIcons();
}

function renderPlaylists(playlists) {
    tracksContainer.innerHTML = '';
    if (!playlists || playlists.length === 0) {
        tracksContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="list-music" style="width:44px; height:44px; color:var(--text-muted); stroke-width:1.5;"></i>
                <h3 style="margin-top:12px;">${t('noPlaylistsTitle', 'Sin listas de reproducción')}</h3>
                <p>${t('noPlaylistsDesc', 'Tus listas creadas en el teléfono se sincronizan de forma instantánea.')}</p>
            </div>
        `;
        refreshIcons();
        return;
    }

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; padding: 10px 0;';

    playlists.forEach(pl => {
        let count = pl.trackCount || (pl.tracks ? pl.tracks.length : 0);
        let firstTrackCover = pl.tracks && pl.tracks[0] && pl.tracks[0].coverUrl;

        if ((!firstTrackCover || count === 0) && syncData && syncData.songs) {
            const cleanPlTitle = (pl.title || '').toLowerCase().trim();
            const matched = syncData.songs.filter(s => s.playlistId === pl.id || (cleanPlTitle.length > 3 && (s.artist || '').toLowerCase().includes(cleanPlTitle)));
            if (matched.length > 0) {
                if (!firstTrackCover) firstTrackCover = matched[0].coverUrl;
                if (!count) count = matched.length;
            }
        }

        const cover = (pl.coverUrl && !pl.coverUrl.includes('placeholder.com')) ? pl.coverUrl : (firstTrackCover || DEFAULT_PLAYLIST_COVER);

        const card = document.createElement('div');
        card.style.cssText = 'background:var(--bg-glass-card); border:1px solid var(--border-glass); border-radius:14px; padding:14px; cursor:pointer; transition:all 0.2s;';
        card.innerHTML = `
            <img src="${cover}" style="width:100%; aspect-ratio:1/1; border-radius:10px; object-fit:cover; margin-bottom:10px; display:block;" onerror="this.src='${DEFAULT_PLAYLIST_COVER}'">
            <div style="font-size:13px; font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${pl.title}">${pl.title}</div>
            <div style="font-size:11px; font-family:var(--font-mono); color:var(--cyber-cyan); margin-top:2px;">${count} ${t('songsUppercase', 'CANCIONES')}</div>
        `;
        card.addEventListener('mouseenter', () => card.style.borderColor = 'var(--cyber-cyan)');
        card.addEventListener('mouseleave', () => card.style.borderColor = 'var(--border-glass)');
        card.addEventListener('click', () => {
            openPlaylistDetail(pl);
        });
        grid.appendChild(card);
    });

    tracksContainer.appendChild(grid);
    refreshIcons();
}

// ---------------------------------------------------------
// PANTALLA EXPANDIDA DE LETRAS E IMAGEN (SPLIT VIEW)
// ---------------------------------------------------------
function openLyricsView() {
    if (!currentTrack) {
        showToast('Reproduce una canción para ver su letra', 'normal', 'music');
        return;
    }
    isLyricsViewOpen = true;
    lyricsOverlay.classList.add('open');
    const playerBar = document.querySelector('.player-bar');
    if (playerBar) playerBar.style.display = 'none';

    updateLyricsUIForTrack(currentTrack);
    loadLyricsForTrack(currentTrack);
    refreshIcons();
}

function closeLyricsView() {
    isLyricsViewOpen = false;
    lyricsOverlay.classList.remove('open');
    const playerBar = document.querySelector('.player-bar');
    if (playerBar) playerBar.style.display = 'flex';
}

function updateLyricsUIForTrack(track) {
    if (!track) return;
    const cover = track.coverUrl || DEFAULT_TRACK_COVER;
    lyricsGiantCover.src = cover;
    lyricsGiantCover.onerror = () => { lyricsGiantCover.src = DEFAULT_TRACK_COVER; };
    lyricsBackdrop.style.backgroundImage = `url('${cover}')`;
    lyricsTrackTitle.textContent = track.title || 'Canción desconocida';
    lyricsTrackArtist.textContent = track.artist || 'Artista';

    // Sincronizar estado de favorito en el botón de letras
    updatePlayerFavButtonUI();
}

async function loadLyricsForTrack(track) {
    if (!track) return;
    const trackKey = `${track.artist}_${track.title}`;
    if (currentLyricsTrackId === trackKey) return;
    currentLyricsTrackId = trackKey;

    lyricsScrollBox.innerHTML = `
        <div class="lyrics-placeholder-state">
            <i data-lucide="loader-2" class="empty-spinner" style="width:40px; height:40px; color:var(--cyber-cyan); animation: spin 1s linear infinite;"></i>
            <h3 style="margin-top:14px;">Buscando letra oficial...</h3>
            <p style="color:var(--text-muted); font-size:12px;">Consultando catálogo sincronizado para "${track.title}"</p>
        </div>
    `;
    refreshIcons();

    parsedLyrics = [];
    isSyncedLyrics = false;

    try {
        const res = await window.auraApi.getLyrics(track.artist, track.title);
        if (res && res.success) {
            if (res.syncedLyrics) {
                isSyncedLyrics = true;
                parsedLyrics = parseLRC(res.syncedLyrics);
                renderSyncedLyrics(parsedLyrics);
            } else if (res.plainLyrics) {
                // Sincronización dinámica por frases para que brillen y avancen con la canción
                isSyncedLyrics = true;
                const trackDur = (audioElement && !isNaN(audioElement.duration) && audioElement.duration > 15)
                    ? audioElement.duration
                    : (track.durationMs ? track.durationMs / 1000 : 210);
                parsedLyrics = convertPlainLyricsToTimed(res.plainLyrics, trackDur);
                renderSyncedLyrics(parsedLyrics);
            } else {
                currentLyricsTrackId = null;
                renderNoLyrics(track);
            }
        } else {
            currentLyricsTrackId = null;
            renderNoLyrics(track);
        }
    } catch (e) {
        console.error('Error cargando letras:', e);
        currentLyricsTrackId = null;
        renderNoLyrics(track);
    }
    refreshIcons();
}

function convertPlainLyricsToTimed(plainText, totalDurationSec = 210) {
    if (!plainText) return [];
    const rawLines = plainText.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('[Intro') && !l.startsWith('[Verse') && !l.startsWith('[Chorus') && !l.startsWith('[Outro') && !l.startsWith('[Bridge') && !l.startsWith('(Instrumental') && !l.startsWith('[Hook'));

    if (rawLines.length === 0) return [];

    const duration = totalDurationSec > 30 ? totalDurationSec : 210;
    const startSec = 6;
    const endSec = Math.max(duration - 10, startSec + 10);
    const timeStep = (endSec - startSec) / Math.max(rawLines.length, 1);

    return rawLines.map((line, idx) => ({
        time: startSec + (idx * timeStep),
        text: line
    }));
}

function parseLRC(lrcText) {
    const lines = lrcText.split('\n');
    const result = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        let match;
        const matches = [];
        while ((match = timeRegex.exec(line)) !== null) {
            const min = parseInt(match[1], 10);
            const sec = parseInt(match[2], 10);
            const ms = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10);
            matches.push(min * 60 + sec + ms / 1000);
        }

        const text = line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
        if (text) {
            matches.forEach(t => {
                result.push({ time: t, text });
            });
        }
    }

    return result.sort((a, b) => a.time - b.time);
}

function renderSyncedLyrics(lyrics) {
    if (!lyrics || lyrics.length === 0) {
        renderNoLyrics(currentTrack);
        return;
    }

    lyricsScrollBox.innerHTML = '';
    lyrics.forEach((item, index) => {
        const lineEl = document.createElement('div');
        lineEl.className = 'lyrics-line';
        lineEl.id = `lrcLine_${index}`;
        lineEl.dataset.time = item.time;
        lineEl.textContent = item.text;

        lineEl.addEventListener('click', () => {
            audioElement.currentTime = item.time;
        });

        lyricsScrollBox.appendChild(lineEl);
    });
}

function renderPlainLyrics(plainText) {
    lyricsScrollBox.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'lyrics-plain-text';
    container.textContent = plainText;
    lyricsScrollBox.appendChild(container);
}

function renderNoLyrics(track) {
    lyricsScrollBox.innerHTML = `
        <div class="lyrics-placeholder-state">
            <i data-lucide="music" style="width:44px; height:44px; color:var(--text-muted); opacity:0.5;"></i>
            <h3 style="margin-top:12px;">Letras no disponibles</h3>
            <p>No se encontró la transcripción oficial para "${track ? track.title : 'esta canción'}".</p>
        </div>
    `;
    refreshIcons();
}

function syncActiveLyrics(currentTimeSec) {
    if (!isLyricsViewOpen || !isSyncedLyrics || parsedLyrics.length === 0) return;

    let activeIdx = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
        if (parsedLyrics[i].time <= currentTimeSec) {
            activeIdx = i;
        } else {
            break;
        }
    }

    if (activeIdx !== -1) {
        const prevActive = lyricsScrollBox.querySelector('.lyrics-line.active');
        const currActive = document.getElementById(`lrcLine_${activeIdx}`);

        if (currActive && prevActive !== currActive) {
            if (prevActive) prevActive.classList.remove('active');
            currActive.classList.add('active');
            currActive.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// ---------------------------------------------------------
// 4. Reproducción de Audio
// ---------------------------------------------------------
async function playTrack(track, queue, index) {
    if (!track) return;

    currentTrack = track;
    currentQueue = queue || [track];
    currentIndex = index >= 0 ? index : 0;

    // Actualizar UI del Reproductor
    currentTitle.textContent = track.title;
    currentArtist.textContent = track.artist;
    currentCover.src = track.coverUrl || track.thumbnailUrl || 'https://via.placeholder.com/52';
    updatePlayerFavButtonUI();

    // Actualizar vista de letras si está abierta
    if (isLyricsViewOpen) {
        updateLyricsUIForTrack(track);
        loadLyricsForTrack(track);
    } else {
        currentLyricsTrackId = null;
    }

    // MediaSession para controles de sistema (MPRIS en Linux / Windows)
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist,
            album: track.album || 'Aura Music',
            artwork: [{ src: track.coverUrl || 'https://via.placeholder.com/512' }]
        });
    }

    showToast(`Cargando audio: ${track.title}...`, 'normal', 'loader-2');

    // Resaltar fila activa
    document.querySelectorAll('.track-row').forEach(r => r.classList.remove('playing'));
    const rows = document.querySelectorAll('.track-row');
    if (rows[currentIndex]) rows[currentIndex].classList.add('playing');

    // Obtener enlace de streaming directo con yt-dlp
    const res = await window.auraApi.getAudioStream(track.id);
    if (res && res.success && res.streamUrl) {
        audioElement.src = res.streamUrl;
        audioElement.play().then(() => {
            isAudioPlaying = true;
            const pauseIconHtml = '<i data-lucide="pause" class="ctrl-icon play-symbol"></i>';
            btnPlayPause.innerHTML = pauseIconHtml;
            if (lyricsBtnPlayPause) lyricsBtnPlayPause.innerHTML = pauseIconHtml;
            refreshIcons();

            // Pre-extracción en background de la SIGUIENTE canción de la cola para reproducción instantánea (0 ms)
            if (currentQueue && currentQueue.length > currentIndex + 1) {
                const nextTrack = currentQueue[currentIndex + 1];
                if (nextTrack && nextTrack.id && window.auraApi.prefetchAudioStream) {
                    window.auraApi.prefetchAudioStream(nextTrack.id);
                }
            }
        }).catch(err => {
            console.error('[Playback] Error en play():', err);
            const playIconHtml = '<i data-lucide="play" class="ctrl-icon play-symbol"></i>';
            btnPlayPause.innerHTML = playIconHtml;
            if (lyricsBtnPlayPause) lyricsBtnPlayPause.innerHTML = playIconHtml;
            refreshIcons();
            showToast('No se pudo reproducir el stream.', 'normal', 'alert-circle');
        });
    } else {
        const playIconHtml = '<i data-lucide="play" class="ctrl-icon play-symbol"></i>';
        btnPlayPause.innerHTML = playIconHtml;
        if (lyricsBtnPlayPause) lyricsBtnPlayPause.innerHTML = playIconHtml;
        refreshIcons();
        showToast('Error extrayendo el audio de la pista.', 'normal', 'alert-circle');
    }
}

function togglePlayPause() {
    if (!currentTrack) {
        if (currentQueue.length > 0) {
            playTrack(currentQueue[0], currentQueue, 0);
        }
        return;
    }

    const playIconHtml = '<i data-lucide="play" class="ctrl-icon play-symbol"></i>';
    const pauseIconHtml = '<i data-lucide="pause" class="ctrl-icon play-symbol"></i>';

    if (audioElement.paused) {
        audioElement.play();
        isAudioPlaying = true;
        btnPlayPause.innerHTML = pauseIconHtml;
        if (lyricsBtnPlayPause) lyricsBtnPlayPause.innerHTML = pauseIconHtml;
    } else {
        audioElement.pause();
        isAudioPlaying = false;
        btnPlayPause.innerHTML = playIconHtml;
        if (lyricsBtnPlayPause) lyricsBtnPlayPause.innerHTML = playIconHtml;
    }
    refreshIcons();
}

function playNext() {
    if (currentQueue.length === 0) return;
    let nextIdx = currentIndex + 1;
    if (nextIdx >= currentQueue.length) nextIdx = 0;
    playTrack(currentQueue[nextIdx], currentQueue, nextIdx);
}

function playPrev() {
    if (currentQueue.length === 0) return;
    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) prevIdx = currentQueue.length - 1;
    playTrack(currentQueue[prevIdx], currentQueue, prevIdx);
}

// ---------------------------------------------------------
// 5. Comandos Push-to-Phone (FCM)
// ---------------------------------------------------------
async function sendFavoriteToPhone(track, isFavorite = true) {
    if (!track) return;
    if (isFavorite) {
        showToast(`Guardando en favoritos de tu teléfono...`, 'fav', 'heart');
    } else {
        showToast(`Quitando de favoritos de tu teléfono...`, 'normal', 'heart-off');
    }

    const res = await window.auraApi.sendFavoriteToPhone(track, isFavorite);
    if (res && res.success) {
        if (isFavorite) {
            showToast(`¡Guardado en favoritos móvil! (${track.title})`, 'fav', 'heart');
        } else {
            showToast(`Quitado de favoritos móvil (${track.title})`, 'normal', 'check-circle-2');
        }
    } else {
        showToast(`Error sincronizando favorito: ${res?.error || 'Fallo de conexión'}`, 'normal', 'alert-circle');
    }
}

async function sendDownloadToPhone(track) {
    if (!track) return;
    showToast(`Enviado al teléfono: Descargando en segundo plano...`, 'download', 'arrow-down-to-line');

    const res = await window.auraApi.sendDownloadToPhone(track);
    if (res && res.success) {
        showToast(`Descarga iniciada en tu celular: ${track.title}`, 'download', 'check-circle-2');
    } else {
        showToast(`Fallo de descarga remota: ${res.error || 'Revisa el topic'}`, 'normal', 'alert-circle');
    }
}

// ---------------------------------------------------------
// 6. Configuración de Eventos de la UI
// ---------------------------------------------------------
function setupEvents() {
    // Volver desde detalle de artista
    btnBackToArtists.addEventListener('click', () => {
        showStandardView();
        renderCurrentView();
    });

    // Volver desde detalle de álbum o playlist
    btnBackFromAlbum.addEventListener('click', () => {
        albumDetailView.style.display = 'none';
        if (previousViewForAlbum === 'artist' && selectedArtist) {
            artistDetailView.style.display = 'flex';
        } else if (previousViewForAlbum === 'home') {
            showHomeView();
        } else if (previousViewForAlbum === 'sidebar-playlists') {
            showStandardView();
            currentView = 'playlists';
            renderCurrentView();
        } else {
            showStandardView();
            renderCurrentView();
        }
        refreshIcons();
    });

    // Reproducir todo el álbum
    btnAlbumPlayAll.addEventListener('click', () => {
        if (currentAlbumTracksCache && currentAlbumTracksCache.length > 0) {
            playTrack(currentAlbumTracksCache[0], currentAlbumTracksCache, 0);
        }
    });

    // Pestañas del Artista
    document.querySelectorAll('.artist-tab').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
            document.querySelectorAll('.artist-tab').forEach(t => t.classList.remove('active'));
            tabBtn.classList.add('active');
            artistActiveTab = tabBtn.dataset.tab;
            renderArtistTabs();
        });
    });

    btnArtistPlayAll.addEventListener('click', () => {
        if (currentArtistDetailsCache && currentArtistDetailsCache.songs && currentArtistDetailsCache.songs.length > 0) {
            playTrack(currentArtistDetailsCache.songs[0], currentArtistDetailsCache.songs, 0);
        } else {
            const rows = artistTabContent.querySelectorAll('.btn-track-play');
            if (rows.length > 0) rows[0].click();
        }
    });

    btnArtistFollow.addEventListener('click', async () => {
        if (!selectedArtist) return;
        const artistName = (selectedArtist.name || selectedArtist.artist || 'Artista').trim();
        const isFollowing = btnArtistFollow.classList.contains('following');
        const coverSrc = selectedArtist.coverUrl || artistHeroAvatar.src || '';

        if (isFollowing) {
            // Dejar de seguir
            btnArtistFollow.classList.remove('following');
            btnArtistFollow.innerHTML = `<i data-lucide="heart" class="hero-action-icon"></i> <span>SEGUIR</span>`;
            artistHeroListeners.textContent = `Catálogo Oficial • YouTube Music`;
            artistHeroBio.textContent = `Explora los temas más populares y álbumes oficiales de ${artistName} en streaming.`;

            // Remover de syncData.artists
            syncData.artists = (syncData.artists || []).filter(a => {
                const clean = getCleanFollowedArtist(a);
                return clean.name.toLowerCase() !== artistName.toLowerCase() &&
                       (a.id && a.id.toLowerCase() !== artistName.toLowerCase());
            });

            showToast(`Dejaste de seguir a ${artistName}`, 'normal', 'heart');
            await window.auraApi.toggleFollowArtist({ artistName, isFollowing: false });
        } else {
            // Empezar a seguir
            btnArtistFollow.classList.add('following');
            btnArtistFollow.innerHTML = `<i data-lucide="check" class="hero-action-icon"></i> <span>SIGUIENDO</span>`;
            artistHeroListeners.textContent = `Artista en tu biblioteca móvil • Aura Music`;
            artistHeroBio.textContent = `${artistName} está en tu biblioteca de Android. Puedes escuchar sus temas sincronizados o reproducir su discografía completa desde YouTube.`;

            // Agregar a syncData.artists si no está
            const exists = (syncData.artists || []).some(a => {
                const clean = getCleanFollowedArtist(a);
                return clean.name.toLowerCase() === artistName.toLowerCase();
            });
            if (!exists) {
                syncData.artists.push({
                    id: artistName,
                    name: artistName,
                    artist: artistName,
                    coverUrl: coverSrc,
                    role: 'Siguiendo en móvil'
                });
            }

            showToast(`Siguiendo a ${artistName}`, 'fav', 'check');
            await window.auraApi.toggleFollowArtist({ artistName, coverUrl: coverSrc, isFollowing: true });
        }

        // Actualizar contadores en la UI
        if (badgeArtists) badgeArtists.textContent = syncData.artists.length;
        const statArtists = document.getElementById('homeStatArtists');
        if (statArtists) statArtists.textContent = syncData.artists.length;

        // Actualizar la lista de "Artistas que sigues" en Home
        renderHomeView();
        refreshIcons();
    });

    // Cambio de vista en el sidebar
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            filterInput.value = '';
            if (albumDetailView) albumDetailView.style.display = 'none';
            if (artistDetailView) artistDetailView.style.display = 'none';

            if (currentView === 'youtube') {
                showStandardView();
                viewTitle.innerHTML = 'Búsqueda en YouTube <span style="font-size:18px; color:var(--cyber-cyan)">🌐</span>';
                viewSubtitle.textContent = 'Busca cualquier tema en la nube, reprodúcelo o envíalo a tu móvil';
                tracksContainer.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="search" style="width:44px; height:44px; color:var(--text-muted); stroke-width:1.5;"></i>
                        <h3 style="margin-top:12px;">Busca canciones o artistas</h3>
                        <p>Escribe arriba en el buscador para consultar todo el catálogo de YouTube.</p>
                    </div>
                `;
                refreshIcons();
            } else {
                renderCurrentView();
            }
        });
    });

    // Filtro local
    filterInput.addEventListener('input', () => {
        renderCurrentView();
    });

    // Búsqueda global (YouTube) con Autolimpiado
    const searchClearBtn = document.getElementById('searchClearBtn');
    function updateSearchClearUI() {
        if (!searchClearBtn) return;
        if (globalSearchInput.value.length > 0) {
            searchClearBtn.style.display = 'flex';
        } else {
            searchClearBtn.style.display = 'none';
        }
    }

    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            globalSearchInput.value = '';
            updateSearchClearUI();
            clearTimeout(searchDebounceTimer);
            globalSearchInput.focus();
            if (currentView === 'youtube') {
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                const homeNav = document.querySelector('[data-view="home"]');
                if (homeNav) homeNav.classList.add('active');
                currentView = 'home';
                selectedArtist = null;
                if (artistDetailView) artistDetailView.style.display = 'none';
                showHomeView();
            }
        });
    }

    globalSearchInput.addEventListener('input', (e) => {
        updateSearchClearUI();
        const query = e.target.value.trim();
        clearTimeout(searchDebounceTimer);
        if (!query) {
            if (currentView === 'youtube') {
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                const homeNav = document.querySelector('[data-view="home"]');
                if (homeNav) homeNav.classList.add('active');
                currentView = 'home';
                selectedArtist = null;
                if (artistDetailView) artistDetailView.style.display = 'none';
                showHomeView();
            }
            return;
        }

        searchDebounceTimer = setTimeout(async () => {
            currentView = 'youtube';
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelector('[data-view="youtube"]').classList.add('active');

            showStandardView();
            viewTitle.innerHTML = `Resultados para: "${query}"`;
            viewSubtitle.textContent = 'Buscando en YouTube Music...';
            tracksContainer.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="loader-2" class="empty-spinner"></i>
                    <h3 style="margin-top:12px;">Buscando en YouTube...</h3>
                </div>
            `;
            refreshIcons();

            const results = await window.auraApi.searchTracks(query);
            renderTracks(results);
        }, 180);
    });

    // Botón Reproducir Todo
    btnPlayAll.addEventListener('click', () => {
        if (currentQueue.length > 0) {
            playTrack(currentQueue[0], currentQueue, 0);
        }
    });

    // Controles de Audio
    btnPlayPause.addEventListener('click', togglePlayPause);
    btnNext.addEventListener('click', playNext);
    btnPrev.addEventListener('click', playPrev);

    // Barra de Progreso
    audioElement.addEventListener('timeupdate', () => {
        if (!isNaN(audioElement.duration) && audioElement.duration > 0) {
            const percent = (audioElement.currentTime / audioElement.duration) * 100;
            progressBar.value = percent;
            const curStr = formatDuration(audioElement.currentTime * 1000);
            const totStr = formatDuration(audioElement.duration * 1000);
            currentTime.textContent = curStr;
            totalDuration.textContent = totStr;

            if (lyricsProgressBar) lyricsProgressBar.value = percent;
            if (lyricsCurrentTime) lyricsCurrentTime.textContent = curStr;
            if (lyricsTotalDuration) lyricsTotalDuration.textContent = totStr;

            syncActiveLyrics(audioElement.currentTime);
        }
    });

    progressBar.addEventListener('input', (e) => {
        if (!isNaN(audioElement.duration)) {
            const seekTime = (e.target.value / 100) * audioElement.duration;
            audioElement.currentTime = seekTime;
        }
    });

    if (lyricsProgressBar) {
        lyricsProgressBar.addEventListener('input', (e) => {
            if (!isNaN(audioElement.duration)) {
                const seekTime = (e.target.value / 100) * audioElement.duration;
                audioElement.currentTime = seekTime;
            }
        });
    }

    audioElement.addEventListener('ended', playNext);

    // Control de Volumen (si existe)
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            audioElement.volume = e.target.value / 100;
        });
    }

    // Botones Hero Push-to-Phone (Solo Iconos)
    btnPushFavorite.addEventListener('click', () => {
        if (!currentTrack) {
            showToast('Reproduce una canción primero.', 'normal', 'alert-circle');
            return;
        }
        handleTrackFavoriteAction(currentTrack);
    });

    btnPushDownload.addEventListener('click', () => {
        if (currentTrack) sendDownloadToPhone(currentTrack);
        else showToast('Reproduce una canción primero.', 'normal', 'alert-circle');
    });

    // Abrir y cerrar Pantalla Expandida de Letras e Imagen
    if (playerTrackInfo) {
        playerTrackInfo.addEventListener('click', openLyricsView);
    }

    if (btnToggleLyrics) {
        btnToggleLyrics.addEventListener('click', () => {
            if (isLyricsViewOpen) closeLyricsView();
            else openLyricsView();
        });
    }

    if (btnCollapseLyrics) {
        btnCollapseLyrics.addEventListener('click', closeLyricsView);
    }

    if (lyricsBtnPlayPause) lyricsBtnPlayPause.addEventListener('click', togglePlayPause);
    if (lyricsBtnPrev) lyricsBtnPrev.addEventListener('click', playPrev);
    if (lyricsBtnNext) lyricsBtnNext.addEventListener('click', playNext);
    if (lyricsBtnFav) lyricsBtnFav.addEventListener('click', () => {
        if (currentTrack) handleTrackFavoriteAction(currentTrack, lyricsBtnFav);
    });

    // Cerrar vista expandida con tecla Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isLyricsViewOpen) {
            closeLyricsView();
        }
    });

    // Forzar Sincronización Remota
    btnForceSync.addEventListener('click', async () => {
        showToast('Solicitando sincronización completa a tu móvil...', 'download', 'refresh-cw');
        btnForceSync.style.opacity = '0.5';
        const res = await window.auraApi.requestFullSync();
        btnForceSync.style.opacity = '1';
        if (res && res.success) {
            showToast('Solicitud enviada por FCM. Tu teléfono está actualizando Firestore.', 'download', 'check-circle-2');
        } else {
            showToast(escapeHtml(`Error solicitando sincronización: ${(res && res.error) || 'sin respuesta'}`), 'normal', 'alert-circle');
        }
    });

    // Copiar Código de Sync
    btnCopyCode.addEventListener('click', () => {
        if (!syncData.syncCode) return;
        navigator.clipboard.writeText(syncData.syncCode);
        showToast('Código copiado al portapapeles', 'normal', 'copy');
    });

    // Modal de edición de código Sync
    btnEditSync.addEventListener('click', () => {
        syncModal.classList.add('open');
        inputSyncCode.focus();
        refreshIcons();
    });

    btnCloseModal.addEventListener('click', () => syncModal.classList.remove('open'));
    btnCancelModal.addEventListener('click', () => syncModal.classList.remove('open'));

    btnSaveModal.addEventListener('click', async () => {
        const newCode = inputSyncCode.value.trim();
        if (!newCode) {
            showToast('Escribe el código que aparece en tu teléfono.', 'normal', 'alert-circle');
            return;
        }
        try {
            const res = await window.auraApi.setSyncCode(newCode);
            if (!res || !res.ok) {
                showToast(escapeHtml((res && res.error) || 'No se pudo guardar el código.'), 'normal', 'alert-circle');
                return;
            }
            updateSyncCodeUI(res.code);
            syncModal.classList.remove('open');
            if (res.firebaseReady) {
                showToast(`Conectado al código: ${escapeHtml(res.code)}`, 'normal', 'check-circle-2');
            } else {
                showToast(escapeHtml(`Código guardado, pero Firebase no está listo. ${res.error || ''}`), 'normal', 'alert-circle');
            }
        } catch (err) {
            showToast(escapeHtml(`Error al conectar: ${err && err.message ? err.message : err}`), 'normal', 'alert-circle');
        }
    });

    // Panel flotante de dispositivo móvil (Expandir al dar click)
    const btnToggleDevicePanel = document.getElementById('btnToggleDevicePanel');
    const syncFloatingPopover = document.getElementById('syncFloatingPopover');
    const btnCloseDevicePopover = document.getElementById('btnCloseDevicePopover');

    if (btnToggleDevicePanel && syncFloatingPopover) {
        btnToggleDevicePanel.addEventListener('click', (e) => {
            e.stopPropagation();
            syncFloatingPopover.classList.toggle('open');
            refreshIcons();
        });

        if (btnCloseDevicePopover) {
            btnCloseDevicePopover.addEventListener('click', (e) => {
                e.stopPropagation();
                syncFloatingPopover.classList.remove('open');
            });
        }

        document.addEventListener('click', (e) => {
            if (!syncFloatingPopover.contains(e.target) && !btnToggleDevicePanel.contains(e.target)) {
                syncFloatingPopover.classList.remove('open');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                syncFloatingPopover.classList.remove('open');
                const settingsModal = document.getElementById('settingsModal');
                if (settingsModal) settingsModal.classList.remove('open');
            }
            if (e.key === 'F2') {
                const btnOpen = document.getElementById('btnOpenSettings');
                if (btnOpen) btnOpen.click();
            }
        });
    }

    // Inicializar configuración de temas y reproductor
    initThemeAndSettings();
}

// ---------------------------------------------------------
// 6. Configuración, Temas y Preferencias
// ---------------------------------------------------------
function initThemeAndSettings() {
    // 1. Cargar tema guardado
    const savedTheme = localStorage.getItem('aura-theme') || 'dark';
    applyTheme(savedTheme, false);

    // 2. Cargar ajustes del dock del reproductor
    const savedPlayerWidth = localStorage.getItem('aura-player-width') || '680px';
    const savedPlayerOpacity = localStorage.getItem('aura-player-opacity') || '0.88';
    const savedNeonGlow = localStorage.getItem('aura-neon-glow') !== 'false';
    const savedLang = localStorage.getItem('aura-lang') || 'es';

    applyPlayerSettings(savedPlayerWidth, savedPlayerOpacity, savedNeonGlow);

    // 3. Botón de alternar tema rápido en Sidebar
    const btnThemeToggle = document.getElementById('btnThemeToggle');
    if (btnThemeToggle) {
        btnThemeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme') || 'dark';
            const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(nextTheme, true);
            showToast(`Tema cambiado a: ${nextTheme === 'light' ? 'Light Glass' : 'Cyberpunk Neon'}`, 'normal', nextTheme === 'light' ? 'sun' : 'moon');
        });
    }

    // 4. Modal de Configuración
    const btnOpenSettings = document.getElementById('btnOpenSettings');
    const settingsModal = document.getElementById('settingsModal');
    const btnCloseSettingsModal = document.getElementById('btnCloseSettingsModal');
    const btnCloseSettingsFooter = document.getElementById('btnCloseSettingsFooter');
    const btnApplySettingsFooter = document.getElementById('btnApplySettingsFooter');

    function openSettingsModal() {
        if (!settingsModal) return;
        const curTheme = document.body.getAttribute('data-theme') || 'dark';
        document.querySelectorAll('.theme-card').forEach(card => {
            if (card.dataset.themeVal === curTheme) card.classList.add('active');
            else card.classList.remove('active');
        });

        const curWidth = localStorage.getItem('aura-player-width') || '680px';
        const selWidth = document.getElementById('selectPlayerWidth');
        if (selWidth) selWidth.value = curWidth;

        const curOpacity = localStorage.getItem('aura-player-opacity') || '0.88';
        const selOpacity = document.getElementById('selectPlayerOpacity');
        if (selOpacity) selOpacity.value = curOpacity;

        const curGlow = localStorage.getItem('aura-neon-glow') !== 'false';
        const checkGlow = document.getElementById('checkNeonGlow');
        if (checkGlow) checkGlow.checked = curGlow;

        const curLang = localStorage.getItem('aura-lang') || 'es';
        document.querySelectorAll('input[name="langSelection"]').forEach(radio => {
            radio.checked = radio.value === curLang;
            const parent = radio.closest('.language-card');
            if (parent) {
                if (radio.value === curLang) parent.classList.add('active');
                else parent.classList.remove('active');
            }
        });

        const syncCodeDisplay = document.getElementById('settingsCurrentSyncCode');
        if (syncCodeDisplay) syncCodeDisplay.textContent = syncData.syncCode || '---';

        settingsModal.classList.add('open');
        refreshIcons();
    }

    function closeSettingsModal() {
        if (settingsModal) settingsModal.classList.remove('open');
    }

    if (btnOpenSettings) btnOpenSettings.addEventListener('click', openSettingsModal);
    if (btnCloseSettingsModal) btnCloseSettingsModal.addEventListener('click', closeSettingsModal);
    if (btnCloseSettingsFooter) btnCloseSettingsFooter.addEventListener('click', closeSettingsModal);

    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) closeSettingsModal();
        });
    }

    // Tabs del modal
    document.querySelectorAll('.settings-tab-btn').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
            document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.settings-tab-panel').forEach(p => p.classList.remove('active'));

            tabBtn.classList.add('active');
            const targetId = tabBtn.dataset.tab;
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) targetPanel.classList.add('active');
            refreshIcons();
        });
    });

    // Selección de Tema en Cards
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const newTheme = card.dataset.themeVal;
            applyTheme(newTheme, true);
        });
    });

    // Selección de Idioma
    document.querySelectorAll('input[name="langSelection"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.language-card').forEach(c => c.classList.remove('active'));
            const parent = radio.closest('.language-card');
            if (parent) parent.classList.add('active');
            const newLang = e.target.value;
            applyLanguage(newLang);
            showToast(t('toastLangChanged', `Idioma configurado: ${newLang === 'es' ? 'Español' : 'English'}`), 'normal', 'globe');
        });
    });

    // Enlace Repositorio GitHub (David Tineo)
    const btnOpenRepoLink = document.getElementById('btnOpenRepoLink');
    if (btnOpenRepoLink) {
        btnOpenRepoLink.addEventListener('click', () => {
            const url = btnOpenRepoLink.dataset.link || 'https://github.com/respaldoperez348-rgb/AURA-MUSIC-ANDROID';
            window.auraApi.openExternal(url);
            showToast('Abriendo enlace de David Tineo en el navegador...', 'normal', 'external-link');
        });
    }

    // Copiar Sync Code en Settings
    const btnCopySyncCode = document.getElementById('btnCopySyncCode');
    if (btnCopySyncCode) {
        btnCopySyncCode.addEventListener('click', () => {
            if (syncData.syncCode) navigator.clipboard.writeText(syncData.syncCode);
            showToast('Código copiado al portapapeles', 'normal', 'copy');
        });
    }

    // Abrir Modal de Sync desde Settings
    const btnReopenSyncModal = document.getElementById('btnReopenSyncModal');
    if (btnReopenSyncModal) {
        btnReopenSyncModal.addEventListener('click', () => {
            closeSettingsModal();
            syncModal.classList.add('open');
            inputSyncCode.focus();
            refreshIcons();
        });
    }

    // Probar Conexión (Ping a Firebase FCM)
    const btnTestSyncConnection = document.getElementById('btnTestSyncConnection');
    if (btnTestSyncConnection) {
        btnTestSyncConnection.addEventListener('click', async () => {
            showToast('Enviando señal de prueba (Ping) a tu teléfono...', 'download', 'refresh-cw');
            btnTestSyncConnection.style.opacity = '0.5';
            const res = await window.auraApi.requestFullSync();
            btnTestSyncConnection.style.opacity = '1';
            if (res && res.success) {
                showToast('¡Conexión verificada! Tu teléfono respondió correctamente.', 'download', 'check-circle-2');
            } else {
                showToast(escapeHtml(`No se pudo contactar al teléfono: ${(res && res.error) || 'sin respuesta'}`), 'normal', 'alert-circle');
            }
        });
    }

    // Guardar y Aplicar Ajustes
    if (btnApplySettingsFooter) {
        btnApplySettingsFooter.addEventListener('click', () => {
            const selWidth = document.getElementById('selectPlayerWidth');
            const selOpacity = document.getElementById('selectPlayerOpacity');
            const checkGlow = document.getElementById('checkNeonGlow');

            const widthVal = selWidth ? selWidth.value : '680px';
            const opacityVal = selOpacity ? selOpacity.value : '0.88';
            const glowVal = checkGlow ? checkGlow.checked : true;

            localStorage.setItem('aura-player-width', widthVal);
            localStorage.setItem('aura-player-opacity', opacityVal);
            localStorage.setItem('aura-neon-glow', String(glowVal));

            applyPlayerSettings(widthVal, opacityVal, glowVal);
            closeSettingsModal();
            showToast('Configuración guardada y aplicada correctamente', 'download', 'check-circle-2');
        });
    }
}

function applyTheme(theme, save = true) {
    if (save) localStorage.setItem('aura-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);

    const themeToggleIcon = document.getElementById('themeToggleIcon');
    if (themeToggleIcon) {
        if (theme === 'light') {
            themeToggleIcon.setAttribute('data-lucide', 'moon');
        } else {
            themeToggleIcon.setAttribute('data-lucide', 'sun');
        }
    }
    refreshIcons();
}

function applyPlayerSettings(width, opacity, neonGlow) {
    const root = document.documentElement;
    root.style.setProperty('--player-dock-width', width);

    const curTheme = document.body.getAttribute('data-theme') || 'dark';
    if (curTheme === 'light') {
        root.style.setProperty('--player-dock-bg', `rgba(255, 255, 255, ${opacity})`);
    } else if (curTheme === 'oled') {
        root.style.setProperty('--player-dock-bg', `rgba(5, 5, 5, ${opacity})`);
    } else {
        root.style.setProperty('--player-dock-bg', `rgba(12, 17, 27, ${opacity})`);
    }

    if (neonGlow) {
        root.style.setProperty('--player-play-glow', '0 0 20px rgba(0, 240, 255, 0.5)');
    } else {
        root.style.setProperty('--player-play-glow', 'none');
    }
}

// ---------------------------------------------------------
// 7. Utilidades
// ---------------------------------------------------------
function formatDuration(msOrSec) {
    if (!msOrSec) return '0:00';
    let totalSec = typeof msOrSec === 'string' && msOrSec.includes(':') ? null : Math.floor(Number(msOrSec) / 1000);
    if (totalSec === null) return msOrSec;
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function showToast(message, type = 'normal', iconName = 'sparkles') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    toast.innerHTML = `<i data-lucide="${iconName}" style="width:16px; height:16px; stroke-width:2.2; flex-shrink:0;"></i> <span>${message}</span>`;
    container.appendChild(toast);
    refreshIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Arrancar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
