import { Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { CompareSettings, CompareSettingTab, DEFAULT_SETTINGS } from "./settings";
import { CompareView, VIEW_TYPE_COMPARE } from "./compareView";

export default class ComparePlugin extends Plugin {
	settings: CompareSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(VIEW_TYPE_COMPARE, (leaf) => new CompareView(leaf, this));

		this.addRibbonIcon("columns", "Open comparison table", () => {
			void this.activateView();
		});

		this.addCommand({
			id: "compare-open-view",
			name: "Open comparison table",
			callback: () => {
				void this.activateView();
			},
		});

		this.addCommand({
			id: "compare-add-current-note",
			name: "Add current note to comparison",
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (!file || !(file instanceof TFile)) return false;
				if (checking) return true;
				void this.addNoteToComparison(file);
				return true;
			},
		});

		this.addSettingTab(new CompareSettingTab(this.app, this));
	}

	onunload(): void {
		// Views are cleaned up automatically by the workspace.
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	refreshCompareViews(): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_COMPARE)) {
			if (leaf.view instanceof CompareView) leaf.view.render();
		}
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;
		let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(VIEW_TYPE_COMPARE)[0] ?? null;

		if (!leaf) {
			leaf =
				this.settings.openLocation === "sidebar"
					? workspace.getRightLeaf(false)
					: workspace.getLeaf("tab");
			if (!leaf) return;
			await leaf.setViewState({ type: VIEW_TYPE_COMPARE, active: true });
		}

		void workspace.revealLeaf(leaf);
	}

	async addNoteToComparison(file: TFile): Promise<void> {
		if (!this.settings.compareItems.includes(file.path)) {
			this.settings.compareItems.push(file.path);
			await this.saveSettings();
			this.refreshCompareViews();
		} else {
			new Notice(`"${file.basename}" is already in the comparison.`);
		}
		await this.activateView();
	}
}
