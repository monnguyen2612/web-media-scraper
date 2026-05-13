#!/usr/bin/env bash
set -e

# Colors for output
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set working directory to repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

printf "${RED}WARNING: This will permanently delete all database and redis data!${NC}\n"
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    printf "Operation cancelled.\n"
    exit 1
fi

printf "${CYAN}==> Stopping services and removing volumes...${NC}\n"
docker compose down -v

printf "${CYAN}==> Database and volumes removed successfully.${NC}\n"
printf "Run './scripts/realtime-up.sh' to start fresh.\n"
