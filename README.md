# 📈 沉浸式盯盘助手 (Stock Monitor)

专为程序员打造的 VS Code 极简股票监控插件。在底部状态栏隐蔽盯盘，支持智能异动告警和自定义刷新频率，让你在沉浸于代码心流的同时，也能时刻掌控华尔街的脉搏！🚀

## ✨ 核心特性 (Features)

* 👀 **极简隐蔽，沉浸摸鱼**：仅在 VS Code 右下角状态栏占据极小的一块空间，红涨绿跌，极致护眼，老板路过也绝对看不出破绽。
* 🔄 **多端市场，一键切换**：支持配置多只 A股、港股、美股。点击状态栏即可唤起高颜值下拉菜单，所有关注的股票行情一目了然，点击无缝切换主显股票。
* 🚨 **智能异动告警**：支持自定义涨跌幅阈值。当行情出现暴涨或暴跌触及阈值时，自动弹出系统级通知，防打扰机制确保同一股票当天不重复轰炸。
* ⏱️ **自定义极速刷新**：支持自定义数据轮询频率。内置 API 防封禁兜底机制（强制最低 3 秒），在保证账号与 IP 安全的前提下，享受毫秒级的极致盯盘体验。

---

## ⚙️ 插件配置 (Extension Settings)

本插件提供以下配置项，你可以通过 `Ctrl + ,` (Windows/Linux) 或 `Cmd + ,` (Mac) 打开设置页面，搜索 `stock-monitor-minimalist` 进行修改：

| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `stock-monitor-minimalist.stocks` | `Array` | `["sh000001", "hk00700"]` | **你要监控的股票代码列表**。<br>• A股需加前缀：`sh` (上交所), `sz` (深交所)<br>• 港股加前缀：`hk`<br>• 美股加前缀：`us` |
| `stock-monitor-minimalist.alertThreshold` | `Number` | `5.0` | **涨跌幅预警阈值 (%)**。<br>例如设为 `3`，则涨幅或跌幅超过 3% 时会弹窗警告。设为 `0` 可完全关闭预警弹窗。 |
| `stock-monitor-minimalist.updateInterval` | `Number` | `5000` | **数据刷新频率 (毫秒)**。<br>默认 5000 毫秒 (5秒)。为防止触发接口防刷机制被封 IP，底层强制最低限制为 3000 毫秒。 |

### 💡 配置示例 (在 `settings.json` 中配置)

```json
{
    "stock-monitor-minimalist.stocks": [
        "sh000001",   // 上证指数
        "sz002594",   // 比亚迪 (A股)
        "hk00700",    // 腾讯控股 (港股)
        "usTSLA"      // 特斯拉 (美股)
    ],
    "stock-monitor-minimalist.alertThreshold": 3.5,
    "stock-monitor-minimalist.updateInterval": 3000
}
