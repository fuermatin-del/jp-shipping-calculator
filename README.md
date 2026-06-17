# Amazon Japan 邮件模板助手

这是一个可直接发布到 GitHub Pages 的静态网页，支持 PC 和手机浏览器打开。

## 文件说明

- `index.html`：网页入口
- `styles.css`：页面样式，包含 PC 和移动端布局
- `app.js`：搜索、筛选、变量替换、复制、导入导出功能
- `templates.js`：内置 52 条 Amazon 日本站客服邮件模板
- `.nojekyll`：让 GitHub Pages 按普通静态网页发布

## 上传到 GitHub

1. 登录 GitHub，点击右上角 `+`，选择 `New repository`。
2. 仓库名可以填写：`amazon-jp-mail-helper`。
3. 建议先选择 `Public`，这样 GitHub Pages 免费可用。
4. 创建仓库后，点击 `uploading an existing file` 或 `Add file` -> `Upload files`。
5. 打开本文件夹，选择里面的所有文件上传到仓库根目录。
6. 注意：上传的是本文件夹里面的文件，不是把整个文件夹作为一个子文件夹上传。

## 开启 GitHub Pages

1. 进入仓库页面，点击 `Settings`。
2. 左侧点击 `Pages`。
3. `Build and deployment` 选择 `Deploy from a branch`。
4. `Branch` 选择 `main`，文件夹选择 `/root`。
5. 点击 `Save`。
6. 等待 1-3 分钟，GitHub 会生成访问链接。

网站地址通常是：

```text
https://你的GitHub用户名.github.io/amazon-jp-mail-helper/
```

## 使用方式

打开网站后，可以粘贴买家消息，让页面根据内置历史话术自动匹配合适模板；也可以手动按关键词搜索模板。填写买家称呼、部品名、返金金额、配送公司、追踪号等变量后，点击“复制回复”即可。

买家称呼支持自动补敬语后缀。例如输入 `山田`，日文回复里会自动显示为 `山田様`；不填写时默认使用 `お客様`。

模板支持在浏览器内导入/导出 JSON。导入的数据只会保存在当前浏览器本地，不会上传到服务器。

## 隐私提醒

本发布包不包含原始聊天记录、Word 文档、渲染图片或构建脚本。发布到 GitHub 时，只需要上传这个文件夹里的文件。

如果以后要更新模板，只需要替换 `templates.js`，或者在网页里使用“导入”功能临时导入新版 JSON。
