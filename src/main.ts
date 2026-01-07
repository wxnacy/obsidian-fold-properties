import {Plugin, TFolder} from 'obsidian';
import {DEFAULT_SETTINGS, FolderFoldSettingTab, MyPluginSettings} from "./settings";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	private foldTimer: number | null = null;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new FolderFoldSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			this.foldConfiguredFolders();
			this.registerEvent(this.app.vault.on('create', this.scheduleFold));
			this.registerEvent(this.app.vault.on('rename', this.scheduleFold));
			this.registerEvent(this.app.vault.on('delete', this.scheduleFold));
			this.registerEvent(this.app.workspace.on('file-open', this.scheduleFold));
		});
	}

	onunload() {
		if (this.foldTimer !== null) {
			window.clearTimeout(this.foldTimer);
		}
	}

	scheduleFold = () => {
		if (this.foldTimer !== null) {
			window.clearTimeout(this.foldTimer);
		}
		this.foldTimer = window.setTimeout(() => {
			this.foldTimer = null;
			this.foldConfiguredFolders();
		}, 200);
	};

	foldConfiguredFolders = () => {
		const fileExplorerLeaves = this.app.workspace.getLeavesOfType('file-explorer');
		if (!fileExplorerLeaves.length) {
			return;
		}

		const fileExplorerLeaf = fileExplorerLeaves[0];
		if (!fileExplorerLeaf) {
			return;
		}

		const fileExplorer = fileExplorerLeaf.view as any;
		if (!fileExplorer || !fileExplorer.fileItems) {
			return;
		}

		for (const path of this.settings.foldersToCollapse) {
			if (!path) {
				continue;
			}
			const abstractFile = this.app.vault.getAbstractFileByPath(path);
			if (!(abstractFile instanceof TFolder)) {
				continue;
			}

			const item = fileExplorer.fileItems[abstractFile.path];
			if (!item) {
				continue;
			}

			if (typeof fileExplorer.setCollapsed === 'function') {
				fileExplorer.setCollapsed(item, true);
			} else if (typeof item.setCollapsed === 'function') {
				item.setCollapsed(true);
			} else if (typeof fileExplorer.collapseItem === 'function') {
				fileExplorer.collapseItem(item, true);
			}
		}
	};

	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
