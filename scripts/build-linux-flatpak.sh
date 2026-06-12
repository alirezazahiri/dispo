#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="ghcr.io/flathub-infra/flatpak-github-actions:gnome-48"
BUNDLE="${ROOT_DIR}/dispo-x86_64.flatpak"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to reproduce the Flatpak build locally." >&2
  exit 1
fi

echo "Building dispo and Flatpak bundle inside ${IMAGE}..."

docker run --rm --privileged \
  -v "${ROOT_DIR}:/workspace" \
  -w /workspace \
  "${IMAGE}" \
  bash -lc '
    set -euo pipefail

    apt-get update
    apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev pkg-config curl ca-certificates

    if ! command -v go >/dev/null 2>&1; then
      GO_VERSION="$(grep "^go " go.mod | awk "{print \$2}")"
      curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" | tar -C /usr/local -xz
      export PATH="/usr/local/go/bin:${PATH}"
    fi

    if ! command -v node >/dev/null 2>&1; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      apt-get install -y nodejs
    fi

    export PATH="${PATH}:${HOME}/go/bin"
    go install github.com/wailsapp/wails/v2/cmd/wails@v2.12.0

    wails build -tags webkit2_41 -platform linux/amd64

    flatpak-builder --force-clean --repo=.flatpak-repo --install-deps-from=flathub \
      build-dir build/linux/flatpak/io.github.alirezazahiri.dispo.yml

    flatpak build-export .flatpak-repo build-dir
    flatpak build-bundle .flatpak-repo dispo-x86_64.flatpak io.github.alirezazahiri.dispo
  '

echo "Flatpak bundle created at ${BUNDLE}"
echo
echo "Install with:"
echo "  flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo"
echo "  flatpak install --user ${BUNDLE}"
echo "  flatpak run io.github.alirezazahiri.dispo"
