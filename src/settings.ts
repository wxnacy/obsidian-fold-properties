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
			const setting = new Setting(containerEl).addText((text) => {
				text
					.setPlaceholder('例如：Folder/Subfolder')
					.setValue(path)
					.onChange((value) => {
						draftValue = value;
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
}
