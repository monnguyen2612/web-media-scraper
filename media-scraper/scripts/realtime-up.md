## Realtime dev automation


**Reset Database (Wipe all data):**
If you want to completely clear the database and start fresh (this deletes all volumes):

**macOS / Linux:**
```bash
chmod +x ./scripts/reset-db.sh
./scripts/reset-db.sh
```

**Windows:**
```powershell
.\scripts\reset-db.ps1
```

---

### Windows (PowerShell)
Run from repo root:

```powershell
.\scripts\realtime-up.ps1
```

Options:
- `.\scripts\realtime-up.ps1 -NoBuild`
- `.\scripts\realtime-up.ps1 -NoSmoke`

---

### macOS / Linux (Bash)
Run from repo root:

```bash
chmod +x ./scripts/realtime-up.sh
./scripts/realtime-up.sh
```

Options:
- `./scripts/realtime-up.sh -NoBuild`
- `./scripts/realtime-up.sh -NoSmoke`

