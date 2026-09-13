# 🧭 Clash 节点实时雷达 (Clash Node Radar)

<div align="center">

![Clash Node Radar](icons/icon128.png)

### 网页走到哪，节点看到哪！
**一款轻量级 Chrome / Edge 扩展插件，实时查看当前网页挂在哪个 Clash / Mihomo 节点，或走本地直连。**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest](https://img.shields.io/badge/Manifest-V3-success.svg)](manifest.json)
[![Platform](https://img.shields.io/badge/Platform-Chrome%20%7C%20Edge%20%7C%20Brave-orange.svg)](#)

</div>

---

## 🧐 为什么开发这个插件？

当你使用 Clash / Mihomo / Sing-box 的规则分流或 TUN 模式时，经常会遇到这些疑问：
- 🔍 **“我当前打开的网站到底有没有走代理？”**
- 🌍 **“这个网站走的是香港、台湾、日本还是美国节点？会不会走错节点导致 ChatGPT / Claude 报错？”**
- 💰 **“我下载的这个大文件到底有没有偷跑我的 10x 高倍率节点流量？”**

以往想要看去向，必须**切出浏览器 ➔ 打开 Clash Verge 窗口 ➔ 点开连接面板 ➔ 在几百条记录里手动搜域名**，极度繁琐！

**「Clash 节点实时雷达」将分流检测直接搬到浏览器里**，无需切换窗口，一眼看清当前网页的真实出站链路。

---

## ✨ 核心特性

1. **角标一眼知去向（不用点击任何按钮）**：
   * 浏览器右上角的插件图标直接显示动态地区缩写：
     * 🟢 `TW`：台湾节点（适合 Codex、Google AI、Gemini）
     * ⚪ `直`：国内网站本地直连（0 代理流量消耗）
     * 🔵 `HK` / 🌸 `JP` / 🟣 `US` / 🔷 `SG` 等各地区节点缩写
2. **网页微型悬浮胶囊 (HUD)**：
   * 网页右下角常驻半透明磨砂胶囊（如 `🟢 🇹🇼 台湾hinet` 或 `⚡ 直连 DIRECT`）。
   * 悬停即可展开查看：**域名、匹配分流规则、实时下载/上传流量**。
   * 支持一键关闭当前胶囊，或在设置里一键停用。
3. **点击弹窗详情面板**：
   * 点击扩展图标，秒出当前标签页的完整出站链路与网络传输数据。
4. **零配置智能自适应**：
   * 自动探测 Mihomo / Clash Verge 核心控制器（端口 9097 / 9090），开箱即用。
5. **轻量纯净**：
   * 原生 Manifest V3 开发，无庞大前端框架，代码仅数十 KB，内存占用微乎其微。

---

## 🚀 10 秒快速安装教程

> 支持 **Google Chrome**、**Microsoft Edge**、**Brave** 等所有 Chromium 内核浏览器。

1. **下载本项目源码**：
   * 点击右上角绿色按钮 `Code` ➔ `Download ZIP` 下载解压，或使用 Git 克隆：
     ```bash
     git clone https://github.com/devonsagr/clash-node-radar.git
     ```
2. **打开浏览器扩展管理页面**：
   * **Chrome 浏览器**：在地址栏输入 `chrome://extensions` 并回车；
   * **Edge 浏览器**：在地址栏输入 `edge://extensions` 并回车。
3. **启用开发者模式**：
   * 将右上角的 **「开发者模式 (Developer mode)」** 开关打开。
4. **加载插件**：
   * 点击左上角出现的 **「加载已解压的扩展程序 (Load unpacked)」** 按钮；
   * 在弹出的文件夹选择框中，选择你刚刚解压或克隆的文件夹根目录；
5. **固定到工具栏**：
   * 点击浏览器右上角拼图图标 🧩，找到 **「Clash 节点实时雷达」**，点击图钉 📌 固定在工具栏上，安装完成！

---

## ⚙️ Clash 客户端配置与连接说明

插件默认会自动连接本机的 Clash RESTful API（`http://127.0.0.1:9097` 或 `9090`）。

### 各客户端通用端口对照表：

| 客户端名称 | 默认端口 | 默认密钥 (Secret) | 备注 |
| :--- | :--- | :--- | :--- |
| **Clash Verge / Verge Rev** | `9097` (或 `9090`) | 通常为空或自定义 | 在设置 ➔ 扩展配置查看 |
| **Mihomo Party** | `9090` | 通常为空 | 默认开启外部控制器 |
| **Clash for Windows (CFW)** | `9090` | 留空 | 设置 ➔ General ➔ External Controller |
| **Flclash** | `9090` | 留空 | 外部控制器开启状态 |

> **提示**：如果你的客户端设置了访问密钥（Secret），只需点击插件右上角的 **⚙️ 设置**，填入你的密钥并点击“保存并测试连接”即可！

---

## 🛠️ 常见问题 (FAQ)

### Q: 为什么点击显示“未连接”或无法获取数据？
1. 请确保你的 Clash / Mihomo 客户端已经启动运行；
2. 点击插件弹窗右上角的 **⚙️ 设置**，检查端口是否与你的 Clash 客户端设置一致（常见端口为 `9097` 或 `9090`）；
3. 若你的 Clash 开启了访问密码，请在设置中填入对应的 Secret 密钥。

### Q: 不喜欢网页右下角的悬浮胶囊怎么办？
* 点击右上角插件图标，取消勾选底部的 **「页面右下角悬浮球」**，胶囊即刻隐藏，只保留顶部的浏览器角标提示。

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源，欢迎提交 Issue 与 Pull Request。
