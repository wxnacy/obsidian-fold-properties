import {App, Notice, PluginSettingTab, Setting, TFolder, AbstractInputSuggest} from "obsidian";
import MyPlugin from "./main";

export interface MyPluginSettings {
	/** 需要折叠属性的文件夹路径列表 */
	foldersToCollapse: string[];
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	foldersToCollapse: []
}

/**
 * 插件设置标签页类
 * 负责渲染和管理插件的用户界面设置
 */
export class FolderFoldSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * 渲染设置界面
	 * 创建文件夹列表管理界面，包括添加、删除、编辑功能
	 */
	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('需要折叠属性的文件夹')
			.setDesc('打开这些文件夹中的 Markdown 文件时，自动折叠文件属性。')
			.addButton((button) => {
				button.setButtonText('增加')
					.setCta()
					.onClick(async () => {
						this.plugin.settings.foldersToCollapse.push("");
						await this.plugin.saveSettings();
						this.display();
					});
			});

		this.plugin.settings.foldersToCollapse.forEach((path, index) => {
			let draftValue = path;
			const setting = new Setting(containerEl);
			setting.controlEl.style.display = 'flex';
			setting.controlEl.style.alignItems = 'center';
			setting.controlEl.style.gap = '8px';

			setting.addText((text) => {
				text
					.setPlaceholder('例如：Folder/Subfolder')
					.setValue(path)
					.onChange((value) => {
						draftValue = value;
					});

				text.inputEl.addClass('folders-to-collapse-input');
				text.inputEl.style.flex = '1 1 auto';
				text.inputEl.style.width = '100%';
				text.inputEl.style.minWidth = '0';

				/** 使用 Obsidian 内置的自动补全功能 */
				new FolderSuggest(this.app, text.inputEl);

				/** 失去焦点时验证并保存文件夹路径 */
				text.inputEl.addEventListener('blur', async () => {
					const normalized = draftValue.trim();
					if (!normalized) {
						this.plugin.settings.foldersToCollapse[index] = "";
						draftValue = "";
						text.setValue("");
						await this.plugin.saveSettings();
						return;
					}

					const abstractFile = this.app.vault.getAbstractFileByPath(normalized);
					if (!(abstractFile instanceof TFolder)) {
						new Notice(`文件夹不存在：${normalized}`);
						const stored = this.plugin.settings.foldersToCollapse[index] ?? "";
						draftValue = stored;
						text.setValue(stored);
						return;
					}

					const resolvedPath = abstractFile.path;
					this.plugin.settings.foldersToCollapse[index] = resolvedPath;
					draftValue = resolvedPath;
					text.setValue(resolvedPath);
					await this.plugin.saveSettings();
				});
			});

			/** 添加删除按钮 */
			setting.addExtraButton((button) => {
				button
					.setIcon('trash')
					.setTooltip('删除')
					.onClick(async () => {
						this.plugin.settings.foldersToCollapse.splice(index, 1);
						await this.plugin.saveSettings();
						this.display();
					});
			});
		});
	}
}

/**
 * 文件夹自动补全建议类
 * 使用 Obsidian 的 AbstractInputSuggest 类实现
 * 提供高性能的文件夹搜索和补全功能
 */
class FolderSuggest extends AbstractInputSuggest<string> {
	/** 缓存所有文件夹路径 */
	folders: string[];

	/**
	 * 构造函数
	 * @param app - Obsidian 应用实例
	 * @param inputEl - 输入框元素
	 */
	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
		this.folders = app.vault.getAllFolders().map(folder => folder.path);
	}

	/**
	 * 根据输入内容获取匹配的文件夹建议
	 * @param inputStr - 用户输入的搜索字符串
	 * @returns 匹配的文件夹路径数组
	 */
	getSuggestions(inputStr: string): string[] {
		const inputLower = inputStr.toLowerCase();
		return this.folders.filter(folder =>
			folder.toLowerCase().includes(inputLower)
		);
	}

	/**
	 * 渲染单个建议项
	 * @param folder - 文件夹路径
	 * @param el - 建议项的 DOM 元素
	 */
	renderSuggestion(folder: string, el: HTMLElement): void {
		el.createEl("div", { text: folder });
	}

	/**
	 * 选择建议项时的处理
	 * 将选中的文件夹路径填入输入框并关闭建议列表
	 * @param folder - 选中的文件夹路径
	 * @param evt - 鼠标或键盘事件
	 */
	selectSuggestion(folder: string, evt: MouseEvent | KeyboardEvent): void {
		this.setValue(folder);
		this.close();
	}
}
