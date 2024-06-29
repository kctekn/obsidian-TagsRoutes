import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, getAllTags, CachedMetadata, TagCache, View, Vault } from 'obsidian';
import { ItemView, WorkspaceLeaf, TFile } from "obsidian";



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
	const file = vault.getAbstractFileByPath(filePath)
	if (file && file instanceof TFile) {
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(file)
		setViewType(leaf.view, "preview")
	}
}

export async function createAndWriteToFile(filePath: string, content: string,open : boolean = true) {
	const { vault } = this.app;
	// 检查文件是否已经存在
	if (!vault.getAbstractFileByPath(filePath)) {
		await vault.create(filePath, content);
		console.log("create query file.")
	} else {
		// 如果文件已经存在，可以选择覆盖内容或者追加内容
		const file = vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			await vault.modify(file, content); // 这里是覆盖内容
		}
	}
	// 打开新创建的文件
	if (true) {
		const file = vault.getAbstractFileByPath(filePath)
		if (file && file instanceof TFile) {
			const leaf = this.app.workspace.getLeaf(false);
			await leaf.openFile(file)
		}
	}
}
