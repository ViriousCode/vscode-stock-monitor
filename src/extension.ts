import * as vscode from 'vscode';

// ==========================================
// 全局状态管理 (股票与预警版)
// ==========================================
let myStatusBarItem: vscode.StatusBarItem;
let monitorInterval: NodeJS.Timeout | undefined;
let currentStockIndex = 0;

interface IStockData { name: string; price: string; percent: string; isUp: boolean; }
let stockDataCache: Record<string, IStockData> = {};

// 🚨 新增：防打扰机制，记录已经弹过窗的股票
let alertedStocks: Set<string> = new Set();

// ==========================================
// 插件激活入口
// ==========================================
export function activate(context: vscode.ExtensionContext) {
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	context.subscriptions.push(myStatusBarItem);

	const clickStockCommandId = 'stock-monitor-minimalist.selectStock';
	context.subscriptions.push(vscode.commands.registerCommand(clickStockCommandId, async () => {
		const config = vscode.workspace.getConfiguration('stock-monitor-minimalist');
		const stocks: string[] = config.get('stocks') || [];

		if (stocks.length === 0) {
			vscode.window.showWarningMessage('请先在设置中配置 stock-monitor-minimalist.stocks');
			return;
		}

		const options = stocks.map((code, index) => {
			const data = stockDataCache[code];
			const isSelected = index === currentStockIndex;
			return {
				label: `${isSelected ? '$(check) ' : ''}${data ? data.name : code}`,
				description: data ? ` ${data.price} (${data.isUp ? '+' : ''}${data.percent}%)` : '获取中...',
				index: index
			};
		});

		const selected = await vscode.window.showQuickPick(options, { placeHolder: '请选择 📈', ignoreFocusOut: true });
		if (selected) {
			currentStockIndex = selected.index;
			renderStatusBar(stocks);
		}
	}));

	myStatusBarItem.command = clickStockCommandId;

	updateStockSettings();

	// 监听设置变化
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('stock-monitor-minimalist.stocks') ||
			e.affectsConfiguration('stock-monitor-minimalist.alertThreshold') ||
			e.affectsConfiguration('stock-monitor-minimalist.updateInterval')) {
			updateStockSettings();
		}
	}));
}

// ==========================================
// 股票监控与预警核心逻辑
// ==========================================
function updateStockSettings() {
	if (monitorInterval) {
		clearInterval(monitorInterval);
	}

	const config = vscode.workspace.getConfiguration('stock-monitor-minimalist');
	const stocks: string[] = config.get('stocks') || [];

	if (stocks.length === 0) {
		myStatusBarItem.text = `$(gear) 点击配置盯盘`;
		myStatusBarItem.tooltip = "您还没配置股票代码，请前往设置添加";
		myStatusBarItem.color = '#faad14'; // 警告黄
		myStatusBarItem.show();
		return;
	}

	if (currentStockIndex >= stocks.length) {
		currentStockIndex = 0;
	}

	myStatusBarItem.text = `$(sync~spin) 数据拉取中...`;
	myStatusBarItem.color = undefined;
	myStatusBarItem.show();
	startMonitoring(stocks);
}

function startMonitoring(stocks: string[]) {
	const apiUrl = `https://qt.gtimg.cn/q=${stocks.join(',')}`;

	const fetchStockData = async () => {
		try {
			// 每次请求时动态获取最新的预警阈值
			const config = vscode.workspace.getConfiguration('stock-monitor-minimalist');
			const alertThreshold = config.get<number>('alertThreshold') || 5.0;

			const response = await fetch(apiUrl);
			const buffer = await response.arrayBuffer();
			const text = new TextDecoder('gbk').decode(buffer);
			const lines = text.split('\n').filter(line => line.trim() !== '');

			lines.forEach((line, index) => {
				const dataArr = line.split('~');
				if (dataArr.length > 30) {
					const code = stocks[index];
					const name = dataArr[1];
					const percentStr = dataArr[32];
					const percentFloat = parseFloat(percentStr);
					const isUp = percentFloat >= 0;

					// 1. 更新缓存
					stockDataCache[code] = {
						name: name,
						price: dataArr[3],
						percent: percentStr,
						isUp: isUp
					};

					// 🚨 2. 异动弹窗告警逻辑
					if (alertThreshold > 0 && Math.abs(percentFloat) >= alertThreshold) {
						// 如果还没弹过窗，则触发弹窗！
						if (!alertedStocks.has(code)) {
							alertedStocks.add(code); // 加入黑名单，防止疯狂弹窗

							const actionWord = isUp ? '暴涨' : '暴跌';
							const emoji = isUp ? '🚀' : '🩸';

							// 弹出系统级警告框！
							vscode.window.showWarningMessage(`${emoji} 【异动监控】 ${name} 当前${actionWord} ${Math.abs(percentFloat)}%!`);
						}
					} else {
						// 如果价格回落到阈值以内，把它从黑名单里放出来，下次再超标时可以重新报警
						if (alertedStocks.has(code) && Math.abs(percentFloat) < alertThreshold) {
							alertedStocks.delete(code);
						}
					}
				}
			});
			renderStatusBar(stocks);
		} catch (error) {
			console.error("股票数据获取失败", error);
		}
	};

	fetchStockData();
	const config = vscode.workspace.getConfiguration('stock-monitor-minimalist');
	// 获取用户设置的值，如果没有就默认 5000
	let userInterval = config.get<number>('updateInterval') || 5000;

	// 🛡️ 防封禁护城河：不管用户在设置里填多小（比如填了 1000 甚至 1），强制拉回到 3000 毫秒！
	const finalInterval = Math.max(userInterval, 3000);

	// 开启定时器
	monitorInterval = setInterval(fetchStockData, finalInterval);
}

function renderStatusBar(stocks: string[]) {
	if (stocks.length === 0) return;

	const currentCode = stocks[currentStockIndex];
	const data = stockDataCache[currentCode];

	if (data) {
		const icon = data.isUp ? '$(arrow-up)' : '$(arrow-down)';
		const color = '#7a7a7a';
		const sign = data.isUp ? '+' : '';

		myStatusBarItem.text = `${icon} ${data.name}: ${data.price}`;
		myStatusBarItem.color = color;
		myStatusBarItem.tooltip = `代码: ${currentCode}\n最新价: ${data.price}\n涨跌幅: ${sign}${data.percent}%\n\n💡 点击切换其他关注股票`;
	}
}

// ==========================================
// 插件卸载清理钩子
// ==========================================
export function deactivate() {
	if (monitorInterval) {
		clearInterval(monitorInterval);
	}
}