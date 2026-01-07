import {App, Notice, PluginSettingTab, Setting, TFolder} from "obsidian";
import MyPlugin from "./main";

export interface MyPluginSettings {
	foldersToCollapse: string[];
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	foldersToCollapse: []
}

export class FolderFoldSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('需要折叠的文件夹')
			.setDesc('添加需要在文件资源管理器中自动折叠的文件夹。')
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
						this.updateFolderDatalist(setting, text.inputEl, value, index);
					});

				text.inputEl.addClass('folders-to-collapse-input');
				text.inputEl.style.flex = '1 1 auto';
				text.inputEl.style.width = '100%';
				text.inputEl.style.minWidth = '0';

				text.inputEl.addEventListener('focus', () => {
					this.updateFolderDatalist(setting, text.inputEl, text.inputEl.value, index);
				});

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
					this.plugin.foldConfiguredFolders();
				});

				this.updateFolderDatalist(setting, text.inputEl, path, index);
			});

			setting.addExtraButton((button) => {
				button
					.setIcon('trash')
					.setTooltip('删除')
					.onClick(async () => {
						this.plugin.settings.foldersToCollapse.splice(index, 1);
						await this.plugin.saveSettings();
						this.display();
						this.plugin.foldConfiguredFolders();
					});
			});
		});
	}

	private folderCache: string[] | null = null;

	private updateFolderDatalist(setting: Setting, inputEl: HTMLInputElement, query: string, index: number) {
		const datalistId = `folders-to-collapse-${index}`;
		let datalist = setting.controlEl.querySelector(`datalist[data-folder-index="${index}"]`) as HTMLDataListElement | null;
		if (!datalist) {
			datalist = document.createElement('datalist');
			datalist.id = datalistId;
			datalist.dataset.folderIndex = String(index);
			setting.controlEl.appendChild(datalist);
			inputEl.setAttribute('list', datalistId);
		}

		const folders = this.getAllFolders();
		const normalized = query.trim().toLowerCase();
		const suggestions = normalized
			? folders.filter((folderPath) => folderPath.toLowerCase().includes(normalized))
			: folders;
		const limited = suggestions.slice(0, 50);

		datalist.innerHTML = '';
		for (const folderPath of limited) {
			const option = document.createElement('option');
			option.value = folderPath;
			datalist.appendChild(option);
		}
	}

	private getAllFolders(): string[] {
		if (this.folderCache) {
			return this.folderCache;
		}

		const folders: string[] = [];
		const root = this.app.vault.getRoot();
		const walk = (folder: TFolder) => {
			if (folder.path) {
				folders.push(folder.path);
			}
			for (const child of folder.children) {
				if (child instanceof TFolder) {
					walk(child);
				}
			}
		};

		walk(root);
		this.folderCache = folders;
		return folders;
	}
}
