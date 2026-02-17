#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/samzcp99/stubbornstumps.git"
BRANCH="main"
TARGET_DIR="./stubbornstumps"
INSTALL_DEPS="false"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/sync-site.sh [options]

Options:
  --repo <url>      Git repository URL (default: https://github.com/samzcp99/stubbornstumps.git)
  --branch <name>   Branch name (default: main)
  --dir <path>      Target directory (default: ./stubbornstumps)
  --install-deps    Install sync dependencies before update (Debian/Ubuntu)
  -h, --help        Show help

Behavior:
  - If <dir>/.git exists: fetch + pull latest code
  - If <dir> does not exist: clone repository
  - With --install-deps: install missing dependencies first
EOF
}

run_cmd() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

install_dependencies() {
  if command -v apt-get >/dev/null 2>&1; then
    echo "[sync-site] Checking required dependencies..."

    local packages=()

    command -v git >/dev/null 2>&1 || packages+=("git")
    command -v curl >/dev/null 2>&1 || packages+=("curl")
    command -v rsync >/dev/null 2>&1 || packages+=("rsync")

    if [[ ${#packages[@]} -eq 0 ]]; then
      echo "[sync-site] All required dependencies are already installed."
      return 0
    fi

    echo "[sync-site] Installing missing packages: ${packages[*]}"
    run_cmd apt-get update
    run_cmd apt-get install -y "${packages[@]}"
    echo "[sync-site] Dependency installation complete."
    return 0
  fi

  echo "[sync-site] --install-deps is currently supported on Debian/Ubuntu (apt-get)."
  echo "[sync-site] Please install required tools manually: git curl rsync"
  return 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO_URL="${2:-}"
      shift 2
      ;;
    --branch)
      BRANCH="${2:-}"
      shift 2
      ;;
    --dir)
      TARGET_DIR="${2:-}"
      shift 2
      ;;
    --install-deps)
      INSTALL_DEPS="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ "$INSTALL_DEPS" == "true" ]]; then
  install_dependencies
fi

if [[ -d "$TARGET_DIR/.git" ]]; then
  echo "[sync-site] Existing repo found at: $TARGET_DIR"
  git -C "$TARGET_DIR" fetch origin "$BRANCH"
  git -C "$TARGET_DIR" checkout "$BRANCH"
  git -C "$TARGET_DIR" pull --ff-only origin "$BRANCH"
  echo "[sync-site] Update complete."
  exit 0
fi

if [[ -d "$TARGET_DIR" ]] && [[ -n "$(ls -A "$TARGET_DIR" 2>/dev/null || true)" ]]; then
  echo "[sync-site] Target directory exists but is not a git repo: $TARGET_DIR"
  echo "[sync-site] Please use a clean directory or remove it first."
  exit 1
fi

echo "[sync-site] Cloning $REPO_URL ($BRANCH) into $TARGET_DIR"
git clone --branch "$BRANCH" "$REPO_URL" "$TARGET_DIR"
echo "[sync-site] Initial clone complete."
