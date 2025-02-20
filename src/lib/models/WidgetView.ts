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

export type ListWidgetComplication = {
	type: 'list';
	title?: string;
	rows: {
		content: {
			text: string;
			classes: string;
		}[];
		href?: string;
	}[];
};

export type ButtonWidgetComplication = {
	type: 'button';
	label: string;
	action: string;
};

export type WidgetComplication =
	| { type: 'custom' }
	| ListWidgetComplication
	| WidgetMetricComplication
	| ButtonWidgetComplication
	| HeaderWidgetComplication;

export type WidgetView = {
	widget: string;
	complication: WidgetComplication[];
	action?: string;
	onAction?: (action: string) => void;
};
