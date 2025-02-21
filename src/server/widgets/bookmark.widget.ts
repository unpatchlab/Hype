import { z } from 'zod';
import type { WidgetModel } from '../widget.modele';

const schema = z.object({
	title: z.string(),
	subTitle: z.string().optional(),
	icon: z.string().optional(),
	sections: z.array(
		z.object({
			name: z.string(),
			items: z.array(
				z.object({
					name: z.string(),
					url: z.string()
				})
			)
		})
	)
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BookmarkWidget: WidgetModel<typeof schema> = {
	id: 'bookmark',
	schema,
	createId: () => {
		return `app_bookmark_${new Date().toISOString()}`;
	},
	init: (item, _, { updateView }) => {
		const createView = () => {
			return {
				widget: 'bookmark',
				complication: [
					{
						type: 'header' as const,
						title: item.title,
						subtitle: item.subTitle,
						icon: item.icon
					},
					...item.sections.map((section) => {
						return {
							type: 'list' as const,
							title: section.name,
							rows: section.items.map((item) => {
								return {
									href: item.url,
									content: [
										{
											text: item.name,
											classes: 'text-sm text-primary-500 font-semibold grow truncate w-full'
										}
									]
								};
							})
						};
					})
				]
			};
		};

		setInterval(() => {
			updateView(createView());
		}, 1000);

		return createView();
	}
};
