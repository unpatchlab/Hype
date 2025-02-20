/* eslint-disable @typescript-eslint/no-explicit-any */
import 'dotenv/config';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import type { WidgetView } from './widget.modele';
import { AppWidget } from './widgets/app.widget';
import { Store } from './store';
import { ICalWidget } from './widgets/ical.widget';
import { WorldClockWidget } from './widgets/world-clock.widget';
import { BookmarkWidget } from './widgets/bookmark.widget';
import { GithubWidget } from './widgets/github.widget';
import { RssWidget } from './widgets/rss.widget';
import { initConfig, mapMetrics } from './utils';
import { SystemMonitorWidget } from './widgets/system-monitor';
import { join } from 'path';
import fs from 'fs';
import { stream } from 'hono/streaming';

const { config, dataStorePath, metricStorePath, iconsDir } = initConfig();

const app = new Hono();

app.use(logger());

app.get('/api/static/icons/*', async (c) => {
	const filePath = join(iconsDir, c.req.path.replace('/api/static/icons/', ''));

	if (!fs.existsSync(filePath)) {
		return c.json(
			{
				error: 'File not found'
			},
			404
		);
	}

	return stream(c, async (s) => {
		const fileStream = fs.createReadStream(filePath);

		for await (const chunk of fileStream) {
			await s.write(chunk);
		}

		await s.close();
	});
});

const store = new Store(dataStorePath);
const metricStore = new Store(metricStorePath);

const loadedWidgets = [
	AppWidget,
	ICalWidget,
	WorldClockWidget,
	BookmarkWidget,
	GithubWidget,
	RssWidget,
	SystemMonitorWidget(metricStore)
];

const widgets: {
	dashboardId: string;
	widgetId: string;
	id: string;
	view: WidgetView;
}[] = [];

config.dashboards.forEach((dashboard) => {
	dashboard.widgets.forEach((w) => {
		const [widgetId, widgetConfig] = Object.entries(w)[0];

		const item = loadedWidgets.find((w) => w.id === widgetId);

		if (!item) {
			console.error(`Cannot find widget ${widgetId}`);
			return;
		}

		const cfg: any = item.schema.parse(widgetConfig);
		const id = item.createId(cfg);

		widgets.push({
			dashboardId: dashboard.slug,
			widgetId,
			id,
			view: (() => {
				try {
					return item.init(cfg, store.getData(id) as any, {
						setState: () => {},
						updateView: (view: WidgetView) => {
							const index = widgets.findIndex((w) => w.id === id);

							if (index !== -1) {
								widgets[index].view = view;
							}
						}
					});
				} catch (e) {
					console.error(e);

					return {
						widget: widgetId,
						complication: [
							{
								type: 'header' as const,
								title: 'Error',
								subtitle: (e as Error).message
							}
						]
					};
				}
			})()
		});
	});
});

app.get('/api/dashboards', (c) => {
	return c.json({
		dashboards: config.dashboards.map((d) => ({ slug: d.slug, label: d.label })),
		message: config.config?.message ?? '',
		custom_stript: config.config?.custom_stript ?? '',
		custom_css: config.config?.custom_css ?? ''
	});
});

app.get('/api/dashboard/:dashboardId', (c) => {
	const { dashboardId } = c.req.param();

	const dashboard = config.dashboards.find((d) => d.slug === dashboardId);

	if (!dashboard) {
		return c.json({ error: 'Dashboard not found' }, 404);
	}

	return c.json({
		widgets: widgets.filter((w) => w.dashboardId === dashboardId)
	});
});

app.post('/api/telegraf/ingest', async (c) => {
	const ingestionKey = config?.config?.metric_ingestion_token ?? '';

	if (ingestionKey && c.req.header('x-ingestion-key') !== ingestionKey) {
		return c.json({ error: 'Invalid ingestion key' }, 401);
	}

	const node = c.req.header('x-node-id');

	if (node) {
		const metric = await c.req.json();

		metricStore.updateData(node, mapMetrics(metric));
	} else {
		return c.json({ error: 'Missing node id' }, 400);
	}

	return c.json({
		success: true
	});
});

export const handleRequest = async (request: Request) => {
	const response = await app.fetch(request);
	return response;
};
