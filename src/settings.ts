import { App, PluginSettingTab, Setting } from "obsidian";
import type ComparePlugin from "./main";

export interface CompareSettings {
	/** Paths of notes currently loaded into the comparison view. */
	compareItems: string[];
	/** Frontmatter keys to leave out of the comparison table. */
	ignoredKeys: string[];
	/** Highlight rows where values differ across notes. */
	highlightDifferences: boolean;
	/** Hide rows where every note has the same value. */
	hideIdenticalRows: boolean;
	/** Frontmatter key used to show an image row (e.g. "image", "cover"). */
	imageKey: string;
	/** Where the comparison view opens: a full workspace tab, or the right sidebar. */
	openLocation: "tab" | "sidebar";
}

export const DEFAULT_SETTINGS: CompareSettings = {
	compareItems: [],
	ignoredKeys: ["tags", "cssclass", "aliases"],
	highlightDifferences: true,
	hideIdenticalRows: false,
	imageKey: "image",
	openLocation: "tab",
};

export class CompareSettingTab extends PluginSettingTab {
	plugin: ComparePlugin;

	constructor(app: App, plugin: ComparePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Compare settings" });

		new Setting(containerEl)
			.setName("Open location")
			.setDesc(
				"Where the comparison view opens. A full tab gives it room for many notes side by side and works better on mobile; the sidebar is narrower but stays visible next to a note."
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("tab", "Full tab")
					.addOption("sidebar", "Right sidebar")
					.setValue(this.plugin.settings.openLocation)
					.onChange(async (value) => {
						this.plugin.settings.openLocation = value as "tab" | "sidebar";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Highlight differences")
			.setDesc("Visually highlight property rows where notes have different values.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.highlightDifferences).onChange(async (value) => {
					this.plugin.settings.highlightDifferences = value;
					await this.plugin.saveSettings();
					this.plugin.refreshCompareViews();
				})
			);

		new Setting(containerEl)
			.setName("Hide identical rows")
			.setDesc("Only show properties whose values differ across the compared notes.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.hideIdenticalRows).onChange(async (value) => {
					this.plugin.settings.hideIdenticalRows = value;
					await this.plugin.saveSettings();
					this.plugin.refreshCompareViews();
				})
			);

		new Setting(containerEl)
			.setName("Image property")
			.setDesc("Frontmatter key whose value is shown as an image row at the top of the table (leave blank to disable).")
			.addText((text) =>
				text
					.setPlaceholder("image")
					.setValue(this.plugin.settings.imageKey)
					.onChange(async (value) => {
						this.plugin.settings.imageKey = value.trim();
						await this.plugin.saveSettings();
						this.plugin.refreshCompareViews();
					})
			);

		new Setting(containerEl)
			.setName("Ignored properties")
			.setDesc("Comma-separated frontmatter keys to exclude from every comparison.")
			.addTextArea((text) =>
				text
					.setPlaceholder("tags, cssclass, aliases")
					.setValue(this.plugin.settings.ignoredKeys.join(", "))
					.onChange(async (value) => {
						this.plugin.settings.ignoredKeys = value
							.split(",")
							.map((key) => key.trim())
							.filter((key) => key.length > 0);
						await this.plugin.saveSettings();
						this.plugin.refreshCompareViews();
					})
			);
	}
}
