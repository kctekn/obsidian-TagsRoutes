import { MarkdownPostProcessorContext, moment, TFile, MarkdownRenderer, MarkdownView, HeadingCache } from "obsidian"
import { getLineTime } from "./util"
import TagsRoutes from 'main';
export class codeBlockProcessor {
    plugin: TagsRoutes;

    constructor(plugin: TagsRoutes) {
        this.plugin = plugin;
        this.codeBlockProcessor = this.codeBlockProcessor.bind(this);

    }
    private getTagContent(term: string) {
        const files = this.plugin.app.vault.getMarkdownFiles()
        const arr = files.map(
            async (file) => {
                const content = await this.plugin.app.vault.cachedRead(file)
                if (content.contains("tag-report")) {
                    return []
                }
                const lines = content
                    .split(/\n[\ ]*\n/)
                    .filter(line => line.contains(term))
                if (lines.length != 0) {
                    var mmtime
                    var regstr = term + '[\/_# \u4e00-\u9fa5]* +(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})'
                    var regex = new RegExp(regstr, 'g')
                    const retArr = lines.map(

                        (line) => {
                            regex.lastIndex = 0
                            let match = regex.exec(line)
                            if (match) {
                                mmtime = " Tag Time: " + match[1]
                            } else {
                                mmtime = " Created Time: " + moment(file.stat.ctime).format('YYYY-MM-DD HH:mm:ss')
                            }
                            return line + "\n\n \[*From* " + "[[" +
                                file.name.split(".")[0] + "]], *" + mmtime + "*\]\n"
                        }
                    )
                  //  let abc = this.plugin.app.metadataCache.getCache(file.path).headings;
                    return retArr
                } else {
                    return []
                }
            }

        )
        return arr;
    }
     calculateOffset(lines: string[], lineNum: number, col: number): number {
        let offset = 0;
        for (let i = 0; i < lineNum; i++) {
            offset += lines[i].length + 1; // +1 for the newline character
        }
        return offset + col;
    }
    
     parseMarkdownToHeadings(markdown: string): HeadingCache[] {
        const headings: HeadingCache[] = [];
        const lines = markdown.split('\n');
    
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];
            const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    
            if (headingMatch) {
                const [_, level, heading] = headingMatch;
                const startOffset = this.calculateOffset(lines, lineNum, 0);
                const endOffset = startOffset + line.length;
    
                const headingCache: HeadingCache = {
                    heading: heading.trim(),
                    level: level.length,
                    position: {
                        start: { line: lineNum, col: 0, offset: startOffset },
                        end: { line: lineNum, col: line.length, offset: endOffset },
                    },
                };
                headings.push(headingCache);
            }
        }
    
        return headings;
    }
    async codeBlockProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        console.log("code block called");
        const regstr = '(#[\\w\/_\u4e00-\u9fa5]*)'
        const regex = new RegExp(regstr, 'g')
        let match = source.match(regex)
        let term = match ?.[0] || "#empty"
        let con = this.getTagContent(term)
        let markdownText: string[] = [];
        let values = await Promise.all(con);
        //    Promise.all(con).then((values) => {
        let noteArr = (values).flat();
        noteArr.sort((a, b) => getLineTime(a) - getLineTime(b))
        markdownText.push("# Tag\ [" + term + "\] total: `" + noteArr.length + "` records.")
        for (let i = 0; i < noteArr.length; i++) {
            markdownText.push("## " + (i + 1) + "\n" + `${noteArr[noteArr.length - 1 - i]}`)
        }
        const markDownSource = markdownText.filter(line => line.trim() !== "").join("\n")
        el.createEl('pre', {text: markDownSource})
        MarkdownRenderer.render(this.plugin.app,
            markDownSource,
            el.createEl('div'), ctx.sourcePath, this.plugin.app.workspace.getActiveViewOfType(MarkdownView) as MarkdownView
        )
        const currentCache = this.plugin.app.metadataCache.getCache(ctx.sourcePath) || null;
        if (!currentCache) return;

        const heading = this.parseMarkdownToHeadings(markDownSource);


    //    if (currentCache && Array.isArray(currentCache.headings)) {
    //        currentCache.headings.push(...heading);
    //    } else {
    //        currentCache.headings = [...heading];
    //    }
        currentCache.headings = heading;




        console.log("the heading is ", heading);
        const outlineView = this.plugin.app.workspace.getLeavesOfType('outline')[0] ?.view;
        if (!outlineView) { return false; } else { console.log("found the outlineview") }
        let hh = outlineView.constructor.prototype.createItemDom.call(this.plugin, currentCache.headings)
        console.log("hh is :", hh);
        (outlineView as any).update();

    }

}