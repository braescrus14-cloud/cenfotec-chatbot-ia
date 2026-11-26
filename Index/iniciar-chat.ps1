$ErrorActionPreference = 'Stop'
$node = Get-Command node -CommandType Application -ErrorAction SilentlyContinue
if (-not $node) {
    throw 'Instala Node.js 22 y vuelve a ejecutar este script.'
}

$port = if ($env:PORT) { $env:PORT } else { '3000' }
if (-not $env:GEMINI_API_KEY) {
    $secureKey = Read-Host 'Ingresa tu clave de Google AI Studio' -AsSecureString
    $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    try {
        $env:GEMINI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer).Trim()
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
        $secureKey.Dispose()
    }
    $temporaryKey = $true
}

try {
    if (-not $env:GEMINI_API_KEY) {
        throw 'Se necesita una clave de Google AI Studio para iniciar el chat.'
    }
    Write-Host "Cuando el servidor indique que esta disponible, abre http://127.0.0.1:$port"
    Write-Host 'Deja esta ventana abierta mientras usas el chat.'
    & $node.Source (Join-Path $PSScriptRoot 'server.mjs')
    if ($LASTEXITCODE -ne 0) {
        throw "El servidor termino con el codigo $LASTEXITCODE."
    }
} finally {
    if ($temporaryKey) {
        Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue
    }
}
