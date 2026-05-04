#!/usr/bin/env bash
# Renames old --color-* tokens to Jade Mist 02 names
# Run from project root: bash scripts/rename-tokens.sh

SCSS_FILES=$(find src/scss -name "*.scss" \
  ! -name "_theme.scss" \
  ! -name "_themeDark.scss")

for f in $SCSS_FILES; do
  # Order matters: most specific (long names) first

  # ── background alpha series ────────────────────────────────────────────
  sed -i '' 's/var(--color-background-1-alpha90)/var(--surface-a90)/g' "$f"
  sed -i '' 's/var(--color-background-1-alpha70)/var(--surface-a70)/g' "$f"
  sed -i '' 's/var(--color-background-1-alpha50)/var(--surface-a50)/g' "$f"
  sed -i '' 's/var(--color-background-1-alpha80)/var(--surface-a90)/g' "$f"
  sed -i '' 's/var(--color-background-1-alpha40)/var(--surface-a50)/g' "$f"
  sed -i '' 's/var(--color-background-2-alpha50)/var(--sidebar-hover-a50)/g' "$f"
  sed -i '' 's/var(--color-background-2-alpha30)/var(--sidebar-hover-a30)/g' "$f"
  sed -i '' 's/var(--color-background-2-alpha20)/var(--sidebar-hover-a20)/g' "$f"
  sed -i '' 's/var(--color-background-2-alpha10)/rgba(232,238,240,0.1)/g' "$f"
  sed -i '' 's/var(--color-background-1)/var(--surface)/g' "$f"
  sed -i '' 's/var(--color-background-2)/var(--sidebar-hover)/g' "$f"
  sed -i '' 's/var(--color-background)/var(--page-bg)/g' "$f"

  # ── border alpha series ────────────────────────────────────────────────
  sed -i '' 's/var(--color-border-1-alpha50)/var(--divider-a50)/g' "$f"
  sed -i '' 's/var(--color-border-1-alpha40)/var(--divider-a40)/g' "$f"
  sed -i '' 's/var(--color-border-1-alpha30)/var(--divider-a30)/g' "$f"
  sed -i '' 's/var(--color-border-1-alpha20)/var(--divider-a20)/g' "$f"
  sed -i '' 's/var(--color-border-alpha50)/var(--divider-a50)/g' "$f"
  sed -i '' 's/var(--color-border-1)/var(--divider)/g' "$f"
  sed -i '' 's/var(--color-border-strong)/var(--divider)/g' "$f"
  sed -i '' 's/var(--color-border)/var(--divider)/g' "$f"

  # ── text alpha series ──────────────────────────────────────────────────
  sed -i '' 's/var(--color-text-alpha90)/var(--text-a90)/g' "$f"
  sed -i '' 's/var(--color-text-alpha80)/var(--text-a80)/g' "$f"
  sed -i '' 's/var(--color-text-alpha70)/var(--text-a70)/g' "$f"
  sed -i '' 's/var(--color-text-alpha60)/var(--text-a60)/g' "$f"
  sed -i '' 's/var(--color-text-alpha50)/var(--text-muted)/g' "$f"
  sed -i '' 's/var(--color-text-alpha40)/var(--text-faint)/g' "$f"
  sed -i '' 's/var(--color-text-alpha30)/var(--text-faint)/g' "$f"
  sed -i '' 's/var(--color-text-alpha20)/var(--text-a20)/g' "$f"
  sed -i '' 's/var(--color-text-primary)/var(--primary)/g' "$f"
  sed -i '' 's/var(--color-text)/var(--text)/g' "$f"

  # ── main / accent alpha series ─────────────────────────────────────────
  sed -i '' 's/var(--color-main-alpha70)/var(--accent-a70)/g' "$f"
  sed -i '' 's/var(--color-main-alpha40)/var(--accent-a40)/g' "$f"
  sed -i '' 's/var(--color-main-alpha30)/var(--accent-a30)/g' "$f"
  sed -i '' 's/var(--color-main-alpha10)/var(--accent-a10)/g' "$f"
  sed -i '' 's/var(--color-main)/var(--accent)/g' "$f"

  # ── primary series ────────────────────────────────────────────────────
  sed -i '' 's/var(--color-primary-subtle)/var(--accent-soft)/g' "$f"
  sed -i '' 's/var(--color-primary-muted)/var(--accent-soft)/g' "$f"
  sed -i '' 's/var(--color-primary-hover)/var(--primary-hover)/g' "$f"
  sed -i '' 's/var(--color-primary-fg)/var(--primary-fg)/g' "$f"
  sed -i '' 's/var(--color-primary)/var(--primary)/g' "$f"

  # ── accent ────────────────────────────────────────────────────────────
  sed -i '' 's/var(--color-accent-soft)/var(--accent-soft)/g' "$f"
  sed -i '' 's/var(--color-accent)/var(--accent)/g' "$f"

  # ── sidebar ───────────────────────────────────────────────────────────
  sed -i '' 's/var(--color-sidebar-bg)/var(--sidebar-bg)/g' "$f"
  sed -i '' 's/var(--color-sidebar-hover)/var(--sidebar-hover)/g' "$f"
  sed -i '' 's/var(--color-sidebar-active)/var(--sidebar-active)/g' "$f"
  sed -i '' 's/var(--color-sidebar-fg)/var(--sidebar-fg)/g' "$f"
  sed -i '' 's/var(--color-sidebar-muted)/var(--sidebar-muted)/g' "$f"

  # ── wise tokens ───────────────────────────────────────────────────────
  sed -i '' 's/var(--color-wise-dark-green)/var(--primary-hover)/g' "$f"
  sed -i '' 's/var(--color-wise-warm-dark)/var(--text-muted)/g' "$f"
  sed -i '' 's/var(--color-wise-green)/var(--accent)/g' "$f"
  sed -i '' 's/var(--color-wise-black)/var(--text)/g' "$f"
  sed -i '' 's/var(--color-wise-gray)/var(--text-faint)/g' "$f"
  sed -i '' 's/var(--color-wise-surface)/var(--accent-soft)/g' "$f"
  sed -i '' 's/var(--color-wise-mint)/var(--hint)/g' "$f"
  sed -i '' 's/var(--color-wise-card)/var(--surface)/g' "$f"
  sed -i '' 's/var(--color-wise-bg)/var(--page-bg)/g' "$f"
  sed -i '' 's/var(--color-wise-badge-sat-text)/var(--primary)/g' "$f"

  # ── bg shorthand ─────────────────────────────────────────────────────
  sed -i '' 's/var(--color-bg-muted)/var(--sidebar-hover)/g' "$f"
  sed -i '' 's/var(--color-bg-white)/var(--surface)/g' "$f"
  sed -i '' 's/var(--color-bg-subtle)/var(--page-bg)/g' "$f"
  sed -i '' 's/var(--color-bg)/var(--page-bg)/g' "$f"

  # ── semantic ─────────────────────────────────────────────────────────
  sed -i '' 's/var(--color-heading)/var(--primary)/g' "$f"
  sed -i '' 's/var(--color-link-text-active)/var(--primary-hover)/g' "$f"
  sed -i '' 's/var(--color-link-text)/var(--primary)/g' "$f"
  sed -i '' 's/var(--color-hint-text)/var(--hint-text)/g' "$f"
  sed -i '' 's/var(--color-hint)/var(--hint)/g' "$f"
  sed -i '' 's/var(--color-danger)/var(--danger)/g' "$f"
  sed -i '' 's/var(--color-userSay-record)/var(--surface)/g' "$f"

  # ── scrollbar ────────────────────────────────────────────────────────
  sed -i '' 's/var(--color-scrollbar-alpha50)/var(--scrollbar-a50)/g' "$f"
  sed -i '' 's/var(--color-scrollbar)/var(--scrollbar)/g' "$f"

  # ── shadow (used as: rgba(from var(--color-shadow) r g b / X)) ───────
  sed -i '' 's/rgba(from var(--color-shadow) r g b \/ 0\.5)/rgba(var(--shadow),0.5)/g' "$f"
  sed -i '' 's/rgba(from var(--color-shadow) r g b \/ 0\.3)/rgba(var(--shadow),0.3)/g' "$f"
  sed -i '' 's/rgba(from var(--color-shadow) r g b \/ 0\.2)/rgba(var(--shadow),0.2)/g' "$f"
  sed -i '' 's/rgba(from var(--color-shadow) r g b \/ 0\.15)/rgba(var(--shadow),0.15)/g' "$f"
  sed -i '' 's/rgba(from var(--color-shadow) r g b \/ 0\.08)/rgba(var(--shadow),0.08)/g' "$f"
  sed -i '' 's/var(--color-shadow)/rgba(var(--shadow),0.3)/g' "$f"

done

echo "Done."
