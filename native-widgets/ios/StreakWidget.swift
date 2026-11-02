import WidgetKit
import SwiftUI

// MARK: - Timeline Entry
struct StreakEntry: TimelineEntry {
    let date: Date
    let streakCount: Int
    let challengeTitle: String
    let status: String       // "ACTIVE" | "BROKEN" | "FROZEN"
    let aiMotivation: String
    let isSupremeGoalDone: Bool
    let completedHabitsCount: Int
    let totalHabitsCount: Int
    let incompleteHabitsCount: Int
}

// MARK: - Timeline Provider
struct StreakTimelineProvider: TimelineProvider {
    private let appGroupId = "group.com.streaktracker.app"

    func placeholder(in context: Context) -> StreakEntry {
        StreakEntry(
            date: Date(),
            streakCount: 14,
            challengeTitle: "100 Days of Code",
            status: "ACTIVE",
            aiMotivation: "14 days locked in! Excellence is your daily habit now.",
            isSupremeGoalDone: false,
            completedHabitsCount: 1,
            totalHabitsCount: 4,
            incompleteHabitsCount: 3
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (StreakEntry) -> Void) {
        completion(loadSharedEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<StreakEntry>) -> Void) {
        let entry = loadSharedEntry()
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadSharedEntry() -> StreakEntry {
        let defaults = UserDefaults(suiteName: appGroupId)
        let streak = defaults?.integer(forKey: "streakCount") ?? 0
        let title = defaults?.string(forKey: "challengeTitle") ?? "100 Days of Code"
        let status = defaults?.string(forKey: "status") ?? "ACTIVE"
        let motivation = defaults?.string(forKey: "aiMotivation") ?? "Show up and lock in today's micro-habits."

        let isSupremeDone = defaults?.bool(forKey: "isSupremeGoalDone") ?? false
        let completedHabits = defaults?.integer(forKey: "completedHabitsCount") ?? 0
        let totalHabits = defaults?.integer(forKey: "totalHabitsCount") ?? 0
        let incompleteHabits = defaults?.integer(forKey: "incompleteHabitsCount") ?? 0

        return StreakEntry(
            date: Date(),
            streakCount: streak,
            challengeTitle: title,
            status: status,
            aiMotivation: motivation,
            isSupremeGoalDone: isSupremeDone,
            completedHabitsCount: completedHabits,
            totalHabitsCount: totalHabits,
            incompleteHabitsCount: incompleteHabits
        )
    }
}

// MARK: - Widget View
struct StreakWidgetEntryView: View {
    var entry: StreakTimelineProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        ZStack {
            Color(red: 13/255, green: 17/255, blue: 23/255)

            switch family {
            case .systemSmall:
                SmallWidgetView(entry: entry)
            default:
                MediumWidgetView(entry: entry)
            }
        }
        .containerBackground(for: .widget) {
            Color(red: 13/255, green: 17/255, blue: 23/255)
        }
    }
}

// MARK: - Small Widget (Focus on Streak + Goals Status)
struct SmallWidgetView: View {
    let entry: StreakEntry

    var isBroken: Bool { entry.status == "BROKEN" || entry.streakCount == 0 }
    var isFrozen: Bool { entry.status == "FROZEN" }

    var flameColor: Color {
        if isBroken { return Color.red }
        if isFrozen { return Color(red: 56/255, green: 189/255, blue: 248/255) }
        return Color.orange
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack {
                Image(systemName: isBroken ? "xmark.seal.fill" : isFrozen ? "snowflake" : "flame.fill")
                    .foregroundColor(flameColor)
                    .font(.system(size: 16))
                Spacer()
                Text("\(entry.streakCount)d")
                    .font(.system(size: 14, weight: .black, design: .rounded))
                    .foregroundColor(flameColor)
            }

            Spacer()

            // Supreme Goal Status
            HStack(spacing: 4) {
                Image(systemName: entry.isSupremeGoalDone ? "checkmark.circle.fill" : "hourglass.circle")
                    .foregroundColor(entry.isSupremeGoalDone ? .green : .red)
                    .font(.system(size: 10))
                Text(entry.isSupremeGoalDone ? "Supreme: Done ✓" : "Supreme: Pending ⏳")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(entry.isSupremeGoalDone ? .green : .red)
                    .lineLimit(1)
            }

            // Incomplete Habits Count
            HStack(spacing: 4) {
                Image(systemName: entry.incompleteHabitsCount == 0 && entry.totalHabitsCount > 0 ? "checkmark.circle.fill" : "bolt.circle.fill")
                    .foregroundColor(entry.incompleteHabitsCount == 0 && entry.totalHabitsCount > 0 ? .green : .yellow)
                    .font(.system(size: 10))
                Text(entry.incompleteHabitsCount == 0 && entry.totalHabitsCount > 0
                     ? "Habits: All Done ✓"
                     : "Habits: \(entry.incompleteHabitsCount) Left ⏳")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(entry.incompleteHabitsCount == 0 && entry.totalHabitsCount > 0 ? .green : .yellow)
                    .lineLimit(1)
            }

            Text(entry.challengeTitle)
                .font(.system(size: 9, weight: .medium))
                .foregroundColor(.gray)
                .lineLimit(1)
        }
        .padding(10)
    }
}

// MARK: - Medium Widget (Streak + Supreme Goal Status + Incomplete Habits Reminder + AI Advice)
struct MediumWidgetView: View {
    let entry: StreakEntry

    var isBroken: Bool { entry.status == "BROKEN" || entry.streakCount == 0 }
    var isFrozen: Bool { entry.status == "FROZEN" }

    var accentColor: Color {
        if isBroken { return Color.red }
        if isFrozen { return Color(red: 56/255, green: 189/255, blue: 248/255) }
        return Color.orange
    }

    var body: some View {
        HStack(spacing: 12) {
            // Left Column: Streak Flame & Big Counter
            VStack(alignment: .center, spacing: 3) {
                Image(systemName: isBroken ? "xmark.seal.fill" : isFrozen ? "snowflake" : "flame.fill")
                    .foregroundColor(accentColor)
                    .font(.system(size: 24))

                Text("\(entry.streakCount)")
                    .font(.system(size: 32, weight: .black, design: .rounded))
                    .foregroundColor(accentColor)

                Text("DAY STREAK")
                    .font(.system(size: 8, weight: .black))
                    .foregroundColor(.gray)
                    .tracking(0.5)
            }
            .frame(width: 78)
            .padding(.vertical, 8)
            .background(Color(red: 22/255, green: 27/255, blue: 34/255))
            .cornerRadius(12)

            // Right Column: Goals Status, Incomplete Habits & AI Quote
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(entry.challengeTitle.uppercased())
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.gray)
                        .lineLimit(1)
                    Spacer()
                    Text(entry.status == "ACTIVE" ? "🔥 ACTIVE" : entry.status)
                        .font(.system(size: 8, weight: .black))
                        .foregroundColor(accentColor)
                }

                // Row 1: Supreme Goal Status Reminder
                HStack(spacing: 5) {
                    Image(systemName: entry.isSupremeGoalDone ? "checkmark.circle.fill" : "hourglass.circle.fill")
                        .foregroundColor(entry.isSupremeGoalDone ? .green : .red)
                        .font(.system(size: 11))
                    Text(entry.isSupremeGoalDone ? "Supreme Goal: Done ✓" : "Supreme Goal: Incomplete ⏳")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(entry.isSupremeGoalDone ? .green : .red)
                        .lineLimit(1)
                }

                // Row 2: Incomplete Habits Status Reminder
                HStack(spacing: 5) {
                    Image(systemName: entry.incompleteHabitsCount == 0 && entry.totalHabitsCount > 0 ? "checkmark.circle.fill" : "bolt.circle.fill")
                        .foregroundColor(entry.incompleteHabitsCount == 0 && entry.totalHabitsCount > 0 ? .green : Color(red: 234/255, green: 179/255, blue: 8/255))
                        .font(.system(size: 11))
                    Text(entry.incompleteHabitsCount == 0 && entry.totalHabitsCount > 0
                         ? "Habits: All \(entry.totalHabitsCount) Conquered ✓"
                         : "Habits: \(entry.completedHabitsCount)/\(entry.totalHabitsCount) (\(entry.incompleteHabitsCount) Incomplete ⏳)")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(entry.incompleteHabitsCount == 0 && entry.totalHabitsCount > 0 ? .green : Color(red: 234/255, green: 179/255, blue: 8/255))
                        .lineLimit(1)
                }

                // AI Motivation / Roast Quote
                Text("\"\(entry.aiMotivation)\"")
                    .font(.system(size: 10, weight: .medium, design: .serif))
                    .italic()
                    .foregroundColor(Color(red: 201/255, green: 209/255, blue: 217/255))
                    .lineLimit(2)
            }
        }
        .padding(10)
    }
}

// MARK: - Widget Definition
@main
struct StreakWidget: Widget {
    let kind: String = "StreakWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StreakTimelineProvider()) { entry in
            StreakWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Streak & Supreme Goal Tracker")
        .description("Keep track of your active day streak, today's Supreme Goal completion, and incomplete habits.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
