# 离线划词 Chrome 扩展（源码）

本仓库提供 Chrome 扩展源码和 ECDICT 转换脚本，**不包含词库数据**。克隆后需自行获取 ECDICT 并在本机生成 `data/`，才能使用离线查词。项目也支持使用 Chrome 内置 Translator API 进行英汉双向句子翻译；语言包由 Chrome 首次下载。

## 本机准备词库

需要 Python 3.8+。从 [ECDICT 官方仓库](https://github.com/skywind3000/ECDICT) 获取 `ecdict.csv`，然后在项目根目录执行：

```sh
python3 tools/prepare_dictionary.py --csv /path/to/ecdict.csv
```

也可以明确让脚本从 ECDICT 官方仓库下载并转换：

```sh
python3 tools/prepare_dictionary.py --download
```

脚本用 Python 标准库解析 CSV，生成分片 JSON、词形索引和校验清单。生成的 `data/` 与下载缓存 `.cache/` 均被 `.gitignore` 排除。**不要将 `data/`、原始 CSV 或含词库的扩展打包文件上传到本仓库。** 当前脚本读取 ECDICT 的 `master` 分支，数据随上游更新可能变化；生成的 `data/manifest.json` 记录源 CSV 的内容哈希前 16 位。

## 在 Chrome 中加载

打开 `chrome://extensions`，启用开发者模式，选择「加载已解压的扩展程序」，选中本项目根目录。点击扩展图标，在「更多设置 / 词库管理」中首次导入生成的词库。安装或重新加载后刷新已打开的网页。

在工具栏快捷面板中，可把当前网站加入白名单、限时或永久黑名单，或调整浮层位置。句子翻译首次使用需要在面板中分别准备英中或中英模型；准备完成后可关闭面板。浏览器内部页、Chrome 应用商店和内置 PDF 阅读器不支持内容脚本划词。

## 数据与许可

词库来源为 [ECDICT](https://github.com/skywind3000/ECDICT)，其仓库标注 MIT 许可；原文见 [ECDICT-LICENSE.txt](ECDICT-LICENSE.txt)。ECDICT 说明词条汇集自多种资料，公开再分发词条前应自行核查上游数据权利。本源码仓库不包含该数据。Chrome Translator 模型由浏览器提供，不在本仓库分发。

本项目源码尚未另行指定开源许可证；公开仓库不自动授予他人复制、修改或再分发代码的许可。如希望别人能够合法复用代码，应在发布前自行选择并添加适合的项目许可证。项目名称、图标与商店文案应与其他扩展区分。

## 状态

本项目仍是原型。最近的功能改动未经过完整浏览器验证。词库相关的早期验证记录位于原开发目录，本公开源码目录不附带该记录。
