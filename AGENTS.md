# Obsidian community plugin

## Project overview

- 目标：Obsidian 插件可以实现文件夹折叠(TypeScript → bundled JavaScript).
- 项目灵感来源：https://github.com/tbergeron/obsidian-fold-properties-by-default（如果地址访问不同，也可以查看 obsidian-fold-properties-by-default.ts），但是这个项目没有实现文件夹折叠的功能，所以这个项目是基于这个项目开发的。

## 项目结构:
  - `src/main.ts`：主文件
  - `src/settings.ts`：设置文件

## 功能需求

- [x] 配置页面增加文件夹折叠的设置，名称为 `需要折叠的文件夹`，有一个增加按钮，每次点击增加按钮后，都增加一行设置，输入文件夹路径，检测文件夹是否存在，如果不存在，弹出提示框，提示文件夹不存在。如果存在，将文件夹路径添加到 `需要折叠的文件夹` 列表中。每行后面有一个删除按钮，点击删除按钮后，将该行从列表中删除。
- [x] 根据设置中的 `需要折叠的文件夹` 列表，对文件夹进行折叠。折叠方法使用项目灵感来源中的项目。
- [x] 输入框长度增加，填充行剩余空间
- [x] 输入框支持搜索 Obsidian 文件夹，支持自动补全 


### Install

```bash
npm install
```

### Dev (watch)

```bash
npm run dev
```

### Production build

```bash
npm run build
```
