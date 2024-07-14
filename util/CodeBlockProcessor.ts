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
    async codeBlockProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        let regstr = '(#[\\w\/_\u4e00-\u9fa5]*)'
        let regex = new RegExp(regstr, 'g')
        //let match = regex.exec(source)
        let match = source.match(regex)
        if (match) {
            for (let i = 0; i < match.length; i++) {
                console.log("find the matchA: ", match[i])
               // console.log("souce is :", source )
            }
        } else {
            console.log("not found tag(s)")
        }
        
        //const theTag = source.
        const rows = source.split("\n").filter((row) => row.length > 0);
        el.createEl('h1', { text: "Tags reportAA" });
        const table = el.createEl("table");
        const body = table.createEl("tbody");

        for (let i = 0; i < rows.length; i++) {
            const cols = rows[i].split(",");

            const row = body.createEl("tr");

            for (let j = 0; j < cols.length; j++) {
                row.createEl("td", { text: cols[j] });
            }
        }
        let term = "#empty"
        if (match) term = match[0]
        let con =   this.getTagContent(term)   
        console.log("got string is : ", (con))
       
        Promise.all(con).then((values) => {
            let noteArr = (values).flat() ;
            noteArr.sort((a, b) => getLineTime(a) - getLineTime(b))
            el.createEl('h3', { text: "Tag\ [" + term + "\] total: `" + noteArr.length + "` records." })
            for (let i = 0; i < noteArr.length; i++) {
            //    el.createEl('div', { text: "## " + (i + 1) + "\n" + `${noteArr[noteArr.length - 1 - i]}`.replace("\n", "<br>") })
                let tmpContainer = el.createEl('div');
                MarkdownRenderer.render(this.plugin.app,
                    "## " + (i + 1) + "\n" + `${noteArr[noteArr.length - 1 - i]}`,
                    tmpContainer, ctx.sourcePath, this.plugin.app.workspace.getActiveViewOfType(MarkdownView) as MarkdownView
                )
                /* 					el.createEl('div', { text: "## " + (i + 1) + "\n" });
                                const lines = (noteArr as string)[noteArr.length - 1 - i].split('\n')
                                lines.array.forEach(element => {
                                    el.createEl('div',{text:element})
                                }); */

            }
            let h = (this ?.plugin.app.metadataCache.getCache(ctx.sourcePath).headings as HeadingCache);//[0].heading;
            h.push({
                heading: "abc", level: 0,
                position: {
                    end: { line: 14, col: 3 },
                    start: { line: 14, col: 0 }
                
            }});
            h.push({
                heading: "def", level: 1,
                position: {
                    end: { line: 15, col: 3 },
                    start: { line: 15, col: 0 }
                
            }});
            console.log("the heading is ", h);
            const outlineView = this.plugin.app.workspace.getLeavesOfType('outline')[0]?.view;
            if (!outlineView) { return false; } else { console.log("found the outlineview") }
            let hh = outlineView.constructor.prototype.createItemDom.call(this.plugin,h)
            console.log("hh is :", hh)
            outlineView.update();
            
        }

       )

    }

}