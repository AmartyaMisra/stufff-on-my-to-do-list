# Sleep Logger 🛌

A simple command-line tool to track your sleep patterns and get personalized sleep advice. Built with Python, it helps you monitor your sleep duration and provides insights to improve your sleep habits.

## ✨ Features

- **Easy Logging**: Quickly log your sleep and wake times
- **History Tracking**: View your recent sleep patterns
- **Smart Advice**: Get personalized sleep recommendations based on your data
- **JSON Storage**: All data stored in a simple JSON format for easy backup
- **Command Line Interface**: Simple and intuitive CLI for daily use

## 🚀 Quick Start

### Prerequisites
- Python 3.6 or higher

### Installation
1. Clone or download the sleep_logger folder
2. Navigate to the sleep_logger directory
3. Run the script directly (no installation required)

### Usage Examples

**Log a new sleep entry:**
```bash
python sleep_logger.py log "2025-01-15 23:30" "2025-01-16 07:15"
```

**View your sleep history:**
```bash
python sleep_logger.py history
```

**Get sleep advice:**
```bash
python sleep_logger.py advice
```

**See all available commands:**
```bash
python sleep_logger.py --help
```

## 📊 Data Format

Sleep data is stored in `sleep_log.json` with the following structure:
```json
[
    {
        "sleep_time": "2025-01-15T23:30:00",
        "wake_time": "2025-01-16T07:15:00",
        "duration_hours": 7.75
    }
]
```

## 💡 Sleep Advice Algorithm

The tool analyzes your last 7 nights of sleep and provides recommendations:

- **< 6 hours**: Warning about insufficient sleep
- **6-8 hours**: Positive reinforcement for healthy range
- **> 9 hours**: Suggestion to avoid oversleeping
- **Inconsistent**: Recommendation for consistent schedule

## 🛠️ Commands

| Command | Description | Example |
|---------|-------------|---------|
| `log` | Log a new sleep entry | `log "2025-01-15 23:30" "2025-01-16 07:15"` |
| `history` | View last 7 sleep logs | `history` |
| `advice` | Get personalized sleep advice | `advice` |

## 📁 File Structure

```
sleep_logger/
├── sleep_logger.py    # Main application script
├── sleep_log.json     # Sleep data storage
├── README.md          # This file
└── .gitignore         # Git ignore rules
```

## 🔧 Customization

You can easily modify the script to:
- Change the number of days analyzed (currently 7)
- Adjust sleep duration recommendations
- Add new analysis features
- Export data to different formats

## 🚨 Troubleshooting

**Common Issues:**
- **Date Format**: Use "YYYY-MM-DD HH:MM" format for dates
- **File Permissions**: Ensure you have write access to the directory
- **Python Version**: Make sure you're using Python 3.6+

## 📈 Future Enhancements

Potential improvements:
- Sleep quality ratings
- Sleep debt tracking
- Export to CSV/Excel
- Web interface
- Sleep schedule recommendations
- Integration with health apps

## 🤝 Contributing

Feel free to submit issues or pull requests to improve this tool!

## 📜 License

MIT License - feel free to use and modify as needed.

---

**Happy sleeping! 😴**