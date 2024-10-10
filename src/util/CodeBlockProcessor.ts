import { MarkdownPostProcessorContext, moment, TFile, MarkdownRenderer, MarkdownView, HeadingCache, getFrontMatterInfo, parseFrontMatterTags } from "obsidian"
import TagsRoutes, { globalProgramControl } from '../main';
import { getLineTime, dedent } from "./util";

//Include: number, English chars, Chinese chars, and: /, -
const pattern_tags_char = '#[0-9a-zA-Z\\u4e00-\\u9fa5/-_]'
//const pattern_tags_char_2 = '[a-zA-Z0-9\\u4e00-\\u9fa5/-]'
const pattern_timeStamp = '\\d{4}-\\d{2}-\\d{2} *\\d{2}:\\d{2}:\\d{2}'
//Links format: 'tr-' + number or English chars
const pattern_link = '\\^tr-[a-z0-9]+$'
const regex_TagsWithTimeStamp = new RegExp(`(?:(?<=\\s)|(?<=^))((?:${pattern_tags_char}+ +)+)(${pattern_timeStamp})?`, 'gm');

class performanceCount {
    start:number
    end:number
    startDatetime:string
    endDatetime:string
    constructor() {
        this.start = performance.now();
        this.startDatetime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss') 
    }
    getTimeCost() {
        this.end = performance.now();
        this.endDatetime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss') 
        const retStr = `Start at: ${this.startDatetime} - ${this.endDatetime}, execution: ${this.end - this.start} ms`
        this.start = performance.now();
        this.startDatetime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss') 
        return retStr;
    }
}

export class codeBlockProcessor {
    plugin: TagsRoutes;
    constructor(plugin: TagsRoutes) {
        this.plugin = plugin;
        this.codeBlockProcessor = this.codeBlockProcessor.bind(this);
    }

    getTimeDiffHour(start: string, end: string): number {
        return ((new Date(end)).getTime() - (new Date(start)).getTime()) / (1000 * 60 * 60);
    }
    private async checkAndGetFrontmatterTag(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        const tag = source.replace(/frontmatter_tag:/, '').trim();
        const files = this.plugin.app.vault.getMarkdownFiles();

        const matchingFiles = await Promise.all(files.map(async (file) => {
            const cache = this.plugin.app.metadataCache.getCache(file.path);
            if (cache?.frontmatter?.tags) {
                let tags = Array.isArray(cache.frontmatter.tags)
                    ? cache.frontmatter.tags
                    : [cache.frontmatter.tags];

                if (tags.includes("tag-report")) {
                    return null; // Exclude tag-report files
                }

                if (tags.some(t => t.includes(tag))) {
                    //     console.log(">>find the file have this tag: ", file.path);
                    return file.path;
                }
            }
            return null;
        }));

        const result = matchingFiles.filter(path => path !== null) as string[];
        const writeContent = `
# Total \`${result.length}\` notes with tag \`${tag}\` :
${result.map(v => "- [[" + v.replace(/.md$/, "") + "]]").join("\n")}
`;
        this.writeMarkdown("frontmatter_tag: " + tag, writeContent, el, ctx);
    }
    private async getTagContent2(term: string): Promise<Promise<string[]>[]> {
        const files = this.plugin.app.vault.getMarkdownFiles();
        const arr = files.map(
            async (file) => {
                const content = await this.plugin.app.vault.cachedRead(file);
                const fmi = getFrontMatterInfo(content);
                if (fmi.exists && fmi.frontmatter.contains("tag-report")) {
                    return [];
                }

                const lines = content
                    .split(/\n[\ ]*\n/)
                    .filter(line => line.contains(term));

                if (lines.length != 0) {
                    var mmtime;
                    //'[\/_# \u4e00-\u9fa5]*'
                    var regstr = term + '[#a-zA-Z0-9\\-\/_\u4e00-\u9fa5 ]* +(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})';
                    var regex = new RegExp(regstr, 'g');
                    let updatedContent = content;
                    let isUpdated = false;  // 用于跟踪是否进行了任何更新
                    const retArr = lines.map(
                        (line) => {
                            const stripedLine = line.replace(/<.*>/gm, "").replace(/```.*```/gm, "")
                            if (line.length != stripedLine.length) {
                             //   console.log("original lenght: ", line.length)
                             //   console.log("stripped lenght: ", stripedLine.length)
                            }
                            regex.lastIndex = 0;
                            let match = regex.exec(stripedLine);
                            if (match) {
                                mmtime = " Tag Time: " + match[1];
                            } else {
                                mmtime = " Created Time: " + moment(file.stat.ctime).format('YYYY-MM-DD HH:mm:ss');
                            }
                            // 生成一个随机的段落链接标记
                            const tagRegEx = /\^tr-[a-z0-9]+$/;
                            let randomLinker;
                            const tagMatch = line.trimEnd().match(tagRegEx);
                            if (tagMatch) {
                                randomLinker = tagMatch[0].substring(1); // 获取已有的链接标记
                            } else {
                                randomLinker = 'tr-' + Math.random().toString(36).substr(2, 9);
                                let updatedLine = ""
                                if (line.trimEnd().match(/\`\`\`/)) {
                                    updatedLine = line.trimEnd() + `\n^${randomLinker}\n`;
                                } else {
                                    updatedLine = line.trimEnd() + ` ^${randomLinker}\n`;
                                }
                                updatedContent = updatedContent.replace(line, updatedLine.trimEnd());
                                isUpdated = true;  // 标记为更新
                            }

                            return line.trimEnd() + "\n\n \[*From* [[" + `${file.name.split(".")[0]}#^${randomLinker}|${file.name.split(".")[0]}]], *` + mmtime + "*\]\n";
                        }
                    );

                    // 如果有任何更新，才将所有更新的行内容写回文件
                    if (isUpdated) {
                        await this.plugin.app.vault.modify(file, updatedContent);
                        console.log("file modified: ", file)
                    }
                    return retArr;
                } else {
                    return [];
                }
            }
        );
        return arr;
    }
    /***
     * the all tag content within a time period
     */
    private async getTagContentDuration(queryDuration: number): Promise<Promise<string[]>[]> {

        const files = this.plugin.app.vault.getMarkdownFiles();
        const arr = files.map(
            async (file) => {
                const content = await this.plugin.app.vault.cachedRead(file);
                const fmi = getFrontMatterInfo(content);
                if (fmi.exists && fmi.frontmatter.contains("tag-report")) {
                    return [];
                }
             //   console.log("process file: ", file.path)
                const paragraphs = content.split(/\n[\ ]*\n/)



                if (paragraphs.length != 0) {

                    let updatedContent = content;
                    let isUpdated = false;  // 用于跟踪是否进行了任何更新
                    const retArr = paragraphs.map(
                        //return the paragraph with information: "tags, tag/create time, from" appended.
                        (paragraph) => {
                            //    const regex_TagsWithTimeStamp = /(?:(?<=\s)|(?<=^))((?:#[0-9a-zA-Z\u4e00-\u9fa5/-]+ +)+)(\d{4}-\d{2}-\d{2} *\d{2}:\d{2}:\d{2})?/gm;
                            const stripedParagraph = paragraph.replace(/<.*>/gm, "").replace(/```.*```/gm, "")
                            if (paragraph.length != stripedParagraph.length) {
                            //    console.log("original lenght: ", paragraph.length)
                            //    console.log("stripped lenght: ", stripedParagraph.length)
                            }
                            // get the timestamp
                            let matched_Tags_Timestamp_Group;
                            let contentTimeString;
                            let retParagraph = "";
                            const regexp_local = new RegExp(regex_TagsWithTimeStamp.source, regex_TagsWithTimeStamp.flags);
                          //  regex_TagsWithTimeStamp.lastIndex = 0;
                            while ((matched_Tags_Timestamp_Group = regexp_local.exec(stripedParagraph)) !== null) {
                                let matched_Timestamp = matched_Tags_Timestamp_Group[2] || "";
                                let matched_Tags = matched_Tags_Timestamp_Group[1];
                                let lineTime = ""
                                if (matched_Timestamp !== "") {
                                    contentTimeString = " Tag Time: " + matched_Tags_Timestamp_Group[2];
                                    lineTime = matched_Tags_Timestamp_Group[2];
                                } else {
                                    lineTime = moment(file.stat.ctime).format('YYYY-MM-DD HH:mm:ss')
                                    contentTimeString = " Created Time: " + lineTime;
                                }
                                let duration = this.getTimeDiffHour(lineTime, moment(new Date()).format('YYYY-MM-DD HH:mm:ss'))
                                if (duration > 24 * queryDuration) {

                                    continue;
                                }

                                // 生成一个随机的段落链接标记
                                const tagRegEx = /\^tr-[a-z0-9]+$/;
                                let randomLinker;
                                const tagMatch = paragraph.trimEnd().match(tagRegEx);
                                if (tagMatch) {
                                    randomLinker = tagMatch[0].substring(1); // 获取已有的链接标记
                                } else {
                                    //create link, and change the original paragraph in the file content
                                    randomLinker = 'tr-' + Math.random().toString(36).substr(2, 9);
                                    let updatedLine = ""
                                    if (paragraph.trimEnd().match(/\`\`\`/)) {
                                        updatedLine = paragraph.trimEnd() + `\n^${randomLinker}\n`;
                                    } else {
                                        updatedLine = paragraph.trimEnd() + ` ^${randomLinker}\n`;
                                    }
                                    updatedContent = updatedContent.replace(paragraph, updatedLine.trimEnd());
                                    isUpdated = true;  // 标记为更新
                                }

                              //  const regexB = /#[a-zA-Z0-9\u4e00-\u9fa5\/\-]+/gm;
                                const regexB = new RegExp(`${pattern_tags_char}+`,'gm')
                                const matches = matched_Tags.match(regexB)
                                retParagraph = paragraph.trimEnd() + "\n\n----\n " +
                                    "\[ *Tags:* " + matches?.join(' ') + " \]\n" +
                                    "\[ *" + contentTimeString + "* \]\n" +
                                    "\[ *From:* [[" + `${file.name.split(".")[0]}#^${randomLinker}|${file.name.split(".")[0]}]] \]\n`
                            }
                            return retParagraph;
                        }
                    );

                    // 如果有任何更新，才将所有更新的行内容写回文件
                    if (isUpdated) {
                        await this.plugin.app.vault.modify(file, updatedContent);
                        //console.log("file modified: ", file)
                    }
                    return retArr //.flat();
                } else {
                    return [];
                }
            }
        );
        return arr;
    }
    private async getTagContent(term: string): Promise<Promise<string[]>[]> {
        const timeRegex = /#\d+/
        const timeMatch = term.match(timeRegex)
        let queryDuration = 1;
        if (timeMatch) {
            queryDuration = Number(timeMatch[0].substring(1));
            console.log("got the time duration: ", queryDuration)
            return this.getTagContentDuration(queryDuration);
        } else {
            return this.getTagContent2(term);
        }
    }
    async writeMarkdown(term: string, source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        const markDownSource = source;

        if (globalProgramControl.useDiv) {
            //el.createEl('pre', {text: markDownSource})
            MarkdownRenderer.render(this.plugin.app,
                markDownSource,
                el.createEl('div'), ctx.sourcePath, this.plugin.app.workspace.getActiveViewOfType(MarkdownView) as MarkdownView
            )
        } else {
            const fileContent = `---\ntags:\n  - tag-report\n---\n
\`\`\`tagsroutes
        ${term}
\`\`\`
*This file is automatically generated and will be overwritten.*
*Please do not edit this file to avoid losing your changes.*
`
            const { vault } = this.plugin.app;

            //need to add only process file under report directory
            const file = vault.getAbstractFileByPath(ctx.sourcePath);
            if (file instanceof TFile) {
                vault.modify(file, fileContent + markDownSource)
            }
        }
    }
    async codeBlockProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        //Bypass the first pass
        if ((ctx.frontmatter as any).tags === undefined) {
          //  return;
        }

        if (source.contains("frontmatter_tag:")) {
            this.checkAndGetFrontmatterTag(source, el, ctx)
            return;
        }

        //Process for non-frontmatter_tag part
        //Get the term
        const regstr = `(${pattern_tags_char}*)`
        const regex = new RegExp(regstr, 'g')
        const match = source.match(regex)
        const term = match?.[0] || "#empty"

     //   const startDateTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss') 
     //   const start = performance.now();
        const perf = new performanceCount()
        this.writeMarkdown(term, "<br><div class=\"container-fluid\"><div class=\"tg-alert\"><b>PROCESSING...</b></div><small><em>The first time will be slow depending on vault size.</em></small></div>", el, ctx);
        //Fetch the content
        const con = await this.getTagContent(term)
     //   const endDateTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss') 
     //   const end = performance.now();
        let executionTimeString = perf.getTimeCost();
        const markdownText: string[] = [];
        const values = await Promise.all(con);
        const noteArr = (values).flat().filter(v => v != "");
        executionTimeString = executionTimeString + "\n" + perf.getTimeCost();

        //Go process
        if (globalProgramControl.useGroup) {
            const tagMap: Map<string, string[]> = new Map();
            //Get tags
           // const regex1 = /(?<= )#([a-zA-Z0-9\u4e00-\u9fa5\/\-]+)/g;
            const pattern_tags_char = '#[0-9a-zA-Z\\u4e00-\\u9fa5/_-]'
            const regex1 = new RegExp(`(?<= )${pattern_tags_char}+`,'g')
            noteArr.sort((b, a) => getLineTime(a) - getLineTime(b))


            for (let i = 0; i < noteArr.length; i++) {

                //Get every tag in multiple tags
                const matches = noteArr[i].replace(/[^]*Tags:/, "").replace(/<.*>/gm, "").replace(/```.*```/gm, "").match(regex1);
               // console.log("replaced: ", noteArr[i].replace(/[^]*Tags:/, ""))
               // console.log("replaced original: ", noteArr[i])
               // console.log("matches: ", matches)

                //For every tag, do push the content to this tag even it will be duplicated
                try {
                    matches?.forEach(m => {
                        if (!tagMap.has(m)) {
                            tagMap.set(m, new Array())

                        }
                        tagMap.get(m)?.push(noteArr[i])
                        if (!globalProgramControl.allowDuplicated) {
                            throw ("pushed")
                        }
                    });
                } catch (error) {
                    
                }
            }

            //Generate the content block
            markdownText.push("# Tag\ [" + term + "\] total: `" + noteArr.length + "` records.")
            tagMap.forEach((content, tag) => {
                content.sort((a, b) => getLineTime(a) - getLineTime(b))
                markdownText.push(`# \\${tag} (${content.length})`)
                for (let i = 0; i < content.length; i++) {
                    content[content.length - 1 - i] = content[content.length - 1 - i].replace(/^#/g, "###").replace(/\n#/g, "\n###")
                    content[content.length - 1 - i] = "> [!info]+ " + (i + 1) + "\n> " + content[content.length - 1 - i].replace(/\n/g, "\n> ")
                    markdownText.push("## " + (i + 1) + "\n" + `${content[content.length - 1 - i]}`)
                }

            })

        } else {  //no group

            noteArr.sort((a, b) => getLineTime(a) - getLineTime(b))

            //Generate the content block
            markdownText.push("# Tag\ [" + term + "\] total: `" + noteArr.length + "` records.")
            for (let i = 0; i < noteArr.length; i++) {
                noteArr[noteArr.length - 1 - i] = noteArr[noteArr.length - 1 - i].replace(/^#/g, "###").replace(/\n#/g, "\n###")
                noteArr[noteArr.length - 1 - i] = "> [!info]+ " + (i + 1) + "\n> " + noteArr[noteArr.length - 1 - i].replace(/\n/g, "\n> ")
                markdownText.push("## " + (i + 1) + "\n" + `${noteArr[noteArr.length - 1 - i]}`)
            }
        }

        if (globalProgramControl.debug) {
            executionTimeString = executionTimeString + "\n" + perf.getTimeCost();
        } else {
            executionTimeString = `Report refreshed at ${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')} `
        }
        const markDownSource = "*"+executionTimeString +"*\n\n" + markdownText.filter(line => line.trim() !== "").join("\n")
        this.writeMarkdown(term, markDownSource, el, ctx);
    }
}