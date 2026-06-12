# dispo

Desktop API client for HTTP, SSE, and WebSocket requests.

## About

dispo is built with [Wails v2](https://wails.io/) (Go backend, React frontend). Configure the project in [`wails.json`](wails.json).

## Installing

Download the build for your platform from [GitHub Releases](https://github.com/alirezazahiri/dispo/releases).

### Linux (Flatpak, recommended)

Flatpak installs the app together with its GTK/WebKitGTK runtime, so you do not need to install `libwebkit2gtk` manually.

```bash
# one-time: enable the Flathub runtime source
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo

# install from a release asset
flatpak install --user ./dispo-x86_64.flatpak

# run
flatpak run io.github.alirezazahiri.dispo
```

### Windows

Download and run the NSIS installer (`*-installer.exe`) from the release page. WebView2 is installed automatically when needed.

### macOS

Download `dispo-macos-universal.zip`, extract it, and open `dispo.app`.

### Linux (raw binary, advanced)

If you run the raw Linux binary from `build/bin/dispo` instead of the Flatpak, you must install the matching WebKitGTK runtime yourself. On Ubuntu 24.04+ and Debian 12+:

```bash
sudo apt install libwebkit2gtk-4.1-0 libgtk-3-0
./dispo
```

Build with the WebKit 4.1 tag to match those distros:

```bash
wails build -tags webkit2_41 -platform linux/amd64
```

## Live Development

Run `wails dev` in the project directory for hot reload of frontend changes.

To develop in a browser with access to Go methods, use the dev server at http://localhost:34115.

## Building

Production builds:

```bash
# Linux Flatpak bundle (requires Docker)
./scripts/build-linux-flatpak.sh

# Windows installer
wails build -platform windows/amd64 -nsis

# macOS app
wails build -platform darwin/universal

# Linux binary only
wails build -tags webkit2_41 -platform linux/amd64
```

Tagged releases (`v*`) are built and published automatically by [`.github/workflows/release.yml`](.github/workflows/release.yml).

## Linux packaging files

Flatpak metadata lives under [`build/linux/flatpak/`](build/linux/flatpak/).
