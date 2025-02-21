import { z } from 'zod';
import type { WidgetModel } from '../widget.modele';
import { formatInTimeZone } from 'date-fns-tz';

const schema = z.object({
	region: z.array(
		z.union([
			z.string(),
			z.object({
				timezone: z.string(),

				label: z.string().nullable()
			})
		])
	)
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WorldClockWidget: WidgetModel<typeof schema> = {
	id: 'world_clock',
	schema,
	createId: () => {
		return `app_world_clock_${new Date().toISOString()}`;
	},
	init: (cfg, _, { updateView }) => {
		const item = schema.parse(cfg);

		const createView = () => {
			const [first, ...rest] = item.region.map((zone) => {
				const timezone = typeof zone === 'string' ? zone : zone.timezone;

				return {
					label: typeof zone === 'string' ? zone : (zone.label ?? timezone),
					timezone
				};
			});

			const now = new Date();

			return {
				widget: 'world_clock',
				complication: [
					{
						type: 'header' as const,
						title: formatInTimeZone(now, first.timezone, 'MMM d'),
						subtitle: formatInTimeZone(now, first.timezone, 'yyyy'),
						sideContent: {
							type: 'text' as const,
							content: [
								{
									title: formatInTimeZone(now, first.timezone, 'hh:mm a'),
									subtitle: formatInTimeZone(now, first.timezone, 'EEEE')
								}
							]
						}
					},
					{
						type: 'list' as const,
						rows: rest.map((e) => {
							return {
								content: [
									{
										text: e.label,
										classes: 'text-sm text-primary-500 font-bold grow truncate w-full'
									},
									{
										text: formatInTimeZone(now, e.timezone, 'EEE, hh:mm a'),
										classes: 'text-sm shrink-0 font-regular text-neutral-150'
									}
								]
							};
						})
					}
				]
			};
		};

		setInterval(() => {
			updateView(createView());
		}, 1000);

		return createView();
	}
};
