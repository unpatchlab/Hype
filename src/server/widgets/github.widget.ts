import { z } from 'zod';
import type { WidgetModel, WidgetView } from '../widget.modele';
import { Octokit } from '@octokit/rest';
import { formatDistanceToNow } from 'date-fns';

const schema = z.object({
	owner: z.string(),
	repo: z.string(),
	refresh_interval: z.number().default(60 * 60),
	icon: z.string().optional(),
	personal_access_token: z.string(),
	sections: z
		.array(
			z.object({
				name: z.string(),
				filter: z.string()
			})
		)
		.optional()
});

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

export const GithubWidget: WidgetModel<typeof schema, { content: WidgetView }> = {
	id: 'github',
	schema,
	createId: (cfg) => {
		return `github_${cfg.repo}`;
	},
	init: (cfg, state, { updateView }) => {
		const octokit = new Octokit({ auth: cfg.personal_access_token });

		const createView = async () => {
			const repo = await octokit.repos.get({
				owner: cfg.owner,
				repo: cfg.repo
			});

			const view: WidgetView = {
				widget: 'github',
				complication: [
					{
						type: 'header' as const,
						title: repo.data?.name ?? '',
						subtitle: `${cfg.owner}/${cfg.repo}`,
						sideContent: {
							type: 'text' as const,
							content: [
								{
									title: `${repo.data?.stargazers_count}`,
									subtitle: 'Stars'
								},
								{
									title: `${repo.data?.forks_count}`,
									subtitle: 'Forks'
								}
							]
						}
					}
				]
			};

			const pArr = (cfg.sections ?? []).map(async (section) => {
				const req = await octokit.search.issuesAndPullRequests({
					q: section.filter,
					per_page: 5,
					sort: 'updated',
					order: 'desc'
				});

				return {
					type: 'list' as const,
					title: section.name,
					rows: req.data.items.map((e) => {
						return {
							title: section.name,
							href: e.html_url,
							content: [
								{
									text: e.title,
									classes: 'text-sm text-primary-500 font-semibold grow truncate w-full'
								},
								{
									text: formatDistanceToNow(new Date(e.updated_at), {
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
				};
			});

			const res = await Promise.all(pArr);

			view.complication.push(...res);

			updateView(view);
		};

		createView();
		setInterval(createView, cfg.refresh_interval * 1000);

		if (state) {
			return state.content;
		}

		return {
			widget: 'github',
			complication: [
				{
					type: 'header' as const,
					title: '--',
					subtitle: 'Loading...'
				}
			]
		};
	}
};
