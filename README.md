# 抖音小游戏：找不同初版

这是一个原生抖音小游戏 Canvas 框架，用来先跑通“两张图找不同”的核心玩法。

## 项目结构

- `game.js`：小游戏入口。
- `game.json`：小游戏竖屏配置。
- `project.config.json`：抖音开发者工具导入配置。
- `src/`：游戏状态、关卡、输入、渲染、平台适配。
- `assets/`：首版卡通占位关卡图。
- `tools/generate-assets.js`：重新生成占位图。

## 本地检查

```bash
npm run generate:assets
npm run check
```

## 在抖音开发者工具中运行

1. 打开抖音开发者工具。
2. 选择导入项目，目录选择当前仓库。
3. 类型选择小游戏，`appid` 可先使用测试号或替换为你自己的 AppID。
4. 编译运行后，点击两张图中的差异点，找完全部差异后会出现通关弹层。

## 替换正式关卡

把正式图片放到 `assets/`，然后在 `src/levels.js` 中新增或替换：

```js
{
  id: 'level-1',
  name: '森林小屋',
  leftImage: 'assets/level1-left.png',
  rightImage: 'assets/level1-right.png',
  width: 640,
  height: 400,
  diffs: [
    { id: 'sun', x: 84, y: 72, radius: 34 }
  ]
}
```

`x`、`y`、`radius` 都使用原图像素坐标。
