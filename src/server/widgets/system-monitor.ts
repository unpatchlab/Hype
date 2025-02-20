import { z } from 'zod';
import type {
	WidgetComplication,
	WidgetMetricComplication,
	WidgetModel,
	WidgetView
} from '../widget.modele';
import type { Store } from '../store';
import ping from 'ping';
import { safelyUpdateView } from '../utils';

const schema = z.object({
	node: z.string(),
	ping: z.string().optional(),
	title: z.string().optional(),
	icon: z.string().optional(),
	subTitle: z.string().optional(),
	refresh_interval: z.number().default(5 * 60),
	cpu: z
		.object({
			view: z.enum(['combined', 'split']).default('combined'),
			progress_bar: z.boolean().default(false)
		})
		.optional(),
	memory: z
		.object({
			view: z.enum(['percentage', 'bytes']).default('percentage'),
			progress_bar: z.boolean().default(false)
		})
		.optional(),
	disk: z
		.object({
			label: z.enum(['device', 'path']).default('device'),
			view: z.enum(['percentage', 'bytes']).default('percentage'),
			progress_bar: z.boolean().default(false),
			paths: z.array(z.string()).default([]),
			devices: z.array(z.string()).default([])
		})
		.optional()
});

const formatBytes = (bytes: number) => {
	if (bytes === 0) return '0B';

	const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
	const exp = Math.floor(Math.log(bytes) / Math.log(1024));
	const size = bytes / Math.pow(1024, exp);

	return `${size.toFixed(2)}${units[exp]}`;
};

export const SystemMonitorWidget: (store: Store) => WidgetModel<typeof schema> = (store) => {
	return {
		id: 'system_monitor',
		schema,
		createId: (cfg) => {
			return `system_monitor_${cfg.node}`;
		},
		init: (item, _, { updateView }) => {
			let pingResponse: ping.PingResponse | null = null;
			let metricResponse: WidgetComplication | null = null;

			const pingHost = async () => {
				try {
					const res = await ping.promise.probe(item.ping || '');

					pingResponse = res;
				} catch (e) {
					console.error(e);
					pingResponse = null;
				}
			};

			const getMetric = () => {
				const metric: any = store.getData(item.node);

				if (!metric) {
					metricResponse = null;
					return;
				}

				try {
					const rows: WidgetMetricComplication['rows'] = [];

					if (item.cpu) {
						switch (item.cpu.view) {
							case 'combined': {
								if ('usage' in metric.cpu) {
									rows.push({
										icon: 'ri-cpu-line',
										label: 'CPU',
										progress: item.cpu?.progress_bar ? metric.cpu.usage : -1,
										value: `${metric.cpu.usage.toFixed(2)}%`
									});
								}
								break;
							}
							case 'split': {
								const cpu = Object.values(metric?.cpu?.cores ?? {});

								cpu.forEach((c: any, i) => {
									rows.push({
										icon: 'ri-cpu-line',
										label: `Core ${i + 1}`,
										progress: item.cpu?.progress_bar ? c.usage : -1,
										value: `${c.usage.toFixed(2)}%`
									});
								});

								break;
							}
						}
					}

					if (item.memory && 'memory' in metric) {
						rows.push({
							icon: 'ri-ram-line',
							label: 'Memory',
							progress: item.memory.progress_bar ? metric.memory.percentage : -1,
							value:
								item.memory.view === 'percentage'
									? `${metric.memory.percentage.toFixed(2)}%`
									: `${formatBytes(metric.memory.used)} / ${formatBytes(metric.memory.total)}`
						});
					}

					if (item.disk && 'disks' in metric) {
						metric.disks.forEach((disk: any) => {
							const hasFilter = item.disk?.paths?.length || item.disk?.devices?.length;

							if (hasFilter) {
								const isInPath = item.disk?.paths?.length
									? item.disk?.paths?.includes(disk.path)
									: false;
								const isInDevice = item.disk?.devices?.length
									? item.disk?.devices?.includes(disk.device)
									: false;

								if (!isInPath && !isInDevice) {
									return;
								}
							}

							rows.push({
								icon: 'ri-hard-drive-2-line',
								label: (item.disk?.label === 'path' ? disk.path : disk.device) || disk.device,
								progress: item.disk?.progress_bar ? disk.percentage : -1,
								value:
									item.disk?.view === 'percentage'
										? `${disk.percentage.toFixed(2)}%`
										: `${formatBytes(disk.used)} / ${formatBytes(disk.total)}`
							});
						});
					}

					metricResponse = {
						type: 'metric' as const,
						rows
					};
				} catch {
					metricResponse = null;
				}
			};

			const getSideContent = () => {
				if (!item.ping) {
					return undefined;
				}

				if (!pingResponse) {
					return { type: 'label' as const, indicatorClass: 'bg-red-500', label: 'ERR' };
				}

				if (!pingResponse.alive) {
					return { type: 'label' as const, indicatorClass: 'bg-red-500', label: 'OFFLINE' };
				}

				return {
					type: 'label' as const,
					indicatorClass: 'bg-green-500',
					label: 'ONLINE'
				};
			};

			const createView = async () => {
				getMetric();

				const view: WidgetView = {
					widget: 'metrics',
					complication: [
						{
							type: 'header' as const,
							title: item.title || item.node,
							subtitle: item.subTitle || item.ping || '',
							icon: item.icon || '',
							sideContent: getSideContent()
						},
						...(metricResponse ? [metricResponse] : [])
					]
				};

				return view;
			};

			if (item.ping) {
				pingHost().then(() => {
					safelyUpdateView(createView, updateView);
				});
				setInterval(async () => {
					await pingHost();
					safelyUpdateView(createView, updateView);
				}, item.refresh_interval * 1000);
			} else {
				safelyUpdateView(createView, updateView);
				setInterval(() => {
					safelyUpdateView(createView, updateView);
				}, item.refresh_interval * 1000);
			}

			return {
				widget: 'metrics',
				complication: [
					{
						type: 'header' as const,
						title: item.title || item.node,
						subtitle: item.subTitle || item.ping || '',
						icon: item.icon || ''
					}
				]
			};
		}
	};
};
