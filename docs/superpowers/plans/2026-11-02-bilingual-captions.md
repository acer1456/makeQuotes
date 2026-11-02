# Bilingual Captions Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task.

**Goal:** Add four caption language modes and selectable fonts defaulting to 思源黑體.

**Architecture:** Preserve Chinese in the existing text field; add English and subtitle styling to each quote. Migrate version 1 projects into version 2 without changing their visible content. Share the measured quote layout between preview and export.

**Tech Stack:** React, TypeScript, Canvas, Vite; no new dependencies.

**Spec:** `docs/bilingual-captions-design.md`.

## Global Constraints

- Two language fields per quote; main 56 px, subtitle 34 px, gap 26 px, default sans.
- Preserve old projects, user font choices and text when switching modes.
- Keep 1080 × 1350 output and GitHub Pages base paths.

## Review Focus

- Old drafts with small fonts or custom positions preserve their appearance.
- Long English words and CJK punctuation wrap without text clipping.
- Missing English remains editable and produces a visible reminder.
- Mode and font switches retain both languages and subordinate type size.
- AI output missing one translation is rejected without overwriting the project.

### Task 1: Data and measured layout

- [x] Add failing tests for language selection, project migration, bilingual validation and English wrapping.
- [x] Extend `src/model.ts` and create `src/text-layout.ts`; update Canvas rendering.
- [x] Verify with `npm test` and type checking.

### Task 2: Editor and AI

- [x] Update `Inspector`, sample captions, `AIStudio`, AI schema and project creation.
- [x] Verify all four modes, independent font controls, size constraints, reload, import, and AI mocked responses in the browser.

### Task 3: Publication

- [x] Review changes; run full tests, production build, desktop/mobile and PNG/ZIP checks.
- [ ] Commit, merge into main, push and verify GitHub Pages deployment and live behavior.

## Review record

Independent review identified near-edge bilingual group overlap and a legacy footer font change. Regression tests reproduced both; separate text bands and the original fixed footer font resolve them. A consecutive CJK punctuation wrapping defect was also fixed because it affects ordinary Chinese captions. All 16 unit tests and the full desktop/mobile browser flow passed after the fixes. No review findings remain deferred.
