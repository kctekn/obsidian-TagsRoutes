import { App, CachedMetadata, TagCache, View,moment } from 'obsidian';
import { TFile } from "obsidian";



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
	 //  console.log(`Folder created: ${folderPath}`);
	} else {
	 //  console.log(`Folder already exists: ${folderPath}`);
	}
 }
 
// 函数：获取所有标签
export const getTags = (cache: CachedMetadata | null): TagCache[] => {
	if (!cache || !cache.tags) return [];
	return cache.tags;
};

// 函数：判断文件类型
export const getFileType = (filePath: string): 'md' | 'tag' | 'attachment' | 'broken' | 'excalidraw' => {
	const parts = filePath.split('.');
	const extension = parts[parts.length - 1];
	const middlePart = parts[parts.length - 2];

	switch (extension) {
		case 'md':
			if (middlePart === 'excalidraw') {
				return 'excalidraw';
			} else {
				return 'md'
			}

	}
	return 'attachment'
};

// 函数：获取所有链接
/*
const getAllLinks = (cache: CachedMetadata | null): string[] => {
if (!cache || !cache.links) return [];
return cache.links.map(link => link.link);
};*/

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
		//	console.log("wait for file ready")
		file = vault.getAbstractFileByPath(filePath)
	}
	clearTimeout(timeout);
	if (file && file instanceof TFile) {
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(file)
		//	console.log("log file is ready for show")
		setViewType(leaf.view, "preview")
	} else {
		//	console.log("log file is not ready for show")
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


