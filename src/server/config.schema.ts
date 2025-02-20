import { z } from 'zod';

export const dashboardSchema = z.object({
	slug: z.string().min(1),
	label: z.string(),
	widgets: z.array(z.any())
});

export const configSchema = z.object({
	version: z.literal(1),
	dashboards: z.array(dashboardSchema).min(1).max(3),
	config: z
		.object({
			metric_ingestion_token: z.string().optional(),
			message: z.string().optional(),
			custom_stript: z.string().optional(),
			custom_css: z.string().optional()
		})
		.optional()
});
