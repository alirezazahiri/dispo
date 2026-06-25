#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=lib/linux-build.sh
source "${ROOT_DIR}/scripts/lib/linux-build.sh"

SNAP_DIR="${ROOT_DIR}/build/linux/snap"
STAGE_DIR="${SNAP_DIR}/stage"
RAW_VERSION="${VERSION:-$(git -C "${ROOT_DIR}" describe --tags --always --dirty 2>/dev/null || echo 0.0.0-dev)}"
VERSION="${RAW_VERSION#v}"
VERSION="${VERSION//\//-}"
SNAP="${ROOT_DIR}/dispo_${VERSION}_amd64.snap"

require_command() {
  local cmd="$1"
  local hint="$2"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "${cmd} is required. ${hint}" >&2
    exit 1
  fi
}

ensure_lxd() {
  command -v lxc >/dev/null 2>&1 && lxc list >/dev/null 2>&1
}

patch_gnome_sdk_makefile() {
  local makefile="${SNAP_DIR}/parts/gnome/sdk/src/Makefile"
  if [[ ! -f "${makefile}" ]]; then
    return 0
  fi
  if grep -q '^default:' "${makefile}"; then
    return 0
  fi

  # The GNOME extension Makefile defaults to `install`, which writes to
  # /snap/command-chain when DESTDIR is unset. The make plugin runs a bare
  # `make` before `make install`, so add a no-op default target.
  cat > "${makefile}.patch" <<'EOF'
.PHONY: default
default:
	@:

EOF
  cat "${makefile}" >> "${makefile}.patch"
  mv "${makefile}.patch" "${makefile}"
}

run_snapcraft() {
  cd "${SNAP_DIR}"
  rm -rf parts prime

  if ensure_lxd; then
    snapcraft pack --use-lxd
    return
  fi

  echo "LXD not found; using destructive mode (install LXD for isolated builds)." >&2
  snapcraft pull --destructive-mode
  patch_gnome_sdk_makefile
  snapcraft pack --destructive-mode
}

prepare_stage() {
  rm -rf "${STAGE_DIR}"
  mkdir -p \
    "${STAGE_DIR}/bin" \
    "${STAGE_DIR}/usr/share/applications" \
    "${STAGE_DIR}/usr/share/metainfo" \
    "${STAGE_DIR}/usr/share/icons/hicolor/128x128/apps" \
    "${STAGE_DIR}/usr/share/icons/hicolor/256x256/apps"

  install -Dm755 "${ROOT_DIR}/build/bin/dispo" "${STAGE_DIR}/bin/dispo"
  install -Dm644 "${ROOT_DIR}/build/linux/flatpak/io.github.alirezazahiri.dispo.desktop" \
    "${STAGE_DIR}/usr/share/applications/io.github.alirezazahiri.dispo.desktop"
  install -Dm644 "${ROOT_DIR}/build/linux/flatpak/io.github.alirezazahiri.dispo.metainfo.xml" \
    "${STAGE_DIR}/usr/share/metainfo/io.github.alirezazahiri.dispo.metainfo.xml"
  install -Dm644 "${ROOT_DIR}/build/linux/flatpak/icons/128x128.png" \
    "${STAGE_DIR}/usr/share/icons/hicolor/128x128/apps/io.github.alirezazahiri.dispo.png"
  install -Dm644 "${ROOT_DIR}/build/linux/flatpak/icons/256x256.png" \
    "${STAGE_DIR}/usr/share/icons/hicolor/256x256/apps/io.github.alirezazahiri.dispo.png"
}

echo "Building dispo Snap package (${VERSION})..."

require_command snapcraft "Install with: sudo snap install snapcraft --classic"
linux_build_ensure_go "${ROOT_DIR}"
linux_build_ensure_node
linux_build_ensure_deps
linux_build_ensure_icons "${ROOT_DIR}"
linux_build_ensure_wails

cd "${ROOT_DIR}"
wails build -tags webkit2_41 -platform linux/amd64
prepare_stage

SNAPCRAFT_YAML="${SNAP_DIR}/snapcraft.yaml"
SNAPCRAFT_BACKUP="${SNAP_DIR}/.snapcraft.yaml.bak"
cp "${SNAPCRAFT_YAML}" "${SNAPCRAFT_BACKUP}"
trap 'mv -f "${SNAPCRAFT_BACKUP}" "${SNAPCRAFT_YAML}"; rm -rf "${STAGE_DIR}"' EXIT

sed -i "s/^version: .*/version: \"${VERSION}\"/" "${SNAPCRAFT_YAML}"

run_snapcraft

BUILT_SNAP="$(find "${SNAP_DIR}" -maxdepth 1 -name 'dispo_*.snap' -type f | head -n 1)"
if [[ -z "${BUILT_SNAP}" ]]; then
  echo "snapcraft did not produce a .snap artifact." >&2
  exit 1
fi

mv -f "${BUILT_SNAP}" "${SNAP}"

echo "Snap package created at ${SNAP}"
echo
echo "Install with:"
echo "  sudo snap install --dangerous ${SNAP}"
echo
echo "Run with:"
echo "  dispo"
