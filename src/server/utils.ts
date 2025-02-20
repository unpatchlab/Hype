import type { WidgetView } from './widget.modele';
import { join } from 'path';
import fs from 'fs';
import YAML from 'yaml';
import { configSchema } from './config.schema';

export const safelyUpdateView = async (
	cb: () => Promise<WidgetView>,
	setView: (view: WidgetView) => void
) => {
	try {
		setView(await cb());
	} catch (e) {
		console.error(e);
		setView({
			widget: 'app',
			complication: [
				{
					type: 'header' as const,
					title: 'Error',
					subtitle: (e as Error).message
				}
			]
		});
	}
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapMetrics = (data: any) => {
	const metrics = data?.metrics ?? [];

	const arr = {
		cpu: {
			usage: 0,
			cores: {} as Record<number, { usage: number }>
		},
		memory: {
			total: 0,
			used: 0,
			percentage: 0
		},
		disks: [] as {
			device: string;
			path: string;
			total: number;
			used: number;
			percentage: number;
		}[]
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	metrics.forEach((metric: any) => {
		const { fields, name, tags } = metric;

		switch (name) {
			case 'cpu': {
				if (tags.cpu === 'cpu-total') {
					arr.cpu.usage = 100 - fields.usage_idle;
				} else {
					const core = Number(tags.cpu.replace('cpu', '')) + 1;

					arr.cpu.cores[core] = {
						usage: 100 - fields.usage_idle
					};
				}
				break;
			}
			case 'mem': {
				arr.memory = {
					total: fields.total,
					used: fields.used,
					percentage: fields.used_percent
				};
				break;
			}
			case 'disk': {
				arr.disks.push({
					device: tags.device,
					path: tags.path,
					total: fields.total,
					used: fields.used,
					percentage: fields.used_percent
				});
			}
		}
	});

	return arr;
};

const defaultYaml = `

`;

export const initConfig = () => {
	if (!fs.existsSync(process.env.STORAGE_DIR || '')) {
		throw new Error('Storage directory not found');
	}

	const configPath = process.env.CONFIG_YAML || join(process.env.STORAGE_DIR || '', 'config.yaml');

	if (!fs.existsSync(configPath) || fs.readFileSync(configPath, 'utf8') === '') {
		fs.writeFileSync(configPath, defaultYaml);
	}

	const yaml = fs.readFileSync(configPath, 'utf8');

	const doc = YAML.parse(yaml);

	const iconsDir = join(process.env.STORAGE_DIR || '', 'icons');

	if (!fs.existsSync(iconsDir)) {
		fs.mkdirSync(iconsDir);
	}

	const dataStorePath = join(process.env.STORAGE_DIR || '', 'data.json');

	if (!fs.existsSync(dataStorePath)) {
		fs.writeFileSync(dataStorePath, '{}');
	}

	const metricStorePath = join(process.env.STORAGE_DIR || '', 'metric.json');

	if (!fs.existsSync(metricStorePath)) {
		fs.writeFileSync(metricStorePath, '{}');
	}

	return {
		config: configSchema.parse(doc),
		iconsDir,
		dataStorePath,
		metricStorePath
	};
};
