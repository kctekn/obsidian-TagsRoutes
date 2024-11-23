import { CachedMetadata, MarkdownView, TagCache, View, WorkspaceLeaf } from 'obsidian';
import { TFile } from "obsidian";
import { globalProgramControl } from 'src/main';
import { nodeTypes } from 'src/views/TagsRoutes';

// 定义调试级别
export enum DebugLevel {
	NONE = 0,   // 不输出
	ERROR = 1,  // 仅输出错误
	WARN = 2,   // 输出警告和错误
	INFO = 3,   // 输出信息、警告和错误
	DEBUG = 4   // 输出所有信息
}

// DebugMsg 
export function DebugMsg(level: DebugLevel, ...args: any[]): void {
	if (level <= globalProgramControl.debugLevel) {
			switch (level) {
					case DebugLevel.ERROR:
							console.error('%c [ERROR] %c', 'color: white;background-color: red;', 'color: black;',...args);
							break;
					case DebugLevel.WARN:
							console.warn('%c [WARN] %c', 'color: white;background-color: orange;', 'color: black;',...args);
							break;
					case DebugLevel.INFO:
							console.info('%c [INFO] %c', 'color: white;background-color: blue;', 'color: black;',...args);
							break;
					case DebugLevel.DEBUG:
							console.debug('%c [DEBUG] %c', 'color: black;background-color: lime;', 'color: black;',...args);
							break;
					default:
							break;
			}
	}
}

export const setViewType = (view: View, mode: "source" | "preview" | "live") => {
	if (view && view.getViewType() === 'markdown') {
		switch (mode) {
			case "source":
				view.setState({ mode: mode,source:true }, { history: false })
				break;
			case "preview":
					view.setState({ mode: mode }, { history: false })
				break;
			case "live":
			view.setState({ mode: "source", source: false  }, { history: false })
				break;
		}
	}
}
export function createFolderIfNotExists(folderPath: string) {
	const folder = this.app.vault.getAbstractFileByPath(folderPath);
	if (!folder) {
	   this.app.vault.createFolder(folderPath);
	 //  DebugMsg(DebugLevel.DEBUG,`Folder created: ${folderPath}`);
	} else {
	 //  DebugMsg(DebugLevel.DEBUG,`Folder already exists: ${folderPath}`);
	}
 }
// 函数：获取所有标签
export const getTags = (cache: CachedMetadata | null): TagCache[] => {
	if (!cache || !cache.tags) return [];
	return cache.tags;
};
// 函数：判断文件类型
export const getFileType = (filePath: string): nodeTypes => {
	const parts = filePath.split('.');
	const extension = parts[parts.length - 1];
	const middlePart = parts[parts.length - 2];
	switch (extension) {
		case 'md':
			if (middlePart === 'excalidraw') {
				return 'excalidraw';
			} else {
				return 'markdown'
			}
			case 'pdf':
				return 'pdf'
		}
	if (filePath.contains("attachments")) return 'attachment'
	if (middlePart?.contains("graph-screenshot-")) return 'screenshot'

	return 'other'
};
export const getAllLinks = (cache: CachedMetadata | null): string[] => {
	if (!cache || !cache.links) return [];
	return cache.links.map(link => {
		const linkPath = link.link;
		return linkPath.contains('.') ? linkPath : `${linkPath}.md`;
	});
};
// 函数：解析标签层级结构
export const parseTagHierarchy = (tag: string): string[] => {
	const parts = tag.split('/');
	return parts.map((_, index) => parts.slice(0, index + 1).join('/'));
};
export const parseTagHierarchy1 =  (tag: string): string[] => {
    return tag.split('/');
}
export const filterStrings = ['TagsRoutes', 'AnotherString']; // 需要过滤的字符串列表
// 过滤条件函数：检查路径中是否包含字符串列表中的任何一个字符串
export const shouldRemove = (path: string, filterList: string[]) => {
	return filterList.some(filterStr => path.includes(filterStr));
};
export async function showFile(filePath: string) {
	const { vault } = this.app;
	let file = vault.getAbstractFileByPath(filePath)
	let waitFlag = true;
	const timeout = setTimeout(() => {
		waitFlag = false;
	}, 3000);
	while (!(file && file instanceof TFile) && waitFlag) {
		await sleep(100)
		//	DebugMsg(DebugLevel.DEBUG,"wait for file ready")
		file = vault.getAbstractFileByPath(filePath)
	}
	clearTimeout(timeout);
	if (file && file instanceof TFile) {

		const leaves = this.app.workspace.getLeavesOfType("markdown");
		const existingLeaf = leaves.find((leaf: WorkspaceLeaf) => (leaf.view as MarkdownView).file?.path === filePath);

		if (existingLeaf) {

			this.app.workspace.setActiveLeaf(existingLeaf);
			await existingLeaf.openFile(file);
			setViewType(existingLeaf.view, "preview");
		} else {
			const leaf = this.app.workspace.getLeaf(false);
			await leaf.openFile(file);
			setViewType(leaf.view, "preview");
		}
	}
}
export function getLineTime(line:string) {
	let regstr = 'Time: +(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})'
	let regex = new RegExp(regstr, 'g')
	let match = regex.exec(line)
	if (match) {
			return (new Date(match[1])).getTime()
	} else
			return 0
}
export class PathFilter {
	static readonly DEFAULT_VALUE = "put one filter per line";

	static encode(value: string): string {
			return btoa(encodeURIComponent(value));
	}

	static decode(encoded: string | null | undefined): string {
			if (!encoded) return this.DEFAULT_VALUE;
			try {
					return decodeURIComponent(atob(encoded));
			} catch {
					return this.DEFAULT_VALUE;
			}
	}

	static validatePattern(pattern: string): string {
			pattern = pattern.trim();
			if (!pattern) return '';
			
			// 处理通配符
			if (this.isGlobPattern(pattern)) {
					return this.globToRegex(pattern);
			}
			
			// 验证正则表达式
			try {
					new RegExp(pattern);
					return pattern;
			} catch {
					throw new Error(`Invalid pattern: ${pattern}`);
			}
	}

	static processFilters(encoded: string | null | undefined): {
			patterns: string[];
			regexPatterns: RegExp[];
	} {
			const decoded = this.decode(encoded);
			const patterns = decoded.split('\n')
					.map(line => line.trim())
					.filter(line => line);

			const validPatterns = patterns.map(p => this.validatePattern(p));
			const regexPatterns = validPatterns.map(p => new RegExp(p));

			return {
					patterns: validPatterns,
					regexPatterns: regexPatterns
			};
	}

	private static isGlobPattern(pattern: string): boolean {
			return pattern.includes('*') || pattern.includes('?');
	}

	private static globToRegex(glob: string): string {
			return glob
					.replace(/\*/g, '.*')
			//		.replace(/\?/g, '.')
			//		.replace(/\./g, '\\.')
			//		.replace(/\\/g, '\\\\');
	}
}
export const namedColor = new Map<string, string>([
	["aliceblue", "#f0f8ff"],
	["antiquewhite", "#faebd7"],
	["aqua", "#00ffff"],
	["aquamarine", "#7fffd4"],
	["azure", "#f0ffff"],
	["beige", "#f5f5dc"],
	["bisque", "#ffe4c4"],
	["black", "#000000"],
	["blanchedalmond", "#ffebcd"],
	["blue", "#0000ff"],
	["blueviolet", "#8a2be2"],
	["brown", "#a52a2a"],
	["burlywood", "#deb887"],
	["cadetblue", "#5f9ea0"],
	["chartreuse", "#7fff00"],
	["chocolate", "#d2691e"],
	["coral", "#ff7f50"],
	["cornflowerblue", "#6495ed"],
	["cornsilk", "#fff8dc"],
	["crimson", "#dc143c"],
	["cyan", "#00ffff"],
	["darkblue", "#00008b"],
	["darkcyan", "#008b8b"],
	["darkgoldenrod", "#b8860b"],
	["darkgray", "#a9a9a9"],
	["darkgreen", "#006400"],
	["darkkhaki", "#bdb76b"],
	["darkmagenta", "#8b008b"],
	["darkolivegreen", "#556b2f"],
	["darkorange", "#ff8c00"],
	["darkorchid", "#9932cc"],
	["darkred", "#8b0000"],
	["darksalmon", "#e9967a"],
	["darkseagreen", "#8fbc8f"],
	["darkslateblue", "#483d8b"],
	["darkslategray", "#2f4f4f"],
	["darkturquoise", "#00ced1"],
	["darkviolet", "#9400d3"],
	["deeppink", "#ff1493"],
	["deepskyblue", "#00bfff"],
	["dimgray", "#696969"],
	["dodgerblue", "#1e90ff"],
	["firebrick", "#b22222"],
	["floralwhite", "#fffaf0"],
	["forestgreen", "#228b22"],
	["fuchsia", "#ff00ff"],
	["gainsboro", "#dcdcdc"],
	["ghostwhite", "#f8f8ff"],
	["gold", "#ffd700"],
	["goldenrod", "#daa520"],
	["gray", "#808080"],
	["green", "#008000"],
	["greenyellow", "#adff2f"],
	["honeydew", "#f0fff0"],
	["hotpink", "#ff69b4"],
	["indianred ", "#cd5c5c"],
	["indigo", "#4b0082"],
	["ivory", "#fffff0"],
	["khaki", "#f0e68c"],
	["lavender", "#e6e6fa"],
	["lavenderblush", "#fff0f5"],
	["lawngreen", "#7cfc00"],
	["lemonchiffon", "#fffacd"],
	["lightblue", "#add8e6"],
	["lightcoral", "#f08080"],
	["lightcyan", "#e0ffff"],
	["lightgoldenrodyellow", "#fafad2"],
	["lightgrey", "#d3d3d3"],
	["lightgreen", "#90ee90"],
	["lightpink", "#ffb6c1"],
	["lightsalmon", "#ffa07a"],
	["lightseagreen", "#20b2aa"],
	["lightskyblue", "#87cefa"],
	["lightslategray", "#778899"],
	["lightsteelblue", "#b0c4de"],
	["lightyellow", "#ffffe0"],
	["lime", "#00ff00"],
	["limegreen", "#32cd32"],
	["linen", "#faf0e6"],
	["magenta", "#ff00ff"],
	["maroon", "#800000"],
	["mediumaquamarine", "#66cdaa"],
	["mediumblue", "#0000cd"],
	["mediumorchid", "#ba55d3"],
	["mediumpurple", "#9370d8"],
	["mediumseagreen", "#3cb371"],
	["mediumslateblue", "#7b68ee"],
	["mediumspringgreen", "#00fa9a"],
	["mediumturquoise", "#48d1cc"],
	["mediumvioletred", "#c71585"],
	["midnightblue", "#191970"],
	["mintcream", "#f5fffa"],
	["mistyrose", "#ffe4e1"],
	["moccasin", "#ffe4b5"],
	["navajowhite", "#ffdead"],
	["navy", "#000080"],
	["oldlace", "#fdf5e6"],
	["olive", "#808000"],
	["olivedrab", "#6b8e23"],
	["orange", "#ffa500"],
	["orangered", "#ff4500"],
	["orchid", "#da70d6"],
	["palegoldenrod", "#eee8aa"],
	["palegreen", "#98fb98"],
	["paleturquoise", "#afeeee"],
	["palevioletred", "#d87093"],
	["papayawhip", "#ffefd5"],
	["peachpuff", "#ffdab9"],
	["peru", "#cd853f"],
	["pink", "#ffc0cb"],
	["plum", "#dda0dd"],
	["powderblue", "#b0e0e6"],
	["purple", "#800080"],
	["rebeccapurple", "#663399"],
	["red", "#ff0000"],
	["rosybrown", "#bc8f8f"],
	["royalblue", "#4169e1"],
	["saddlebrown", "#8b4513"],
	["salmon", "#fa8072"],
	["sandybrown", "#f4a460"],
	["seagreen", "#2e8b57"],
	["seashell", "#fff5ee"],
	["sienna", "#a0522d"],
	["silver", "#c0c0c0"],
	["skyblue", "#87ceeb"],
	["slateblue", "#6a5acd"],
	["slategray", "#708090"],
	["snow", "#fffafa"],
	["springgreen", "#00ff7f"],
	["steelblue", "#4682b4"],
	["tan", "#d2b48c"],
	["teal", "#008080"],
	["thistle", "#d8bfd8"],
	["tomato", "#ff6347"],
	["turquoise", "#40e0d0"],
	["violet", "#ee82ee"],
	["wheat", "#f5deb3"],
	["white", "#ffffff"],
	["whitesmoke", "#f5f5f5"],
	["yellow", "#ffff00"],
	["yellowgreen", "#9acd32"],
]);