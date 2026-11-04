// Arranque multiplataforma (Windows, Linux, macOS).
// Antes: "unset ELECTRON_RUN_AS_NODE && electron ." -> "unset" no existe en Windows (cmd/PowerShell).
const { spawn } = require('child_process');
const electronPath = require('electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, ['.'], { stdio: 'inherit', env });
child.on('close', (code) => process.exit(code === null ? 0 : code));
child.on('error', (err) => {
    console.error('[start] No se pudo iniciar Electron:', err.message);
    process.exit(1);
});
