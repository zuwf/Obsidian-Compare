import { ItemView, TFile, WorkspaceLeaf, Notice } from "obsidian";
import type ComparePlugin from "./main";
import { NoteSuggestModal } from "./noteSuggestModal";

export const VIEW_TYPE_COMPARE = "compare-view";

type FrontmatterValue = unknown;

function formatValue(value: FrontmatterValue): string {
	if (value === undefined || value === null || value === "") return "—";
	if (Array.isArray(value)) {
		return value.length ? value.map((v) => formatValue(v)).join(", ") : "—";
	}
	if (typeof value === "boolean") return value ? "Yes" : "No";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}

function normalizeForCompare(value: FrontmatterValue): string {
	if (value === undefined || value === null || value === "") return "";
	if (Array.isArray(value)) return value.map((v) => normalizeForCompare(v)).sort().join("");
	return String(value).trim().toLowerCase();
}

export class CompareView extends ItemView {
	plugin: ComparePlugin;

	constructor(leaf: WorkspaceLeaf, plugin: ComparePlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_COMPARE;
	}

	getDisplayText(): string {
		return "Compare";
	}

	getIcon(): string {
		return "columns";
	}

	async onOpen(): Promise<void> {
		this.render();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	private getFiles(): TFile[] {
		const files: TFile[] = [];
		for (const path of this.plugin.settings.compareItems) {
			const file = this.app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile) files.push(file);
		}
		return files;
	}

	async addNote(file: TFile): Promise<void> {
		if (this.plugin.settings.compareItems.includes(file.path)) {
			new Notice(`"${file.basename}" is already in the comparison.`);
			return;
		}
		this.plugin.settings.compareItems.push(file.path);
		await this.plugin.saveSettings();
		this.render();
	}

	async removeNote(path: string): Promise<void> {
		this.plugin.settings.compareItems = this.plugin.settings.compareItems.filter((p) => p !== path);
		await this.plugin.saveSettings();
		this.render();
	}

	async clearAll(): Promise<void> {
		this.plugin.settings.compareItems = [];
		await this.plugin.saveSettings();
		this.render();
	}

	render(): void {
		const container = this.contentEl;
		container.empty();
		container.addClass("compare-view-container");

		const toolbar = container.createDiv({ cls: "compare-toolbar" });

		const addButton = toolbar.createEl("button", { text: "+ Add note", cls: "compare-btn compare-btn-primary" });
		addButton.addEventListener("click", () => {
			const excluded = this.plugin.settings.compareItems;
			new NoteSuggestModal(this.app, excluded, (file) => {
				void this.addNote(file);
			}).open();
		});

		const clearButton = toolbar.createEl("button", { text: "Clear all", cls: "compare-btn" });
		clearButton.addEventListener("click", () => {
			void this.clearAll();
		});

		const files = this.getFiles();

		if (files.length === 0) {
			container.createDiv({
				cls: "compare-empty-state",
				text: "Add two or more notes to compare their properties side by side, like a spec sheet.",
			});
			return;
		}

		const settings = this.plugin.settings;
		const frontmatters = files.map(
			(file) => this.app.metadataCache.getFileCache(file)?.frontmatter ?? {}
		);

		// Collect the union of all property keys across notes, excluding ignored keys and the image key.
		const keySet = new Set<string>();
		for (const fm of frontmatters) {
			for (const key of Object.keys(fm)) {
				if (key === "position") continue;
				if (settings.ignoredKeys.includes(key)) continue;
				if (settings.imageKey && key === settings.imageKey) continue;
				keySet.add(key);
			}
		}
		const keys = Array.from(keySet).sort((a, b) => a.localeCompare(b));

		const table = container.createEl("table", { cls: "compare-table" });

		// Header row: note titles, each with an open link and a remove button.
		const thead = table.createEl("thead");
		const headerRow = thead.createEl("tr");
		headerRow.createEl("th", { text: "Property", cls: "compare-property-header" });
		files.forEach((file, i) => {
			const th = headerRow.createEl("th", { cls: "compare-note-header" });
			const titleEl = th.createEl("a", { text: file.basename, cls: "compare-note-title" });
			titleEl.addEventListener("click", (evt) => {
				evt.preventDefault();
				void this.app.workspace.openLinkText(file.path, "", false);
			});
			const removeBtn = th.createEl("span", { text: "✕", cls: "compare-remove-btn" });
			removeBtn.setAttribute("aria-label", `Remove ${file.basename} from comparison`);
			removeBtn.addEventListener("click", () => {
				void this.removeNote(file.path);
			});
		});

		const tbody = table.createEl("tbody");

		// Optional image row.
		if (settings.imageKey) {
			const hasImage = frontmatters.some((fm) => fm[settings.imageKey]);
			if (hasImage) {
				const row = tbody.createEl("tr", { cls: "compare-row compare-row-image" });
				row.createEl("td", { text: "Image", cls: "compare-property-name" });
				frontmatters.forEach((fm) => {
					const cell = row.createEl("td", { cls: "compare-cell" });
					const src = fm[settings.imageKey];
					if (typeof src === "string" && src.length > 0) {
						const resolved =
							this.app.metadataCache.getFirstLinkpathDest(src.replace(/^!?\[\[|\]\]$/g, ""), "")?.path;
						const img = cell.createEl("img", { cls: "compare-image" });
						if (resolved) {
							img.src = this.app.vault.adapter.getResourcePath(resolved);
						} else {
							img.src = src;
						}
					} else {
						cell.setText("—");
					}
				});
			}
		}

		let visibleRows = 0;
		for (const key of keys) {
			const rawValues = frontmatters.map((fm) => fm[key]);
			const normalized = rawValues.map((v) => normalizeForCompare(v));
			const allSame = normalized.every((v) => v === normalized[0]);

			if (settings.hideIdenticalRows && files.length > 1 && allSame) continue;

			visibleRows++;
			const row = tbody.createEl("tr", { cls: "compare-row" });
			if (settings.highlightDifferences && files.length > 1 && !allSame) {
				row.addClass("compare-row-diff");
			}
			row.createEl("td", { text: key, cls: "compare-property-name" });
			rawValues.forEach((value) => {
				row.createEl("td", { text: formatValue(value), cls: "compare-cell" });
			});
		}

		if (visibleRows === 0 && keys.length > 0) {
			tbody.createEl("tr").createEl("td", {
				text: "All properties are identical across the compared notes.",
				cls: "compare-empty-row",
				attr: { colspan: String(files.length + 1) },
			});
		} else if (keys.length === 0) {
			tbody.createEl("tr").createEl("td", {
				text: "None of these notes have frontmatter properties to compare.",
				cls: "compare-empty-row",
				attr: { colspan: String(files.length + 1) },
			});
		}
	}
}
