import { z } from 'zod';
import type { WidgetModel, WidgetView } from '../widget.modele';

import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';
import { safelyUpdateView } from '../utils';
import { formatDistanceToNow } from 'date-fns';

export const parse = async (url: string) => {
	if (!/(^http(s?):\/\/[^\s$.?#].[^\s]*)/i.test(url)) return null;

	const { data } = await axios(url);

	const xml = new XMLParser({
		attributeNamePrefix: '',
		textNodeName: '$text',
		ignoreAttributes: false
	});

	const result = xml.parse(data);

	let channel = result.rss && result.rss.channel ? result.rss.channel : result.feed;
	if (Array.isArray(channel)) channel = channel[0];

	const rss = {
		title: channel.title ?? '',
		description: channel.description ?? '',
		link: channel.link && channel.link.href ? channel.link.href : channel.link,
		image: channel.image
			? channel.image.url
			: channel['itunes:image']
				? channel['itunes:image'].href
				: '',
		category: channel.category || [],
		items: [] as unknown[]
	};

	let items = channel.item || channel.entry || [];
	if (items && !Array.isArray(items)) items = [items];

	for (let i = 0; i < Math.min(5, items.length); i++) {
		const val = items[i];
		const media = {};

		const obj = {
			id: val.guid && val.guid.$text ? val.guid.$text : val.id,
			title: val.title && val.title.$text ? val.title.$text : val.title,
			description: val.summary && val.summary.$text ? val.summary.$text : val.description,
			link: val.link && val.link.href ? val.link.href : val.link,
			author: val.author && val.author.name ? val.author.name : val['dc:creator'],
			published: val.created
				? Date.parse(val.created)
				: val.pubDate
					? Date.parse(val.pubDate)
					: Date.now(),
			created: val.updated
				? Date.parse(val.updated)
				: val.pubDate
					? Date.parse(val.pubDate)
					: val.created
						? Date.parse(val.created)
						: Date.now(),
			category: val.category || [],
			content: val.content && val.content.$text ? val.content.$text : val['content:encoded'],
			enclosures: val.enclosure
				? Array.isArray(val.enclosure)
					? val.enclosure
					: [val.enclosure]
				: []
		};

		if (val['media:thumbnail']) {
			Object.assign(media, { thumbnail: val['media:thumbnail'] });
			obj.enclosures.push(val['media:thumbnail']);
		}

		if (val['media:content']) {
			Object.assign(media, { thumbnail: val['media:content'] });
			obj.enclosures.push(val['media:content']);
		}

		if (val['media:group']) {
			if (val['media:group']['media:title']) obj.title = val['media:group']['media:title'];

			if (val['media:group']['media:description'])
				obj.description = val['media:group']['media:description'];

			if (val['media:group']['media:thumbnail'])
				obj.enclosures.push(val['media:group']['media:thumbnail'].url);

			if (val['media:group']['media:content'])
				obj.enclosures.push(val['media:group']['media:content']);
		}

		Object.assign(obj, { media });

		rss.items.push(obj);
	}

	return rss as {
		title: string;
		items: {
			published: string;
			title: string;
		}[];
	};
};

const formatDistanceLocale = {
	lessThanXSeconds: '{{count}}s',
	xSeconds: '{{count}}s',
	halfAMinute: '30s',
	lessThanXMinutes: '{{count}}m',
	xMinutes: '{{count}}m',
	aboutXHours: '{{count}}h',
	xHours: '{{count}}h',
	xDays: '{{count}}d',
	aboutXWeeks: '{{count}}w',
	xWeeks: '{{count}}w',
	aboutXMonths: '{{count}}m',
	xMonths: '{{count}}m',
	aboutXYears: '{{count}}y',
	xYears: '{{count}}y',
	overXYears: '{{count}}y',
	almostXYears: '{{count}}y'
};

const schema = z.object({
	title: z.string().optional(),
	subTitle: z.string().optional(),
	icon: z.string().optional(),
	refresh_interval: z.number().default(60 * 60),
	url: z.string().url()
});

export const RssWidget: WidgetModel<typeof schema, { content: WidgetView }> = {
	id: 'rss',
	schema,
	createId: (cfg) => {
		return `rss_${cfg.url}`;
	},
	init: (cfg, state, { updateView, setState }) => {
		const createView = async () => {
			const rss = await parse(cfg.url);

			const view: WidgetView = {
				widget: 'rss',
				complication: [
					{
						type: 'header' as const,
						title: cfg.title || (rss?.title ?? '--'),
						subtitle: cfg.subTitle,
						icon: cfg.icon
					},
					{
						type: 'list' as const,
						rows: (rss?.items ?? []).map((e) => {
							return {
								content: [
									{
										text: e.title,
										classes: 'text-sm text-primary-500 font-semibold grow truncate w-full'
									},
									{
										text: formatDistanceToNow(new Date(e.published), {
											locale: {
												formatDistance: (token, count) =>
													formatDistanceLocale[token].replace('{{count}}', `${count}`)
											}
										}),

										classes: 'text-sm shrink-0 font-medium text-neutral-200'
									}
								]
							};
						})
					}
				]
			};

			setState({
				content: view
			});

			return view;
		};

		safelyUpdateView(createView, updateView);

		setInterval(() => {
			safelyUpdateView(createView, updateView);
		}, cfg.refresh_interval * 1000);

		if (state) {
			return state.content;
		}

		return {
			widget: 'rss',
			complication: [
				{
					type: 'header' as const,
					title: cfg.title || '--',
					subtitle: cfg.subTitle,
					icon: cfg.icon
				}
			]
		};
	}
};
