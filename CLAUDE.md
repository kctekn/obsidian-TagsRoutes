# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Obsidian plugin called "Tags Routes" that visualizes files and tags as 3D graph nodes using `3d-force-graph` and `three.js`. The plugin displays relationships between files, file-tag connections, and inter-tag connections in an interactive 3D force-directed graph.

## Building and Development

### Commands

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Production build
npm run build
```

The build process:
1. TypeScript compilation with `tsc`
2. Bundling with esbuild (configured in `esbuild.config.mjs`)
3. Output goes to `main.js`

There are no lint or test scripts defined in `package.json`.

## Architecture

### Entry Point

**`src/main.ts`** - Core plugin class `TagsRoutes extends Plugin`
- Registers the custom view (`TagRoutesView`)
- Registers settings tab
- Handles ribbon icon, file-open events, and tag click events
- Manages settings (load/save) with deep merge for backward compatibility

### Views

**`src/views/TagsRoutes.ts`** - The main 3D graph view (`TagRoutesView extends ItemView`)
- Uses `ForceGraph3D` for the interactive 3D visualization
- Implements `three-forcegraph` for node/link rendering
- Manages graph data (nodes/links), filters, and controls
- Handles interactions: node clicking, hovering, highlighting, selection box
- Supports visual styles (dark/light themes) with bloom post-processing
- Controls include sliders for link distance, node size/repulsion, bloom strength, etc.

**`src/views/settings.ts`** - `TagsroutesSettingsTab`
- Plugin configuration UI using Obsidian's `PluginSettingTab`
- Theme selection (dark/light) with 6 color slots per theme
- Color picker groups for node types (markdown, tag, pdf, etc.) and states (highlight, focus)
- Path filter configuration with positive and negative filters using glob patterns

### Utilities

**`src/util/util.ts`** - Core utilities
- `DebugMsg()` / `DebugLevel` enum - Debug logging system
- `getTags()`, `getAllLinks()` - Parse Obsidian metadata cache
- `getFileType()` - Classify files as markdown, tag, attachment, broken, pdf, excalidraw, screenshot
- `parseTagHierarchy()` - Split tags like `#foo/bar/baz` into hierarchy
- `PathFilter` class - Encodes/decodes filter patterns, validates glob patterns
- `namedColor` - Map of CSS named colors to hex values

**`src/util/query.ts`** - Dataview template for tag reports

**`src/util/CodeBlockProcessor.ts`** - Processes custom `tagsroutes` code blocks in notes
- `tagProcessor()` - Finds notes containing a specific tag
- `timeDurationProcessor()` - Finds notes with tags within a time duration (`#1day`, `#30day`)
- `frontmatterTagProcessor()` - Finds notes with specific frontmatter tags
- Generates tag report content with timestamps and paragraph anchors

### Data Flow

1. **Initialization**: `onload()` in `main.ts` → `initializePlugin()`
   - Loads settings from `loadData()`
   - Registers view, code block processor, and event handlers
   - Sets up metadataCache listener (waits for index to be ready)

2. **Graph Construction** (in `TagsRoutes.ts`):
   - Collect files via `vault.getMarkdownFiles()`
   - Parse metadata cache for tags and links per file
   - Build graph data: nodes (files + tags), links (relationships)
   - Apply path filters (showingFilter/hidingFilter)

3. **User Interactions**:
   - Click file node → Opens file in editor, focuses node in graph
   - Click Obsidian tag → Calls `focusGraphTag()` to center on tag node
   - Click tag node → Generates query report (if enabled)
   - Controls modify graph parameters (`nodeSize`, `linkDistance`, etc.)

## Key Design Patterns

### Theme and Slot System
- Two visual styles (`darkStyle` / `lightStyle`) implementing the `VisualStyle` interface
- 6 theme slots per theme, each storing complete `TagRoutesSettings`
- ColorMap is a nested object defining colors by type (markdown, tag, pdf, etc.)
- Slot saving allows persisting custom color configurations

### Path Filtering
- Positive filter: paths matching glob patterns are shown (`*` for all)
- Negative filter: paths matching patterns are hidden
- Patterns are base64 URL-safe encoded in settings for storage
- Glob support: `*`, `?` wildcards converted to regex

### Tag Hierarchy
- Tags like `#foo/bar/baz` create a hierarchy of nodes
- Each level in hierarchy (`#foo`, `#foo/bar`, `#foo/bar/baz`) is a separate node
- Links connect parent to child tags automatically

## File Types in Graph

The plugin tracks these node types:
- **markdown**: Regular `.md` files
- **excalidraw**: Excalidraw drawing files
- **pdf**: PDF documents
- **attachment**: Files in attachments folder
- **screenshot**: Graph screenshots (`graph-screenshot-*`)
- **broken**: Unresolved links (files that are linked but don't exist)
- **tag**: All tag nodes
- **frontmatter_tag**: Tags from YAML frontmatter

## Plugin Settings Storage

Settings are stored via `saveData()` in Obsidian's `data.json`:
- `saveSpecVer`: Version number for schema compatibility (currently `10203`)
- `dark` / `light`: 6 slots each containing `TagRoutesSettings`
- `showingFilter` / `hidingFilter`: Encoded path filters
- `themeSlotNum`: Currently active slot per theme

## Known Issues & Notes

- Bug in v1.2.2 (LMB/RMB drag no effect) was caused by Obsidian v1.7.x changes
- Paragraph linker generates random anchors (`^tr-[a-z0-9]+`) for precise backlinking
- Tag reports avoid circular processing by skipping files with `tag-report` frontmatter
