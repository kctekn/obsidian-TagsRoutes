# Popularity Hub Nodes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create shared hub nodes that group files by wikilink popularity, with auto-calculated tiers and configurable colors.

**Architecture:** Add a new `linkhub` node type. During `buildGdata()`, count inbound wikilinks per file, assign percentile-based tiers (High/Moderate/Low), create shared hub nodes, and link files to their tier hub. Controlled via a settings toggle.

**Tech Stack:** TypeScript, Obsidian API, three.js (3D rendering), 3d-force-graph (force-directed layout)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/main.ts` | Modify | Add `enableLinkHubs` to Settings interface, DEFAULT_SETTINGS, and settings toggle UI |
| `src/main.ts` | Modify | Add `linkhubColor` to `colorMap` interface and defaults |
| `src/views/TagsRoutes.ts` | Modify | Add `linkhub` to `nodeTypes` type union |
| `src/views/TagsRoutes.ts` | Modify | Add hub tier calculation and node/link creation in `buildGdata()` |
| `src/views/TagsRoutes.ts` | Modify | Handle `linkhub` in `getNodeColorByType` and `getNodeColorByTypeTE` |
| `src/views/TagsRoutes.ts` | Modify | Handle `linkhub` in `createNodeThreeObject` and `createNodeThreeObjectLight` (distinct shape/label) |

No new files. All changes extend existing patterns.

---

### Task 1: Add `linkhub` Settings Toggle and Color Configuration

**Files:**
- Modify: `src/main.ts` (lines 34-92, 96-134, 136-174, 176-210, and settings UI around line 590)

- [ ] **Step 1.1: Add `enableLinkHubs` to Settings interface**

In `src/main.ts`, add the new field to the `Settings` interface (around line 133, before `dark:`):

```typescript
enableLinkHubs: boolean;
```

- [ ] **Step 1.2: Add default value to DEFAULT_SETTINGS**

In `src/main.ts`, add to the DEFAULT_SETTINGS object (around line 188, after `enableParagraphLinker: true,`):

```typescript
enableLinkHubs: true,
```

- [ ] **Step 1.3: Add `linkhub` to colorMap interface and defaults**

In `src/main.ts`, add `linkhub` to the `colorMap` interface (around line 54, after `backgroundColor: colorSpec;`):

```typescript
linkhub: colorSpec;
```

Add default values to `defaultolorMapDark` (around line 72, before `};`):

```typescript
linkhub: {name:"default", value:"#ff8800"}
```

Add default values to `defaultolorMapLight` (around line 90, before `};`):

```typescript
linkhub: {name:"default", value:"#ff8800"}
```

- [ ] **Step 1.4: Add settings UI toggle**

In `src/main.ts`, inside `TagsroutesSettingsTab.display()`, add a new toggle after the "Open graph in current tab" setting (around line 602, right after the `openInCurrentTab` setting block closes):

```typescript
new Setting(containerEl)
    .setName('Show popularity hub nodes')
    .setDesc('Display shared hub nodes grouping files by wikilink popularity (highly linked, moderate, low).')
    .addToggle((toggle: ToggleComponent) => {
        toggle
        .onChange(async (value) => {
            this.plugin.settings.enableLinkHubs = value;
            await this.plugin.saveSettings();
        })
        .setValue(this.plugin.settings.enableLinkHubs)
    })
```

- [ ] **Step 1.5: Build to verify no type errors**

Run: `npm run build`
Expected: SUCCESS (no compilation errors)

---

### Task 2: Add `linkhub` to `nodeTypes` Type Union

**Files:**
- Modify: `src/views/TagsRoutes.ts` (line 33)

- [ ] **Step 2.1: Update nodeTypes type**

In `src/views/TagsRoutes.ts` line 33, change:

```typescript
export type nodeTypes = 'markdown' | 'tag' | 'attachment' | 'broken' | 'pdf' | 'excalidraw' |'screenshot'| 'other' | 'frontmatter_tag';
```

To:

```typescript
export type nodeTypes = 'markdown' | 'tag' | 'attachment' | 'broken' | 'pdf' | 'excalidraw' |'screenshot'| 'other' | 'frontmatter_tag' | 'linkhub';
```

- [ ] **Step 2.2: Build to verify**

Run: `npm run build`
Expected: SUCCESS

---

### Task 3: Build Hub Nodes in `buildGdata()`

**Files:**
- Modify: `src/views/TagsRoutes.ts` (lines 2151-2421, specifically the `buildGdata()` method)

Key context: `buildGdata()` builds the graph data. It first processes file-to-file links (L2181-2194), then tags (L2203-2329), then filters and finalizes. Hub nodes should be added AFTER file links are counted but BEFORE the neighbor cross-linking (L2397).

The inbound link count for each file comes from `resolvedLinks` — for each `targetPath` in `resolvedLinks`, increment a counter.

- [ ] **Step 3.1: Add hub tier calculation**

In `buildGdata()`, add the following code block **between line 2196** (`FileLinkNum = links.length;`) and **line 2197** (`this.debugLogToFileM...`), right after file nodes and links are created:

```typescript
        /*
          Calculate link popularity tiers and create hub nodes
         */
        const inboundCount: Map<string, number> = new Map();
        // Count how many times each file is linked to
        const resolvedLinksObj = this.app.metadataCache.resolvedLinks;
        for (const sourcePath in resolvedLinksObj) {
            const targets = resolvedLinksObj[sourcePath] as Record<string, number>;
            for (const targetPath in targets) {
                if (!this.testPathFilter(targetPath)) continue;
                inboundCount.set(targetPath, (inboundCount.get(targetPath) || 0) + 1);
            }
        }

        // Create hub nodes and links if enabled
        let hubNodes: { id: string; type: 'linkhub'; name: string; minFiles: number }[] = [];
        let hubLinks: LinkObject[] = [];

        if (this.plugin.settings.enableLinkHubs && inboundCount.size > 0) {
            // Get sorted file IDs by inbound count
            const sortedFiles = [...inboundCount.entries()].sort((a, b) => b[1] - a[1]);
            const totalFiles = sortedFiles.length;

            // Calculate percentile boundaries
            const highThreshold = totalFiles > 0 ? Math.ceil(totalFiles * 0.9) : 0;  // top 10%
            const moderateThreshold = totalFiles > 0 ? Math.ceil(totalFiles * 0.6) : 0; // next 30%

            // Define tiers: rank 0 = high (top 10%), rank 1-moderateThreshold = moderate, rest = low
            const fileTier: Map<string, string> = new Map();
            for (let i = 0; i < sortedFiles.length; i++) {
                const [filePath] = sortedFiles[i];
                if (i < highThreshold) {
                    fileTier.set(filePath, '__hub_high');
                } else if (i < moderateThreshold) {
                    fileTier.set(filePath, '__hub_moderate');
                } else {
                    fileTier.set(filePath, '__hub_low');
                }
            }

            // Count files per tier
            const tierCounts = new Map<string, number>();
            fileTier.forEach((tierId) => {
                tierCounts.set(tierId, (tierCounts.get(tierId) || 0) + 1);
            });

            // Create hub node definitions
            const hubDefs: { id: string; name: string }[] = [];
            if (tierCounts.has('__hub_high')) {
                hubDefs.push({ id: '__hub_high', name: '★ Highly Linked' });
            }
            if (tierCounts.has('__hub_moderate')) {
                hubDefs.push({ id: '__hub_moderate', name: '◆ Moderately Linked' });
            }
            if (tierCounts.has('__hub_low')) {
                hubDefs.push({ id: '__hub_low', name: '○ Low Linked' });
            }

            // Create hub nodes
            for (const hub of hubDefs) {
                nodes.push({
                    id: hub.id,
                    type: 'linkhub',
                    instanceNum: tierCounts.get(hub.id) || 0,
                    links: [],
                    neighbors: [] as ExtendedNodeObject[],
                    size: tierCounts.get(hub.id) || 1,
                } as ExtendedNodeObject);
            }

            // Link files to their hub
            for (const [filePath, hubId] of fileTier) {
                links.push({ source: filePath, target: hubId, sourceId: filePath, targetId: hubId });
            }
        }
```

Note: This code uses `this.plugin.settings.enableLinkHubs` for the toggle. Files with zero inbound links are NOT added to any tier.

- [ ] **Step 3.2: Build to verify**

Run: `npm run build`
Expected: SUCCESS (no type errors)

---

### Task 4: Handle `linkhub` Node Color in Color Methods

**Files:**
- Modify: `src/views/TagsRoutes.ts` (lines 2089-2115 for `getNodeColorByTypeTE`, lines 2116-2140 for `getNodeColorByType`)

- [ ] **Step 4.1: Update `getNodeColorByTypeTE`**

In `src/views/TagsRoutes.ts`, in the `getNodeColorByTypeTE` method (line 2089), the switch statement needs a `linkhub` case. Change the switch block from:

```typescript
        switch (node.type) {
            case 'markdown':
            case 'tag':
            case 'attachment':
            case 'broken':
            case 'excalidraw':
            case 'pdf':
            case 'frontmatter_tag':
            case 'screenshot':
                            color = this.plugin.settings.customSlot[0].colorMap[node.type].value;
                break;
            default:
                color = '#ffffff'; // 默认颜色
        }
```

To:

```typescript
        switch (node.type) {
            case 'markdown':
            case 'tag':
            case 'attachment':
            case 'broken':
            case 'excalidraw':
            case 'pdf':
            case 'frontmatter_tag':
            case 'screenshot':
            case 'linkhub':
                            color = this.plugin.settings.customSlot[0].colorMap[node.type].value;
                break;
            default:
                color = '#ffffff'; // 默认颜色
        }
```

- [ ] **Step 4.2: Update `getNodeColorByType`**

In `src/views/TagsRoutes.ts`, in the `getNodeColorByType` method (line 2116), make the same change — add `case 'linkhub':` before the `screenshot` case:

```typescript
        switch (node.type) {
            case 'markdown':
            case 'tag':
            case 'attachment':
            case 'broken':
            case 'excalidraw':
            case 'pdf':
            case 'frontmatter_tag':
            case 'screenshot':
            case 'linkhub':
                            color = this.plugin.settings.customSlot[0].colorMap[node.type].value;
                break;
            default:
                color = '#ffffff'; // 默认颜色
        }
```

- [ ] **Step 4.3: Build to verify**

Run: `npm run build`
Expected: SUCCESS

---

### Task 5: Render Hub Nodes with Distinct Visual Style

**Files:**
- Modify: `src/views/TagsRoutes.ts` (lines 884-939 for `createNodeThreeObject`, lines 819-878 for `createNodeThreeObjectLight`)

Hub nodes should look different from regular spheres:
- Larger base size (based on number of files in tier)
- Display label on the sphere itself showing tier name + count
- Use an icosahedron geometry instead of sphere to visually distinguish

- [ ] **Step 5.1: Update `createNodeThreeObject` for linkhub nodes**

In `src/views/TagsRoutes.ts`, in `createNodeThreeObject` (line 884), insert the following code block **between line 885** (`DebugMsg...`) and **line 888** (`let nodeSize = ...`):

```typescript
    // Hub nodes special rendering
    if (node.type === 'linkhub') {
        const group = new THREE.Group();
        const hubSize = Math.max(8, Math.log2((node.instanceNum || 1) + 1) * 6);
        const geometry = new THREE.IcosahedronGeometry(hubSize, 1);
        let color = this.getNodeColorByType(node);
        const material = new THREE.MeshBasicMaterial({ color });
        material.opacity = 0.95;
        material.transparent = true;
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);

        const sprite = new SpriteText(node.name || node.id);
        sprite.material.depthWrite = false;
        sprite.color = '#ffffff';
        sprite.visible = this.plugin.settings.customSlot?.[0].toggle_label_display || false;
        sprite.textHeight = 1.2;
        sprite.position.set(0, hubSize + 2, 0);
        group.add(sprite);

        node._ThreeGroup = group;
        node._ThreeMesh = mesh;
        node._Sprite = sprite;

        return group;
    }
```

Note: The `name` property on hub nodes is already set via `node.id` but we need a display name. The hub node ids are `__hub_high`, `__hub_moderate`, `__hub_low`. We'll store a display-friendly name.

- [ ] **Step 5.2: Update hub node creation in `buildGdata()` to include a `name` property**

In Task 3's hub creation code, update the hub node push to include `name`:

```typescript
            // Create hub nodes
            const hubNames = new Map<string, string>([
                ['__hub_high', '★ Highly Linked'],
                ['__hub_moderate', '◆ Moderately Linked'],
                ['__hub_low', '○ Low Linked'],
            ]);
            for (const hub of hubDefs) {
                nodes.push({
                    id: hub.id,
                    type: 'linkhub',
                    instanceNum: tierCounts.get(hub.id) || 0,
                    links: [],
                    neighbors: [] as ExtendedNodeObject[],
                    size: tierCounts.get(hub.id) || 1,
                    name: hubNames.get(hub.id) || hub.id,
                } as ExtendedNodeObject);
            }
```

- [ ] **Step 5.3: Add `name` property to `ExtendedNodeObject` interface**

In `src/views/TagsRoutes.ts` (around line 34, in the `ExtendedNodeObject` interface), add:

```typescript
    name?: string; // display name for hub nodes
```

- [ ] **Step 5.4: Build to verify**

Run: `npm run build`
Expected: SUCCESS

---

### Task 6: Filter Out Hub Nodes When Setting is Disabled

**Files:**
- Modify: `src/views/TagsRoutes.ts` (lines 2335-2380, the filter section at end of `buildGdata()`)

- [ ] **Step 6.1: Remove hub nodes when `enableLinkHubs` is false**

Even though the creation code in Task 3 skips hub creation when `enableLinkHubs` is false, add an explicit filter block in case of future changes. After the existing hiding filter section (around line 2368, after the hiding filter loops), add:

```typescript
        // Remove hub nodes if disabled
        if (!this.plugin.settings.enableLinkHubs) {
            for (let i = nodes.length - 1; i >= 0; i--) {
                if (nodes[i].type === 'linkhub') {
                    nodes.splice(i, 1);
                    // Also remove links involving hub nodes
                    for (let j = links.length - 1; j >= 0; j--) {
                        if (links[j].sourceId === '__hub_high' ||
                            links[j].sourceId === '__hub_moderate' ||
                            links[j].sourceId === '__hub_low' ||
                            links[j].targetId === '__hub_high' ||
                            links[j].targetId === '__hub_moderate' ||
                            links[j].targetId === '__hub_low') {
                            links.splice(j, 1);
                        }
                    }
                }
            }
        }
```

- [ ] **Step 6.2: Build to verify**

Run: `npm run build`
Expected: SUCCESS

---

## Verification Checklist

After completing all tasks, verify the following behaviors in Obsidian (manual testing):

1. **Hub nodes appear** — Open the 3D graph. Three hub nodes should appear: "★ Highly Linked", "◆ Moderately Linked", "○ Low Linked" with appropriate icon shapes (icosahedrons)
2. **Files are connected to tiers** — Files should have links to their popularity tier hub. Top-linked files should connect to "★ Highly Linked"
3. **Toggle works** — In settings, disable "Show popularity hub nodes", reload graph. Hub nodes should disappear
4. **Color customization** — Hub nodes should render with the default orange color `#ff8800`
5. **Setting persists** — Change the setting, close Obsidian, reopen. Setting should persist
6. **Different vaults, different tiers** — The auto-percentile should adapt — small vaults might only have 1-2 non-empty tiers

No unit tests exist in this project — all verification is manual within Obsidian.
