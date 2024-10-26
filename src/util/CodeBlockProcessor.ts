import { MarkdownPostProcessorContext, moment, TFile, MarkdownRenderer, MarkdownView, HeadingCache, getFrontMatterInfo, parseFrontMatterTags } from "obsidian"
import TagsRoutes, { globalProgramControl } from '../main';
import { getLineTime, DebugLevel, DebugMsg } from "./util";

//Include: number, English chars, Chinese chars, and: /, -
const pattern_tags_char = '#[0-9a-zA-Z\\u4e00-\\u9fa5/_-]'
const pattern_timeStamp = '\\d{4}-\\d{2}-\\d{2} *\\d{2}:\\d{2}:\\d{2}'
//Links format: 'tr-' + number or English chars
//const pattern_link = '\\^tr-[a-z0-9]+$'
const tagRegEx = /\^tr-[a-z0-9]+$/
const regex_TagsWithTimeStamp = new RegExp(`(?:(?<=\\s)|(?<=^))((?:${pattern_tags_char}+ *)+)(${pattern_timeStamp})?`, 'gm');
const timeDurationRegex=/#\d+day/
interface queryKey{
    type: string;
    value: string;
    result: string[];
}
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
    private async frontmatterTagProcessor(query:queryKey) {
        
        //const tag = source.replace(/frontmatter_tag:/, '').trim();
        const tag = query.value;
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
       // this.writeMarkdown("frontmatter_tag: " + tag, writeContent, el, ctx);
        //query.result = writeContent;
        return [writeContent];
    }
    private async tagProcessor(query: queryKey): Promise<Promise<string[]>[]>{
        const term = query.value;
        const files = this.plugin.app.vault.getMarkdownFiles();
        const arr = files.map(
            async (file) => {
                const content = await this.plugin.app.vault.cachedRead(file);
                const fmi = getFrontMatterInfo(content);
                if (fmi.exists && fmi.frontmatter.contains("tag-report")) {
                    return [];
                }

                const paragraphs = content
                    .split(/\n[\ ]*\n/)
                    .filter(line => line.contains(term));

                if (paragraphs.length != 0) {
                    var mmtime;
                    //'[\/_# \u4e00-\u9fa5]*'
                    var regstr = term + '[#a-zA-Z0-9\\-\/_\u4e00-\u9fa5 ]* +(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})';
                    var regex = new RegExp(regstr, 'g');
                    
                    let updatedContent = content;
                    let isUpdated = false;  // 用于跟踪是否进行了任何更新
                    const retArr = paragraphs.map(
                        (paragraph) => {
                            const stripedParagraph = paragraph.replace(/<.*>/gm, "").replace(/```.*```/gm, "").replace(/#\d+day/gm,"")
                            if (paragraph.length != stripedParagraph.length) {
                             //   console.log("original lenght: ", line.length)
                             //   console.log("stripped lenght: ", stripedLine.length)
                            }
                            regex.lastIndex = 0;
                            let match = regex.exec(stripedParagraph);
                            if (match) {
                                mmtime = " Tag Time: " + match[1];
                            } else {
                                mmtime = " Created Time: " + moment(file.stat.ctime).format('YYYY-MM-DD HH:mm:ss');
                            }

                            let randomLinker=""
                            if (this.plugin.settings.enableParagraphLinker) {
                                // 生成一个随机的段落链接标记
                                const tagMatch = paragraph.trimEnd().match(tagRegEx);
                                if (tagMatch) {

                                    randomLinker = tagMatch[0].substring(1); // 获取已有的链接标记
                                } else {
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
                                randomLinker = `#^${randomLinker}`
                            }
//                            return paragraph.trimEnd() + "\n\n \[*From* [[" + `${file.name.split(".")[0]}#^${randomLinker}|${file.name.split(".")[0]}]], *` + mmtime + "*\]\n";
                            const regexp_local = new RegExp(regex_TagsWithTimeStamp.source, regex_TagsWithTimeStamp.flags);
                            let matched_Tags_Timestamp_Group;
                            let contentTimeString = mmtime;
                            let retParagraph = "";
                            while ((matched_Tags_Timestamp_Group = regexp_local.exec(stripedParagraph)) !== null) {
                                let matched_Tags = matched_Tags_Timestamp_Group[1];
                                const regexB = new RegExp(`${pattern_tags_char}+`,'gm')
                                const matches = matched_Tags.match(regexB)
                                retParagraph = paragraph.trimEnd() + "\n\n----\n " +
                                    "\[ *Tags:* " + matches?.join(' ') + " \]\n" +
                                    "\[ *" + contentTimeString + "* \]\n" +
                                    (this.plugin.settings.enableParagraphLinker?
                                    "\[ *From:* [[" + `${file.path}${randomLinker}|${file.name.split(".")[0]}]] \]\n` :
                                    "\[ *From:* [[" + `${file.path}|${file.name.split(".")[0]}]] \]\n` )
                            }
                            return retParagraph;
                        }
                    );

                    // 如果有任何更新，才将所有更新的行内容写回文件
                    if (isUpdated) {
                        await this.plugin.app.vault.modify(file, updatedContent);
                        DebugMsg(DebugLevel.DEBUG,"file modified: ", file)
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
    private async timeDurationProcessor(query: queryKey): Promise<Promise<string[]>[]> {
        const queryDuration = Number(query.value.replace('#','').replace('day',''));

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
                            const stripedParagraph = paragraph.replace(/<.*>/gm, "").replace(/```.*```/gm, "").replace(/#\d+day/gm,"")
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
                                    //not applicated, bypass
                                    continue;
                                }

                                let randomLinker=""
                                if (this.plugin.settings.enableParagraphLinker) {
                                    // 生成一个随机的段落链接标记
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
                                    randomLinker = `#^${randomLinker}`
                                }
                                const regexB = new RegExp(`${pattern_tags_char}+`,'gm')
                                const matches = matched_Tags.match(regexB)
                                retParagraph = paragraph.trimEnd() + "\n\n----\n " +
                                    "\[ *Tags:* " + matches?.join(' ') + " \]\n" +
                                    "\[ *" + contentTimeString + "* \]\n" +
                                    (this.plugin.settings.enableParagraphLinker?
                                    "\[ *From:* [[" + `${file.path}${randomLinker}|${file.name.split(".")[0]}]] \]\n` :
                                    "\[ *From:* [[" + `${file.path}|${file.name.split(".")[0]}]] \]\n` )
                            }
                            return retParagraph;
                        }
                    );

                    // 如果有任何更新，才将所有更新的行内容写回文件
                    if (isUpdated) {
                        await this.plugin.app.vault.modify(file, updatedContent);
                        DebugMsg(DebugLevel.DEBUG,"file modified: ", file)
                    }
                    return retArr //.flat();
                } else {
                    return [];
                }
            }
        );
        return arr;
    }

    writeMarkdownWrap(query: queryKey, source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        if (query.type == 'frontmatter_tag:') {
            this.writeMarkdown(query.type+query.value,source, el,ctx)
        } else {
            this.writeMarkdown(query.value,source, el,ctx)
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
    
    extractQueryKey(source: string):queryKey {
        let queryKey: queryKey = {type:"",value:"",result:[]};
        if (source.contains("frontmatter_tag:")) {
            queryKey.type = "frontmatter_tag:"
            queryKey.value= source.replace(/frontmatter_tag:/, '').trim();
        } else {
            const regstr = `(${pattern_tags_char}*)`
            const regex = new RegExp(regstr, 'g')
            const match = source.match(regex)
            const term = match?.[0] || "#empty"
            const timeRegex = new RegExp(timeDurationRegex.source,timeDurationRegex.flags)
            const timeMatch = term.match(timeRegex)
            if (timeMatch) {
                queryKey.type = "time_duration:"
                queryKey.value = term; //'#'+ timeMatch[0].substring(1);
            } else {
                queryKey.type = "tag:"
                queryKey.value = term 
            }
        }
        return queryKey;
    }
    getMarkdownContent(query:queryKey)
    {
        if (query.type == 'frontmatter_tag:') return query.result;
        const noteArr = query.result;
        const term = query.value;
        const markdownText: string[] = [];
        if (globalProgramControl.useGroup) {
            const tagMap: Map<string, string[]> = new Map();
            //Get tags
           // const regex1 = /(?<= )#([a-zA-Z0-9\u4e00-\u9fa5\/\-]+)/g;
           // const pattern_tags_char = '#[0-9a-zA-Z\\u4e00-\\u9fa5/_-]'
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
        return markdownText;
    }
    async codeBlockProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        //Bypass the none-first pass
        if ((ctx.frontmatter as any).tags !== undefined) {
            return;
        }

        //Get the key type, and value
        const query = this.extractQueryKey(source)
        const perf = new performanceCount()
        this.writeMarkdownWrap(query, "<br><div class=\"container-fluid\"><div class=\"tg-alert\"><b>PROCESSING...</b></div><small><em>The first time will be slow depending on vault size.</em></small></div>", el, ctx);
        //Process to get the content
        switch (query.type) {
            case 'frontmatter_tag:':
                query.result = await this.frontmatterTagProcessor(query);
                break;
            case 'time_duration:':
                query.result = (await Promise.all(await this.timeDurationProcessor(query))).flat().filter(v => v != "");
                break;
            case 'tag:':
                query.result = (await Promise.all(await this.tagProcessor(query))).flat().filter(v => v != "");
                break;
        }
        //Render it
        let executionTimeString
        if (globalProgramControl.debugLevel == DebugLevel.DEBUG) {
            executionTimeString = perf.getTimeCost();
        } else {
            executionTimeString = `Report refreshed at ${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')} `
        }
        const mc = "*" + executionTimeString + "*\n\n" + this.getMarkdownContent(query).filter(line => line.trim() !== "").join("\n")
        
        this.writeMarkdownWrap(query, mc, el, ctx);
        return;
     
    }
}