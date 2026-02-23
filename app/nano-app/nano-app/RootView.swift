import SwiftUI
import AuthenticationServices

// MARK: - Root Tab View

struct BeerPreferenceAppRootView: View {
    var body: some View {
        TabView {
            PreferencesView()
                .tabItem { Label("Taste", systemImage: "slider.horizontal.3") }

            RecommendationsView()
                .tabItem { Label("Matches", systemImage: "sparkles") }

            VocabularyView()
                .tabItem { Label("Vocabulary", systemImage: "book.closed") }

            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape") }
        }
    }
}

// MARK: - Taste Model / Vocabulary

enum BeerAttribute: String, CaseIterable, Identifiable {
    case body = "Body"
    case malty = "Malty"
    case sour = "Sour"
    case fruits = "Fruits"
    case hoppy = "Hoppy"
    case bitter = "Bitter"
    case salty = "Salty"
    case spices = "Spices"
    case astringency = "Astringency"
    case alcohol = "Alcohol"

    var id: String { rawValue }

    var shortDefinition: String {
        switch self {
        case .body:
            return "Perceived weight or thickness in the mouth."
        case .alcohol:
            return "Strength of alcohol perception in taste/aroma (separate from ABV)."
        case .bitter:
            return "Bitterness, usually from hops or roasted ingredients."
        case .malty:
            return "Grain-derived richness (bready/caramel-like)."
        case .sour:
            return "Tartness/acidity."
        case .salty:
            return "Saltiness (rare; present in styles like Gose)."
        case .fruits:
            return "Fruit flavors from additions or fermentation character."
        case .hoppy:
            return "Hop aroma/flavor intensity (citrus/pine/floral/herbal)."
        case .spices:
            return "Spice-like notes from ingredients or yeast."
        case .astringency:
            return "Dryness/puckering sensation (often tannins or roasted grains)."
        }
    }

    var exampleHints: String {
        switch self {
        case .body:
            return "Light ↔ full-bodied"
        case .malty:
            return "Crackery ↔ caramel/bready"
        case .sour:
            return "Smooth ↔ tart"
        case .fruits:
            return "Neutral ↔ fruity"
        case .hoppy:
            return "Low aroma ↔ punchy hops"
        case .bitter:
            return "Mild ↔ sharp bitterness"
        case .salty:
            return "None ↔ noticeably saline"
        case .spices:
            return "None ↔ clove/pepper/coriander"
        case .astringency:
            return "Soft ↔ drying/puckering"
        case .alcohol:
            return "Hidden ↔ warming/boozy"
        }
    }
}

// MARK: - Preferences View (less busy; no inline definitions)

struct PreferencesView: View {
    @State private var bodyPreference: Double = 5          // PC1: Body
    @State private var malty: Double = 5         // PC1: Malty
    @State private var sour: Double = 3          // PC2: Sour
    @State private var fruits: Double = 4        // PC2: Fruits
    @State private var hoppy: Double = 6         // PC3: Hoppy
    @State private var bitter: Double = 5        // PC3: Bitter
    @State private var spices: Double = 2        // PC4/PC5: Spices
    @State private var salty: Double = 1         // PC4/PC5: Salty

    @State private var likedBeer: String = "Select a beer"
    private let beerOptions = [
        "Select a beer",
        "Sierra Nevada Pale Ale",
        "Allagash White",
        "Guinness Draught",
        "Dogfish Head 60 Minute IPA",
        "Founders Breakfast Stout",
        "Blue Moon",
        "Lagunitas IPA",
        "Heineken",
        "Modelo Especial"
    ]

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("Set your preferences. For definitions, visit the Vocabulary tab.")
                        .foregroundStyle(.secondary)
                }

                Section("Richness") {
                    PreferenceSlider(title: "Body", value: $bodyPreference, left: "Light", right: "Thick")
                    PreferenceSlider(title: "Malty", value: $malty, left: "Dry", right: "Grainy")
                }

                Section("Brightness") {
                    PreferenceSlider(title: "Sour", value: $sour, left: "Not tart", right: "Very tart")
                    PreferenceSlider(title: "Fruity", value: $fruits, left: "Not fruity", right: "Very fruity")
                }

                Section("Hop Character") {
                    PreferenceSlider(title: "Hoppy", value: $hoppy, left: "Low", right: "High")
                    PreferenceSlider(title: "Bitter", value: $bitter, left: "Low", right: "High")
                }

                Section("Edge Notes") {
                    PreferenceSlider(title: "Spices", value: $spices, left: "None", right: "Spiced")
                    PreferenceSlider(title: "Salty", value: $salty, left: "None", right: "Salty")
                }

                Section("A beer you already enjoy (Nearest Neighbors)") {
                    Picker("I like…", selection: $likedBeer) {
                        ForEach(beerOptions, id: \.self) { Text($0) }
                    }
                }

                Section("Your taste snapshot") {
                    TasteRow(label: "Richness", value: (bodyPreference + malty) / 2)
                    TasteRow(label: "Brightness", value: (sour + fruits) / 2)
                    TasteRow(label: "Hops", value: (hoppy + bitter) / 2)
                    TasteRow(label: "Edge notes", value: (spices + salty) / 2)

                    Button("Find matches") {
                        // TODO: Use k-means cluster assignment + nearest neighbors, then populate Matches tab.
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                }
            }
            .navigationTitle("Beer Taste")
        }
    }
}

// MARK: - Vocabulary Tab

struct VocabularyView: View {
    @State private var searchText = ""

    private var filtered: [BeerAttribute] {
        let all = BeerAttribute.allCases
        guard !searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return all }
        return all.filter { attr in
            attr.rawValue.localizedCaseInsensitiveContains(searchText)
            || attr.shortDefinition.localizedCaseInsensitiveContains(searchText)
            || attr.exampleHints.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        NavigationStack {
            List {

                ForEach(filtered) { attr in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(attr.rawValue)
                            .font(.headline)

                        Text(attr.shortDefinition)
                            .foregroundStyle(.secondary)

                        Text(attr.exampleHints)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("Vocabulary")
            .searchable(text: $searchText, prompt: "Search terms (e.g., bitter, body)")
        }
    }
}

// MARK: - Matches (placeholder)

struct RecommendationsView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Recommended for you (placeholder)") {
                    Text("1) Beer Recommendation A")
                    Text("2) Beer Recommendation B")
                    Text("3) Beer Recommendation C")
                }
                Section("Notes (placeholder)") {
                    Text("Later: show cluster label + nearest-neighbor explanation.")
                }
            }
            .navigationTitle("Matches")
        }
    }
}

// MARK: - Settings (blank placeholder)

struct SettingsView: View {
    var body: some View {
        NavigationStack {
            Text("Settings (coming soon)")
                .foregroundStyle(.secondary)
                .navigationTitle("Settings")
        }
    }
}

// MARK: - Reusable UI

private struct PreferenceSlider: View {
    let title: String
    @Binding var value: Double
    var range: ClosedRange<Double> = 1...10
    let left: String
    let right: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(title).font(.headline)
                Spacer()
                Text("\(Int(value))")
                    .monospacedDigit()
                    .foregroundStyle(.secondary)
            }
            Slider(value: $value, in: range, step: 1)
            HStack {
                Text(left)
                Spacer()
                Text(right)
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
    }
}

private struct TasteRow: View {
    let label: String
    let value: Double
    var body: some View {
        HStack {
            Text(label)
            Spacer()
            Text("\(Int(value))/10")
                .monospacedDigit()
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Preview

#Preview {
    BeerPreferenceAppRootView()
}

