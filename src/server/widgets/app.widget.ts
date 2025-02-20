import { z } from 'zod';
import type { WidgetModel } from '../widget.modele';

const schema = z.object({
	title: z.string(),
	subTitle: z.string().optional(),
	icon: z.string().optional(),
	href: z.string().optional(),
	health: z
		.object({
			type: z.literal('http'),
			url: z.string()
		})
		.optional()
});

export const AppWidget: WidgetModel<typeof schema> = {
	id: 'app',
	schema,
	createId: (cfg) => {
		return `app_${cfg.href}_${new Date().getTime().toString()}`;
	},
	init: (cfg, _, { updateView }) => {
		const item = schema.parse(cfg);

		const createObj = (indicatorClass: string, label: string) => {
			return {
				widget: 'app',
				action: 'open_href::' + item.href,
				complication: [
					{
						type: 'header' as const,
						icon: item.icon,
						title: item.title,
						subtitle: item.subTitle,
						sideContent: item.health
							? {
									type: 'label' as const,
									indicatorClass,
									label
								}
							: undefined
					}
				]
			};
		};

		const createAndUpdateObj = (indicatorClass: string, label: string) => {
			updateView(createObj(indicatorClass, label));
		};

		const updateStatus = () => {
			fetch(item.health?.url ?? '')
				.then((data) => {
					if (data.ok) {
						return createAndUpdateObj('bg-green-500', 'Online');
					} else {
						return createAndUpdateObj('bg-red-500', 'Offline');
					}
				})
				.catch((err) => {
					console.error(err);
					return createAndUpdateObj('bg-red-500', 'Error');
				});
		};

		if (item.health) {
			updateStatus();
			setInterval(updateStatus, 5000);
		}

		return createObj('bg-yellow-500', 'Checking');
	}
};
