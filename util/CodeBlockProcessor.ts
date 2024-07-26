import { MarkdownPostProcessorContext, moment, TFile, MarkdownRenderer, MarkdownView, HeadingCache, getFrontMatterInfo, parseFrontMatterTags } from "obsidian"
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
                const fmi = getFrontMatterInfo(content)
                if (fmi.exists && fmi.frontmatter.contains("tag-report")) {
                 //   console.log("bypass file1: ", file.path)
                    return []
                }
/*                 if (content.contains("tag-report")) {
                    console.log("bypass file2: ", file.path)
                    return []
                }
 */                const lines = content
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
        const match = source.match(regex)
        const term = match?.[0] || "#empty"
        const con = this.getTagContent(term)
        const markdownText: string[] = [];
        const values = await Promise.all(con);
        //    Promise.all(con).then((values) => {
        const noteArr = (values).flat();
        noteArr.sort((a, b) => getLineTime(a) - getLineTime(b))
        markdownText.push("# Tag\ [" + term + "\] total: `" + noteArr.length + "` records.")
        for (let i = 0; i < noteArr.length; i++) {
            noteArr[noteArr.length - 1 - i] = noteArr[noteArr.length - 1 - i].replace(/^#/g, "###").replace(/\n#/g, "\n###")
            noteArr[noteArr.length - 1 - i] = "> [!info] " + (i + 1) + "\n> " + noteArr[noteArr.length - 1 - i].replace(/\n/g, "\n> ")
            markdownText.push("## " + (i + 1) + "\n" + `${noteArr[noteArr.length - 1 - i]}`)
        }
        const markDownSource = markdownText.filter(line => line.trim() !== "").join("\n")
        const useDiv: boolean = true;
        if (useDiv) {
            //el.createEl('pre', {text: markDownSource})
            MarkdownRenderer.render(this.plugin.app,
                markDownSource,
                el.createEl('div'), ctx.sourcePath, this.plugin.app.workspace.getActiveViewOfType(MarkdownView) as MarkdownView
            )

        } else {


            //console.log("markdown source is:", markDownSource)
            const fileContent = `---\ntags:\n  - tag-report\n---\n
\`\`\`tagsroutes
           ${term}
\`\`\`
*This file is generated automatically, will be override.*
*Don't edit this file in case your work will be lost.*
`
            const { vault } = this.plugin.app;
            const file = vault.getAbstractFileByPath(ctx.sourcePath);
            if (file instanceof TFile) {
                vault.modify(file, fileContent + markDownSource)
            }
        }
    }
}