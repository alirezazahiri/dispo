#!/usr/bin/env bash

linux_build_setup_path() {
  export PATH="${HOME}/.local/go/bin:${HOME}/go/bin:/snap/bin:${PATH}"
}

linux_build_ensure_go() {
  local root_dir="$1"
  linux_build_setup_path
  if command -v go >/dev/null 2>&1; then
    return 0
  fi

  if ! command -v curl >/dev/null 2>&1; then
    echo "curl is required to download Go." >&2
    echo "Install with: sudo apt install curl" >&2
    return 1
  fi

  local go_version
  go_version="$(grep '^go ' "${root_dir}/go.mod" | awk '{print $2}')"
  echo "Go not found. Installing Go ${go_version} to ${HOME}/.local/go..."
  mkdir -p "${HOME}/.local"
  curl -fsSL "https://go.dev/dl/go${go_version}.linux-amd64.tar.gz" | tar -C "${HOME}/.local" -xzf -
  linux_build_setup_path

  if ! command -v go >/dev/null 2>&1; then
    echo "Go installation failed." >&2
    return 1
  fi
}

linux_build_ensure_node() {
  linux_build_setup_path
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    return 0
  fi

  echo "Node.js 20+ and npm are required." >&2
  echo "Install with one of:" >&2
  echo "  sudo snap install node --classic --channel=20" >&2
  echo "  https://nodejs.org/" >&2
  return 1
}

linux_build_ensure_deps() {
  if ! pkg-config --exists gtk+-3.0 2>/dev/null || ! pkg-config --exists webkit2gtk-4.1 2>/dev/null; then
    echo "Linux build dependencies are missing." >&2
    echo "Install on Ubuntu 24.04+ / Debian 12+ with:" >&2
    echo "  sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev pkg-config build-essential curl" >&2
    return 1
  fi
}

linux_build_ensure_icons() {
  local root_dir="$1"
  local icons_dir="${root_dir}/build/linux/flatpak/icons"
  local appicon="${root_dir}/build/appicon.png"

  if [[ ! -f "${appicon}" ]]; then
    echo "build/appicon.png is required to generate Linux icons." >&2
    return 1
  fi

  mkdir -p "${icons_dir}"
  if [[ ! -f "${icons_dir}/128x128.png" ]] || [[ ! -f "${icons_dir}/256x256.png" ]]; then
    if ! command -v convert >/dev/null 2>&1; then
      echo "ImageMagick (convert) is required to generate icon sizes." >&2
      return 1
    fi
    convert "${appicon}" -resize 128x128 "${icons_dir}/128x128.png"
    convert "${appicon}" -resize 256x256 "${icons_dir}/256x256.png"
  fi
}

linux_build_ensure_wails() {
  linux_build_setup_path
  if ! command -v wails >/dev/null 2>&1; then
    echo "Installing Wails CLI..."
    go install github.com/wailsapp/wails/v2/cmd/wails@v2.12.0
  fi
}
