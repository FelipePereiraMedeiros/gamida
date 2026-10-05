param (
    [int]$Port = 8080
)

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $rootDir) { $rootDir = Get-Location }

$listener = $null
$started = $false
$currentPort = $Port

for ($attempt = 0; $attempt -lt 5; $attempt++) {
    $listener = New-Object System.Net.HttpListener
    $prefix = "http://localhost:$currentPort/"
    $listener.Prefixes.Add($prefix)

    try {
        $listener.Start()
        $started = $true
        $Port = $currentPort
        break
    } catch {
        $listener.Close()
        $currentPort++
    }
}

if (-not $started) {
    Write-Error "Não foi possível iniciar o servidor HTTP nas portas entre $Port e $($currentPort - 1)."
    exit 1
}

Write-Host "========================================================="
Write-Host " Servidor Local Gamida iniciado com sucesso!" -ForegroundColor Green
Write-Host " URL Principal:       http://localhost:$Port/" -ForegroundColor Cyan
Write-Host " Ambiente de Testes:  http://localhost:$Port/test-environment.html" -ForegroundColor Yellow
Write-Host " Pressione Ctrl+C para encerrar o servidor."
Write-Host "========================================================="

$mimeTypes = @{
    ".html"  = "text/html; charset=utf-8"
    ".htm"   = "text/html; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".js"    = "application/javascript; charset=utf-8"
    ".json"  = "application/json; charset=utf-8"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".svg"   = "image/svg+xml"
    ".ico"   = "image/x-icon"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf"   = "font/ttf"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $request = $context.Request
            $response = $context.Response

            $urlPath = $request.Url.LocalPath
            if ($urlPath -eq "/" -or $urlPath -eq "") {
                $urlPath = "/index.html"
            }

            # Decodifica URL e normaliza caminho para Windows
            $relPath = [System.Uri]::UnescapeDataString($urlPath.TrimStart('/'))
            $relPath = $relPath -replace '/', '\'
            
            $normalizedRoot = [System.IO.Path]::GetFullPath($rootDir).TrimEnd('\', '/') + '\'
            $fullPath = [System.IO.Path]::GetFullPath((Join-Path $rootDir $relPath))

            if ($fullPath.StartsWith($normalizedRoot, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path $fullPath -PathType Leaf)) {
                $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
                $contentType = $mimeTypes[$ext]
                if (-not $contentType) { $contentType = "application/octet-stream" }
                $response.ContentType = $contentType
                $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")

                $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $safeRelPath = [System.Security.SecurityElement]::Escape($relPath)
                $notFoundHtml = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>404</title></head><body><h1>404 - Arquivo Não Encontrado</h1><p>$safeRelPath</p></body></html>"
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($notFoundHtml)
                $response.ContentType = "text/html; charset=utf-8"
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }

            $response.OutputStream.Close()
        } catch {
            # Ignora erros de desconexão de cliente para manter o servidor ativo
            try { $context.Response.OutputStream.Close() } catch {}
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
