import { App, FuzzySuggestModal, TFile } from "obsidian";

export class NoteSuggestModal extends FuzzySuggestModal<TFile> {
	private readonly excluded: Set<string>;
	private readonly onChoose: (file: TFile) => void;

	constructor(app: App, excludedPaths: string[], onChoose: (file: TFile) => void) {
		super(app);
		this.excluded = new Set(excludedPaths);
		this.onChoose = onChoose;
		this.setPlaceholder("Add a note to the comparison…");
	}

	getItems(): TFile[] {
		return this.app.vault
			.getMarkdownFiles()
			.filter((file) => !this.excluded.has(file.path))
			.sort((a, b) => a.basename.localeCompare(b.basename));
	}

	getItemText(file: TFile): string {
		return file.basename;
	}

	onChooseItem(file: TFile): void {
		this.onChoose(file);
	}
}
