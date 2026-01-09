import {Plugin, TFolder} from 'obsidian';
import {DEFAULT_SETTINGS, FolderFoldSettingTab, MyPluginSettings} from "./settings";

declare module 'obsidian' {
	interface App {
		commands: {
			commands: { [commandId: string]: { id: string, name: string, callback: () => void } }
			executeCommandById(commandId: string): boolean
		}
	}
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new FolderFoldSettingTab(this.app, this));

		this.registerEvent(this.app.workspace.on('file-open', this.handleFileOpen.bind(this)));
	}

	foldProperties() {
		const currentLeaf = document.querySelector('.workspace-leaf.mod-active');
		if (currentLeaf) {
			const propertiesAreFolded = currentLeaf.querySelector('.metadata-container.is-collapsed');
			if (!propertiesAreFolded) {
				this.app.commands.executeCommandById('editor:toggle-fold-properties');
			}
		}
	}

	shouldFoldProperties(filePath: string): boolean {
		for (const folderPath of this.settings.foldersToCollapse) {
			if (!folderPath) {
				continue;
			}
			if (filePath.startsWith(folderPath + '/')) {
				return true;
			}
		}
		return false;
	}

	handleFileOpen(file: any) {
		if (!file) {
			return;
		}
		if (!file.extension || file.extension !== 'md') {
			return;
		}
		if (this.shouldFoldProperties(file.path)) {
			setTimeout(() => this.foldProperties(), 100);
		}
	}

	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
