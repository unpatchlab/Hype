/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ZodType } from 'zod';

export type HeaderWidgetComplication = {
	type: 'header';

	icon?: string;

	title: string;
	subtitle?: string;

	sideContent?:
		| {
				type: 'button';
				label: string;
				action: string;
		  }
		| {
				type: 'label';
				indicatorClass?: string;
				label: string;
		  }
		| {
				type: 'text';
				content: {
					title: string;
					subtitle?: string;
				}[];
		  };
};

export type WidgetMetricComplication = {
	type: 'metric';
	title?: string;
	rows: {
		icon?: string;
		label?: string;
		progress?: number;
		value?: string;
	}[];
};

export type WidgetComplication =
	| { type: 'custom' }
	| {
			type: 'list';
			title?: string;
			rows: {
				content: {
					text: string;
					classes: string;
				}[];
				href?: string;
			}[];
	  }
	| WidgetMetricComplication
	| {
			type: 'button';
			label: string;
			action: string;
	  }
	| HeaderWidgetComplication;

export type WidgetView = {
	widget: string;
	complication: WidgetComplication[];
	action?: string;
	onAction?: (action: string) => void;
};

export type WidgetModel<Schema extends ZodType<any, any, any>, State = object> = {
	id: string;
	schema: Schema;
	createId: (cfg: Zod.infer<Schema>) => string;
	init: (
		config: Zod.infer<Schema>,
		initialState: State | null,
		opt: { setState: (state: State) => void; updateView: (view: WidgetView) => void }
	) => WidgetView;
};
