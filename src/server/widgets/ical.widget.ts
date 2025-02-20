import { z } from 'zod';
import type { WidgetModel } from '../widget.modele';
import ICAL from 'ical.js';
import { format } from 'date-fns';

const schema = z.object({
	friendly_name: z.string().nullable(),
	title: z.string(),
	subTitle: z.string().optional(),
	refresh_interval: z.number().default(5 * 60),
	icon: z.string().optional(),
	ical_href: z.string().url()
});

interface Event {
	summary: string;
	start: Date;
	end: Date;
}

const getTodaysEvents = async (icalData: string) => {
	const jcalData = ICAL.parse(icalData);
	const comp = new ICAL.Component(jcalData);
	const vevents = comp.getAllSubcomponents('vevent');

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const events: Event[] = [];

	vevents.forEach((vevent) => {
		const event = new ICAL.Event(vevent);

		// Handle non-recurring events
		if (!event.isRecurring()) {
			const startDate = event.startDate.toJSDate();
			startDate.setHours(0, 0, 0, 0);

			if (startDate.getTime() === today.getTime()) {
				events.push({
					summary: event.summary,
					start: event.startDate.toJSDate(),
					end: event.endDate.toJSDate()
					// isRecurring: false
				});
			}
			return;
		}

		// Handle recurring events
		const recur = event.iterator();
		let next;

		// Iterate through occurrences until we find today's event
		while ((next = recur.next())) {
			const nextDate = next.toJSDate();
			nextDate.setHours(0, 0, 0, 0);

			if (nextDate.getTime() === today.getTime()) {
				// Calculate the actual start and end times for this occurrence
				const duration = event.duration.toSeconds();
				const endDate = new Date(nextDate.getTime() + duration * 1000);

				events.push({
					summary: event.summary,
					start: nextDate,
					end: endDate
					// isRecurring: true,
					// recurrenceRule: event.getRecurrenceTypes()
				});
				break;
			}

			// Stop if we've gone past today
			if (nextDate > tomorrow) {
				break;
			}
		}
	});

	return events;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ICalWidget: WidgetModel<typeof schema, { rows_v1: any[] }> = {
	id: 'ical',
	schema,
	createId: (cfg) => {
		return `app_${cfg.friendly_name ?? cfg.ical_href}`;
	},
	init: (cfg, state, { updateView }) => {
		const item = schema.parse(cfg);

		const createView = async () => {
			const response = await fetch(item.ical_href);
			const data = await response.text();

			const events = await getTodaysEvents(data);

			updateView({
				widget: 'ical',
				complication: [
					{
						type: 'header' as const,
						title: item.title,
						subtitle: item.subTitle
					},
					{
						type: 'list' as const,
						rows: events.map((e) => {
							return {
								content: [
									{
										text: e.summary,
										classes: 'text-sm text-primary-500 font-semibold grow truncate w-full'
									},
									{
										text: format(new Date(e.start), 'hh:mm a'),
										classes: 'text-sm shrink-0 font-medium text-neutral-200'
									}
								]
							};
						})
					}
				]
			});
		};

		createView();

		setInterval(createView, item.refresh_interval * 1000);

		if (state) {
			return {
				widget: 'ical',
				complication: [
					{
						type: 'header' as const,
						title: item.title,
						subtitle: item.subTitle
					},
					{
						type: 'list' as const,
						rows: state.rows_v1
					}
				]
			};
		}

		return {
			widget: 'ical',
			complication: [
				{
					type: 'header' as const,
					title: item.title,
					subtitle: item.subTitle
				}
			]
		};
	}
};
