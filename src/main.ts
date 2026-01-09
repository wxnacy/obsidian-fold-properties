import {Plugin} from 'obsidian';
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

	/**
	 * 插件加载时调用
	 * 加载设置、注册设置标签页、注册文件打开事件监听器
	 */
	async onload() {
		await this.loadSettings();
		this.addSettingTab(new FolderFoldSettingTab(this.app, this));
		this.registerEvent(this.app.workspace.on('file-open', this.handleFileOpen.bind(this)));
	}

	/**
	 * 折叠当前活动窗口的文件属性
	 * 通过执行 Obsidian 内置命令 'editor:toggle-fold-properties' 来实现
	 */
	foldProperties() {
		const currentLeaf = document.querySelector('.workspace-leaf.mod-active');
		if (currentLeaf) {
			const propertiesAreFolded = currentLeaf.querySelector('.metadata-container.is-collapsed');
			if (!propertiesAreFolded) {
				this.app.commands.executeCommandById('editor:toggle-fold-properties');
			}
		}
	}

	/**
	 * 判断指定路径的文件是否需要折叠属性
	 * @param filePath - 文件路径
	 * @returns 如果文件在配置的文件夹列表中，返回 true；否则返回 false
	 */
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

	/**
	 * 处理文件打开事件
	 * 当文件打开时，检查是否需要折叠属性
	 * @param file - 打开的文件对象
	 */
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

	/**
	 * 加载插件设置
	 * 从磁盘读取 data.json 文件
	 */
	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
	}

	/**
	 * 保存插件设置
	 * 将设置写入磁盘的 data.json 文件
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
