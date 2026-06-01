# dnakov/litter 中文 README 贡献草稿

> 适合 GitHub 新手的说明：这个文件不是 `dnakov/litter` 仓库里的正式文档，而是一份可以复制到 fork 后的 `README.zh-CN.md` 的中文草稿和提交流程清单。内容基于 `dnakov/litter` 在 2026-06-01 可见的 README / CONTRIBUTING 信息整理。

## 这个项目是什么？

`dnakov/litter` 是一个给 Codex 使用的原生移动端客户端：它包含 iOS 和 Android App，可以连接本地或远程服务器，在手机上管理会话并运行 agentic coding 工作流。

从仓库结构看，它不是单纯的网页前端，而是一个跨平台移动端项目：

- `apps/ios/`：iOS App，使用 Litter scheme，`project.yml` 是 Xcode 项目的源头配置。
- `apps/android/`：Android App，使用 Compose UI 和 Gradle 构建。
- `shared/rust-bridge/`：iOS / Android 共用的 Rust 客户端核心与 UniFFI 绑定。
- `shared/third_party/codex/`：上游 Codex 子模块。
- `patches/codex/`：构建时应用到本地 Codex 的补丁集。
- `tools/scripts/`：跨平台辅助脚本。

简单说：它更像“把 Codex 搬到手机上的原生 App 壳 + 共享 Rust 核心”，不是一个可以直接嵌到任意网页里的 UI 组件库。

## 可以把自己的 agent UI / 跳跳形象和它缝合吗？

可以，但要分清三种情况：

1. **自己 fork 后改着玩 / 自用**  
   可以改 iOS 或 Android 的界面、图标、插画、主题色、欢迎页、空状态等，把“跳跳”形象做成你自己的本地版本。因为 Litter 是移动端 App，你需要分别看 Swift / Kotlin Compose 相关 UI，而不是只改一个网页文件。

2. **想合进作者的上游仓库**  
   直接把个人 mascot 或大范围 UI 改造提交上去，合并概率通常不高。项目的 CONTRIBUTING 明确偏好“小而聚焦”的 PR，并提醒大重构、新功能或纯风格改动很容易和维护者正在做的事情冲突。

3. **更适合上游的贡献方向**  
   中文 README、文档修正、安装步骤补充、错别字修复、截图说明补充这类改动更小、更清晰，也更适合作为第一次开源贡献。

如果目标是“第一次为开源做贡献”，建议先提交中文 README；等熟悉项目后，再考虑开 issue 询问作者是否愿意接受主题、品牌资源替换或可插拔 mascot 之类的功能。

## 建议提交给上游的文件名

推荐文件名：

```text
README.zh-CN.md
```

如果作者更喜欢把翻译放进 `docs/`，也可以按维护者意见改成：

```text
docs/README.zh-CN.md
```

第一次 PR 尽量只添加这一个文件，不要顺手改代码、格式化、换图或调整目录结构。

## 可直接提交的中文 README 草稿

下面这段可以复制成 `README.zh-CN.md`：

````markdown
# litter

`litter` 是 Codex 的原生 iOS + Android 客户端。它可以连接本地或远程服务器，管理会话，并让你在手机上运行 agentic coding 工作流。

## 截图（iOS）

请参考英文 README 中的截图：Home、Remote servers、Generative UI、Realtime voice。

## 快速开始

```bash
make ios-device-fast        # 快速构建设备版 iOS App
make ios-sim-fast           # 快速构建 iOS 模拟器版本
make android-emulator-fast  # 快速构建 Android 模拟器版本
```

### 全新检出后的准备工作

如果你刚在 Xcode 中配对了一块新的 Apple Watch（Window → Devices and Simulators），请先运行一次：

```bash
make watch-register
```

这个命令会把手表 UDID 注册到 Apple Developer Portal，并刷新 provisioning profile。否则，`xcodebuild` 可能构建成功，但 `devicectl ... install app` 会因为 “App could not be installed at this time” 而安装失败。

该 target 是幂等的：它会按 UDID 在 `.build-stamps/` 下写入标记，所以重复运行通常不会产生额外影响，除非你又配对了一块新的手表。如果自动发现失败，可以通过 `WATCH_UDID=<udid>` 指定设备。

更多前置条件、完整构建选项、TestFlight / App Store 发布流程和 SSH 设置，请查看 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)。

## 仓库结构

```text
apps/ios/                  iOS App（Litter scheme，project.yml 是源头配置）
apps/android/              Android App（Compose UI，Gradle 构建）
shared/rust-bridge/
  codex-mobile-client/     共享 Rust 客户端 crate + UniFFI 接口（iOS 和 Android 共用）
  codex-ios-audio/         仅 iOS 使用的音频 / AEC crate
shared/third_party/codex/  上游 Codex 子模块
patches/codex/             构建时应用的本地 Codex 补丁集
tools/scripts/             跨平台辅助脚本
```

## 架构

两个平台通过 UniFFI 生成的绑定共用同一个 Rust 核心（`codex-mobile-client`）。Swift / Kotlin 平台代码保持轻量，主要负责 UI、权限、通知和平台 API。会话状态、流式输出、水合、发现与认证逻辑都位于 Rust 侧。

## 参与贡献

Litter 正在活跃开发中，很多功能仍在快速变化。欢迎提交 PR，但更可能被合并的是“小而聚焦、解决明确问题”的改动。大范围重构和新功能通常容易和维护者正在进行的工作冲突。

在提交 PR 前，请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

Litter 使用 GNU General Public License version 3 授权，并根据 GPLv3 第 7 节增加了允许通过 Apple App Store 和 Google Play 分发的额外许可。详情请查看 [LICENSE](LICENSE)。

## Make Targets

| Target | 说明 |
|---|---|
| `make ios-device-fast` | 快速构建设备版 iOS App（raw staticlib） |
| `make ios-sim-fast` | 快速构建 iOS 模拟器版本 |
| `make ios` | 完整 iOS package 流程（device + sim + xcframework） |
| `make android-emulator-fast` | 快速构建 Android 模拟器版本 |
| `make android` | 完整 Android pipeline |
| `make rust-check` | 对共享 Rust crate 运行 host `cargo check` |
| `make rust-test` | 对共享 Rust crate 运行 host `cargo test` |
| `make bindings` | 重新生成 UniFFI Swift + Kotlin 绑定 |
| `make xcgen` | 根据 `project.yml` 重新生成 Xcode 项目 |
| `make watch-register` | 注册新配对的 Apple Watch（幂等） |
| `make clean` | 删除所有构建产物 |
````

## 给 GitHub 新手的提交流程

1. 登录 GitHub，打开 `https://github.com/dnakov/litter`。
2. 点击右上角 **Fork**，把项目复制到你自己的账号下。
3. 进入你 fork 后的仓库，点击 **Add file → Create new file**。
4. 文件名填写 `README.zh-CN.md`。
5. 粘贴上面的中文 README 草稿。
6. Commit message 可以写：

   ```text
   Add Simplified Chinese README
   ```

7. 提交到你自己的 fork 后，GitHub 通常会提示 **Contribute → Open pull request**。
8. PR 标题建议写：

   ```text
   Add Simplified Chinese README
   ```

9. PR 描述建议写：

   ```markdown
   ## Summary
   - Add a Simplified Chinese translation of the README as `README.zh-CN.md`.
   - Keep the translation focused on the existing README content without changing code or project behavior.

   ## Notes
   - This is a documentation-only contribution.
   - Happy to move the file under `docs/` or adjust wording if maintainers prefer a different structure.
   ```

10. 提交后等作者或维护者反馈。如果对方要求修改，不要紧张，按评论改完再 push 到同一个分支即可。

## 第一次贡献的小建议

- 先不要改作者的英文 README，避免维护者担心主文档结构被打乱。
- 不要同时提交 UI、图片、代码和翻译；第一次 PR 越小越好。
- 如果想做“跳跳”形象，建议另开 issue 先问：项目是否接受自定义主题、可替换 mascot 或 branding hook。
- 如果只是自己使用，可以在 fork 里随便改；如果要合进上游，就尽量尊重项目定位和维护者的接受范围。
