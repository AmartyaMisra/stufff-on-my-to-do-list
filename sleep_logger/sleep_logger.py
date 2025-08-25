#!/usr/bin/env python3
import json
import os
import argparse
from datetime import datetime, timedelta

LOG_FILE = "sleep_log.json"

def load_log():
    if not os.path.exists(LOG_FILE):
        return []
    with open(LOG_FILE, "r") as f:
        return json.load(f)

def save_log(data):
    with open(LOG_FILE, "w") as f:
        json.dump(data, f, indent=4)

def log_sleep(sleep_time, wake_time):
    log = load_log()
    entry = {
        "sleep_time": sleep_time.isoformat(),
        "wake_time": wake_time.isoformat(),
        "duration_hours": round((wake_time - sleep_time).total_seconds() / 3600, 2)
    }
    log.append(entry)
    save_log(log)
    print(f"✅ Logged: Slept at {sleep_time}, Woke at {wake_time} ({entry['duration_hours']}h)")

def view_history():
    log = load_log()
    if not log:
        print("⚠️ No sleep data found. Start logging first.")
        return

    print("\n📊 Sleep History (last 7 logs):")
    for entry in log[-7:]:
        print(f" - Slept {entry['sleep_time']} → Woke {entry['wake_time']} | {entry['duration_hours']}h")

    avg = sum(e['duration_hours'] for e in log[-7:]) / min(7, len(log))
    print(f"\n📈 Average sleep (last 7 nights): {avg:.2f}h")

def give_advice():
    log = load_log()
    if not log:
        print("⚠️ No data to analyze yet.")
        return

    avg = sum(e['duration_hours'] for e in log[-7:]) / min(7, len(log))

    print("\n💡 Sleep Advice:")
    if avg < 6:
        print(" - You're sleeping too little. Aim for 7-9 hours. Avoid caffeine late in the day.")
    elif 6 <= avg < 8:
        print(" - Good job! You're within a healthy range. Keep your schedule consistent.")
    elif avg >= 9:
        print(" - You may be oversleeping. Consider setting a consistent wake-up alarm.")
    else:
        print(" - Mixed pattern detected. Try going to bed and waking up at fixed times.")

def main():
    parser = argparse.ArgumentParser(description="🛌 Sleep Pattern Logger with Advice")
    subparsers = parser.add_subparsers(dest="command")

    log_parser = subparsers.add_parser("log", help="Log a new sleep entry")
    log_parser.add_argument("sleep", help="Sleep time (YYYY-MM-DD HH:MM)")
    log_parser.add_argument("wake", help="Wake time (YYYY-MM-DD HH:MM)")

    subparsers.add_parser("history", help="View last 7 sleep logs")
    subparsers.add_parser("advice", help="Get sleep advice based on history")

    args = parser.parse_args()

    if args.command == "log":
        sleep_time = datetime.strptime(args.sleep, "%Y-%m-%d %H:%M")
        wake_time = datetime.strptime(args.wake, "%Y-%m-%d %H:%M")
        log_sleep(sleep_time, wake_time)
    elif args.command == "history":
        view_history()
    elif args.command == "advice":
        give_advice()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
