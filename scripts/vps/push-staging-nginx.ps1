param(
  [Parameter(Mandatory = $false)]
  [string]$HostIp = "46.224.207.157",

  [Parameter(Mandatory = $false)]
  [string]$User = "root",

  [Parameter(Mandatory = $false)]
  [string]$KeyPath = "$env:USERPROFILE\.ssh\id_ed25519"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$localConf = Join-Path $scriptDir "limoneo-staging.nginx.conf"

if (-not (Test-Path $localConf)) {
  throw "No se encontró el archivo: $localConf"
}

$remoteTmp = "/tmp/limoneo-staging.nginx.conf"
$remoteTarget = "/etc/nginx/sites-available/limoneo-staging"
$remoteLink = "/etc/nginx/sites-enabled/limoneo-staging"

$sshCommonArgs = @(
  "-i", $KeyPath,
  "-o", "IdentitiesOnly=yes",
  "-o", "ServerAliveInterval=15",
  "-o", "ServerAliveCountMax=3",
  "-o", "ConnectTimeout=10",
  "-o", "StrictHostKeyChecking=accept-new"
)

Write-Host "Subiendo vhost staging a $User@$HostIp..."
scp $sshCommonArgs $localConf "${User}@${HostIp}:${remoteTmp}"

if ($LASTEXITCODE -ne 0) {
  throw "scp falló (exit code: $LASTEXITCODE)"
}

Write-Host "Instalando vhost + validando nginx..."
$remoteCmd = "set -eu; sudo mv ${remoteTmp} ${remoteTarget}; sudo rm -f /etc/nginx/sites-enabled/limoneo-staging*; sudo ln -sf ${remoteTarget} ${remoteLink}; sudo nginx -t; sudo systemctl reload nginx; echo '== verify (no DNS required) =='; curl -sS -I -H 'Host: staging.limoneo.com' http://127.0.0.1/ | head -n 12"
ssh $sshCommonArgs "${User}@${HostIp}" $remoteCmd

if ($LASTEXITCODE -ne 0) {
  throw "ssh falló (exit code: $LASTEXITCODE)"
}

Write-Host "OK. Si aún no hay DNS, el curl anterior es la prueba real."