# Knowledge Chunking Precision — Design Spec

**Date:** 2026-06-02
**Status:** Draft

## Background

The knowledge base currently uses category and tags purely for UI management (filtering, display). The AI pipeline (chunking → embedding → indexing) ignores them entirely — chunking is based only on file extension, and embeddings carry no category/tag semantics.

This spec defines a three-layer intervention to make category and tags meaningfully improve AI retrieval precision.

---

## Goals

- Make AI retrieval more accurate across all consumer types (chatbot, search, agent)
- Different categories have significantly different content types — chunking must reflect this
- Design must work as a mock now and swap cleanly to real backend APIs later
- Do not change the user-facing UI for category/tag entry (already fits the model)

## Non-Goals

- Changing the category options or tag input UX
- Building the real backend vector DB, OCR service, or Vision Model API (future work)
- Supporting dynamic category-to-strategy configuration from the UI (may come later)

---

## Architecture: Three-Layer Intervention

### Layer 1 — Category-Aware Chunking

**Rule:** File format decides *how* to split. Category decides *how large* and *what prefix* to add.

The existing file-type logic (`VECTORIZABLE_EXTS` / `NON_VECTORIZABLE_EXTS`) is preserved. A new `getChunkingConfig(category)` function provides per-category parameters:

| 分類 | chunkSize (tokens) | overlap (tokens) | contextPrefix |
|------|--------------------|-------------------|---------------|
| 商品文件 | 200 | 20 | `[商品]` |
| 客服知識 | 300 | 50 | `[客服]` |
| 規則說明 | 500 | 100 | `[規則]` |
| 系統文件 | 400 | 80 | `[系統]` |

**Design contract (mock → real backend):**
```ts
getChunkingConfig(category: string): {
  chunkSize: number
  overlap: number
  contextPrefix: string
}
```

### Layer 2 — Metadata Prefix Injection

Before each chunk is sent to embedding, prepend a structured header:

```
[分類:{category}][標籤:{tag1},{tag2}][來源:{text|image}] {original chunk content}
```

This enriches the embedding vector with category/tag semantics without changing the embedding model. The prefix is stripped before displaying chunk content in the UI.

**Design contract:**
```ts
buildChunkContent(chunk: string, meta: {
  category: string
  tags: string[]
  sourceType: 'text' | 'image'
}): string
```

### Layer 3 — Search-time Metadata Filter

Each chunk is indexed with structured metadata alongside the vector:

```ts
interface ChunkMetadata {
  itemId: string
  category: string
  tags: string[]
  sourceType: 'text' | 'image'
  chunkIndex: number
}
```

Search calls pass category as a filter to narrow the vector search scope:

```ts
vectorSearch(query: string, options?: {
  category?: string
  tags?: string[]
}): ChunkSearchResult[]
```

In the current mock, this filter is applied client-side on the stored chunk metadata array. When the real vector DB is integrated, the filter maps directly to most vector DB metadata filter APIs (Pinecone, Weaviate, Qdrant all support this pattern).

---

## Image Processing

Images (`png`, `jpg`, `gif`, `webp`) require a two-path strategy determined by OCR output volume.

```
Image uploaded
  → ① OCR attempt
      ↓ text ≥ 100 chars          ↓ text < 100 chars
  Path A: Text path           Path B: Vision path
  OCR text → text chunking    Vision Model → description text
  (apply category chunk config)   (single chunk per image)
  ↓                               ↓
  Both paths → Metadata Prefix injection → Embedding → Indexing
```

**Vision Model prompts are category-aware:**

| 分類 | Vision Prompt Focus |
|------|---------------------|
| 商品文件 | 外觀、顏色、材質、尺寸、特徵 |
| 系統文件 | UI 元件、操作步驟、按鈕文字 |
| 規則說明 | 條款文字、章節標題（通常走 OCR 路徑） |
| 客服知識 | 圖示意義、流程說明、狀態標記 |

**Design contracts:**
```ts
processImage(file: File, category: string): Promise<{
  method: 'ocr' | 'vision'
  text: string
}>

getVisionPrompt(category: string): string
```

---

## Implementation Phases

This design is intentionally decoupled so layers can be shipped independently:

**Phase 1 — Category-Aware Chunking** (highest impact, pure frontend)
- Add `getChunkingConfig(category)` to `knowledgeStore.ts`
- Update `generateStructuredContent()` in wizard modal to accept and apply the config
- Image: add `processImage()` stub (returns mock description for now)

**Phase 2 — Metadata Prefix Injection** (low cost, pure frontend)
- Add `buildChunkContent()` utility
- Apply in pipeline chunking step before chunks are stored

**Phase 3 — Search Metadata Filter** (requires backend coordination)
- Extend `ChunkMetadata` interface with category/tags
- Add category/tags to indexing payload
- Implement `vectorSearch()` with filter support (mock: client-side filter; real: vector DB filter API)

---

## Data Flow (After All Phases)

```
User uploads file / enters content
  → item.category + item.versions[].tags carried into pipeline
  ↓
getChunkingConfig(category) → { chunkSize, overlap, contextPrefix }
  ↓
File format determines split method (xlsx → table-row, pdf → paragraph, md → section…)
  ↓ (images: OCR or Vision Model first)
buildChunkContent(chunk, { category, tags, sourceType })
  → "[分類:客服知識][標籤:退款,流程][來源:text] 原始內容..."
  ↓
Embedding (text-embedding-3-large, unchanged)
  ↓
Indexing — store vector + ChunkMetadata { itemId, category, tags, sourceType }
  ↓
Search — vectorSearch(query, { category? }) → filtered results
```

---

## Files to Change

| File | Change |
|------|--------|
| `src/stores/knowledgeStore.ts` | Add `getChunkingConfig()`, extend `ChunkMetadata` interface, add `buildChunkContent()` |
| `src/components/Knowledge/CreateKnowledgeWizardModal.vue` | Update `generateStructuredContent()` to use `getChunkingConfig()` and call `buildChunkContent()` |
| `src/stores/knowledgeStore.ts` | Add `processImage()` stub, `getVisionPrompt()` |
| (future) search service | Implement `vectorSearch()` with metadata filter |

---

## Open Questions

- Token counts in the mock are simulated — real token counting should use `tiktoken` or the API's count endpoint when backend is integrated.
- Vision Model service choice (GPT-4V / Claude Vision) to be decided when backend is built.
- Whether to expose chunk strategy config in the admin UI is deferred.
