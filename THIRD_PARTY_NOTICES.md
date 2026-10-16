# Third-party notices

Mihua Blocks 自有源码采用 Apache-2.0。以下第三方代码、素材和依赖保留原有授权；本项目的许可证不替代第三方授权。

## 改写进本仓库的代码和素材

| 内容 | 来源 | 授权 / 保留声明 |
|---|---|---|
| shadcn/ui 组件源码（button、input、checkbox、select、switch、tabs、sidebar、breadcrumb、dropdown-menu、avatar、badge、table、pagination、calendar、popover、dialog、radio-group、textarea 等，以及「数据表格」「日期范围」示例的写法），已为 Mihua 控件接口和控件规格调整 | https://ui.shadcn.com | MIT，`licenses/shadcn-ui.txt` |
| Lucide 图标的路径数据（`spec/src/icons.ts` 里 lucide 一套，摘自 lucide-react 0.523.0） | https://lucide.dev | ISC（含上游 Feather 的 MIT 声明），`licenses/lucide.txt` |

## 套件接的组件库（npm 依赖，没有改写进本仓库）

| 包 | 版本 | 授权 | 保留声明 |
|---|---|---|---|
| antd（Ant Design） | 6.6.5 | MIT | `licenses/ant-design.txt` |
| @ant-design/icons | 6.3.4 | MIT | 同上（Ant Design 项目） |
| @arco-design/web-react（Arco Design） | 2.66.16 | MIT | `licenses/arco-design.txt` |
| element-plus（Element Plus） | 2.14.6 | MIT | `licenses/element-plus.txt` |
| @element-plus/icons-vue | 2.3.2 | MIT | 同上（Element Plus 项目） |
| tdesign-vue-next（TDesign） | 1.20.9 | MIT | `licenses/tdesign.txt` |
| tdesign-icons-vue-next | 0.4.11 | MIT | 同上（TDesign 项目） |
| radix-ui（shadcn/ui 的交互原语） | 1.4.3 | MIT | 包内 LICENSE |
| @tanstack/react-table（shadcn 表格的逻辑） | 8.21.3 | MIT | 包内 LICENSE |
| react-day-picker（shadcn 日期面板），及其依赖 date-fns | 9.14.0 / 4.x | MIT | 包内 LICENSE |
| lucide-react | 0.523.0 | ISC | `licenses/lucide.txt` |
| class-variance-authority | 0.7.1 | Apache-2.0 | 包内 LICENSE |
| clsx、tailwind-merge | 2.1.1、3.5.0 | MIT | 包内 LICENSE |
| dayjs（日期面板的中文语言包） | 1.11.x | MIT | 包内 LICENSE |

## 其他运行和构建依赖

React、React DOM、Vue、Zod（MIT），Tailwind CSS、Vite、TypeScript、Vitest 等构建和测试工具：版本由 `package-lock.json` 固定，各包的 LICENSE 随 npm 安装提供。

## 其他说明

- 微信与 Google 标识仅用于标识相应第三方登录入口；相关名称和商标属于各自权利人，不在本项目 Apache-2.0 授权范围内，也不表示官方合作或背书。正式接入应遵守相应平台品牌与认证要求。
- Ant Design、Arco Design、Element Plus、TDesign、shadcn/ui 是各自项目的名称，本项目和它们没有隶属或合作关系。
- 网页文字版（`site/`）里的 Claude、Codex 图标仅用于标识对应的 AI 编程工具；相关名称和商标属于各自权利人，不在本项目 Apache-2.0 授权范围内，也不表示官方合作或背书。
- 演示数据（客户、公司名、手机号、人名）由固定种子的伪随机数生成，不含真实客户数据；没有第三方在线图片依赖。
