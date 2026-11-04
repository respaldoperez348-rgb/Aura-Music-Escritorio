// Descarga yt-dlp.exe a ./bin antes de empaquetar para Windows, así el instalador
// incluye el extractor de audio y no depende de que el usuario lo tenga en el PATH.
// Si la descarga falla NO rompe el build: la app usa ytdl-core como respaldo.
const fs = require('fs');
const path = require('path');
const https = require('https');

const binDir = path.join(__dirname, '..', 'bin');
fs.mkdirSync(binDir, { recursive: true });
const dest = path.join(binDir, 'yt-dlp.exe');
const SOURCE = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';

if (fs.existsSync(dest) && fs.statSync(dest).size > 1000000) {
    console.log('[fetch-ytdlp] yt-dlp.exe ya existe, se omite la descarga.');
    process.exit(0);
}

function download(url, redirects = 0) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'aura-music-build' } }, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                res.resume();
                if (redirects > 5) return reject(new Error('demasiadas redirecciones'));
                return resolve(download(new URL(res.headers.location, url).toString(), redirects + 1));
            }
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error('HTTP ' + res.statusCode));
            }
            const tmp = dest + '.part';
            const out = fs.createWriteStream(tmp);
            res.pipe(out);
            out.on('finish', () => out.close(() => {
                fs.renameSync(tmp, dest);
                resolve();
            }));
            out.on('error', reject);
            res.on('error', reject);
        }).on('error', reject);
    });
}

download(SOURCE)
    .then(() => console.log('[fetch-ytdlp] yt-dlp.exe descargado en ./bin'))
    .catch((err) => {
        console.warn('[fetch-ytdlp] No se pudo descargar yt-dlp.exe (' + err.message + '). Se usará ytdl-core como respaldo.');
        if (!fs.existsSync(dest)) {
            try { fs.writeFileSync(dest, ''); } catch (e) {}
        }
    })
    .then(() => {
        if (!fs.existsSync(dest)) {
            try { fs.writeFileSync(dest, ''); } catch (e) {}
        }
        process.exit(0);
    });
