import Foundation
import WidgetKit
import React

@objc(WidgetBridgeModule)
class WidgetBridgeModule: NSObject {
  private let appGroupId = "group.com.streaktracker.app"

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc(updateWidgetData:resolver:rejecter:)
  func updateWidgetData(
    _ data: NSDictionary,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: appGroupId) else {
      reject("E_APP_GROUP", "Failed to access shared App Group suite: \(appGroupId)", nil)
      return
    }

    if let streak = data["streakCount"] as? Int {
      defaults.set(streak, forKey: "streakCount")
    }
    if let title = data["challengeTitle"] as? String {
      defaults.set(title, forKey: "challengeTitle")
    }
    if let status = data["status"] as? String {
      defaults.set(status, forKey: "status")
    }
    if let motivation = data["aiMotivation"] as? String {
      defaults.set(motivation, forKey: "aiMotivation")
    }

    // Supreme Goal & Daily Habits Progress
    if let isSupremeDone = data["isSupremeGoalDone"] as? Bool {
      defaults.set(isSupremeDone, forKey: "isSupremeGoalDone")
    }
    if let completedHabits = data["completedHabitsCount"] as? Int {
      defaults.set(completedHabits, forKey: "completedHabitsCount")
    }
    if let totalHabits = data["totalHabitsCount"] as? Int {
      defaults.set(totalHabits, forKey: "totalHabitsCount")
    }
    if let incompleteHabits = data["incompleteHabitsCount"] as? Int {
      defaults.set(incompleteHabits, forKey: "incompleteHabitsCount")
    }

    defaults.synchronize()

    // Trigger instant WidgetKit reload
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }

    resolve(["success": true])
  }
}
