import fs from 'fs';

export class Store {
	private data: Record<string, object> = {};

	constructor(private filePath = './state.json') {
		const state = fs.readFileSync(this.filePath, 'utf8') || '{}';

		this.data = JSON.parse(state);
	}

	updateData(key: string, value: object) {
		this.data[key] = value;

		this.save();
	}

	getData(key: string) {
		return this.data[key];
	}

	private save() {
		fs.writeFileSync(this.filePath, JSON.stringify(this.data));
	}
}
