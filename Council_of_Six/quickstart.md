# ⚡ Council of Six - Quick Start Guide

**Get up and running in 5 minutes!**

---

## 🎯 What You Need

- ✅ Computer (Windows 10/11, Linux, or macOS)
- ✅ 8 GB RAM minimum
- ✅ 5 GB free disk space
- ✅ Internet connection (for setup only)

---

## 🚀 Installation (3 Steps)

### **Windows**

1. **Install Python 3.10+**
   - Download: https://www.python.org/downloads/
   - ⚠️ **Important:** Check "Add Python to PATH" during installation

2. **Run the installer**
   ```
   Double-click: build_exe.bat
   ```
   - Wait 10-20 minutes (downloads ~1.6 GB AI model)
   - You'll need a free HuggingFace token: https://huggingface.co/settings/tokens

3. **Launch the app**
   ```
   Double-click: dist\Council_of_Six.exe
   ```

---

### **Linux/Mac**

1. **Run the installer**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   - Wait 10-20 minutes
   - Enter HuggingFace token when prompted

2. **Launch the app**
   ```bash
   ./launch.sh
   ```

---

## 🎮 How to Use

### Basic Usage

1. **Type your question** in the input box at the bottom
2. **Press Enter** or click "► TRANSMIT"
3. **Wait 30-40 seconds** while the AI processes
4. **Read the results:**
   - Phase 1: All 12 personas give their initial opinion
   - Phase 2: They debate each other (20+ exchanges)
   - Phase 3: Final democratic vote

### Example Questions

Try these to see the system in action:

```
Should I quit my job to travel the world?
Is artificial intelligence dangerous?
Should we colonize Mars?
What is the meaning of life?
Is democracy failing?
Should I invest in cryptocurrency?
```

---

## 🎭 The 12 Personas

Your council consists of:

1. **Lalo Salamanca** - Charming manipulator
2. **Gus Fring** - Cold strategist
3. **Deadpool** - Meta-aware jester
4. **Homelander** - Narcissistic god
5. **Hisoka Morrow** - Predatory aesthete
6. **The Gorosei** - Bureaucratic rulers
7. **Khabib Nurmagomedov** - Disciplined warrior
8. **Vladimir Putin** - Strategic ambiguist
9. **Alexander Mahone** - Haunted detective
10. **Robert California** - Philosophical manipulator
11. **Patrick Bateman** - Hollow perfectionist
12. **Tyler Durden** - Revolutionary anarchist

Each has a unique perspective and debate style!

---

## ⚙️ Options

### Recon Mode (Online)
- Check the box to enable internet search
- Personas can look up current information
- Slightly slower but more informed

### Export
- Click "⚡ EXPORT LOG" to save your conversation
- Creates a readable text file of the entire debate

### Clear Feed
- Click "⊗ CLEAR FEED" to reset the conversation window
- (Database memory persists)

---

## 🔧 Troubleshooting

### "Python not found"
**Solution:** Install Python from python.org and check "Add to PATH"

### "No model loaded - running in simulator mode"
**What this means:** The AI model didn't download. App still works with pre-written responses.

**To fix:** Run `python download_model.py` and enter your HuggingFace token

### App is slow (60+ seconds)
**This is normal!** Your CPU is running a 1.6 GB AI model 12 times, plus debates.

**To speed up:**
1. Close other applications
2. Edit `personas.json` and reduce `max_tokens` to 100
3. Use a smaller model

### Personas don't debate
**Check for DEBUG lines:**
```
[DEBUG] Support:X Oppose:Y Neutral:Z
[DEBUG] Generated N debate exchanges
```

If you see `Generated 0 debates`, delete `council_memory.db` and restart.

---

## 💡 Tips for Best Results

### Ask Open-Ended Questions
❌ "What is 2+2?"
✅ "Should we value logic over emotion?"

### Controversial Topics = Better Debates
- Politics
- Philosophy
- Ethics
- Social norms
- Existential questions

### Let It Run
The first response might be slow (~60 sec) as the model loads into memory. Subsequent queries are faster (~30-40 sec).

### Re-ask Questions
With temperature at 1.11, asking the same question twice gives completely different answers!

---

## 📊 What to Expect

### Typical Session

```
YOU: "Should I start a business?"

PHASE 1: 12 initial responses (15 seconds)
  - Each persona gives their take
  - ~1500 words total

PHASE 2: Debate (20 seconds)
  - 20+ debate exchanges
  - Personas challenge each other
  - ~2000 words of arguments

PHASE 3: Vote (instant)
  - Each persona votes with reasoning
  - Final tally displayed
  - Consensus or deadlock

TOTAL: ~3500 words in 35-40 seconds
```

---

## 🎯 Understanding the Output

### Color Coding
Each persona has a unique color for easy identification:
- 🔴 Red: Lalo, Deadpool, Homelander
- 🔵 Blue: Gus, Bateman
- 🟢 Green: Khabib, Mahone
- 🟡 Yellow: The Gorosei
- 🟣 Purple: Robert California
- 🟠 Orange: Tyler Durden
- 🌸 Pink: Hisoka

### Vote Symbols
- ✓ **SUPPORT** - Agrees with the proposition
- ✗ **OPPOSE** - Disagrees with the proposition
- ◆ **ABSTAIN** - Neutral or insufficient evidence

### Debate Indicators
- `[ROUND 1]` - First debate round
- `(COUNTER)` - Response to a challenge
- `[DEBUG]` - System information (can ignore)

---

## 🚫 What NOT to Use This For

❌ Medical advice  
❌ Legal advice  
❌ Financial decisions  
❌ Emergency situations  
❌ Critical life choices without verification  

**Remember:** These are AI personas, not real experts. Always verify important information!

---

## 🎓 Learning Resources

### Want to understand how it works?
Read the full **README.md** for:
- Technical deep dive
- Architecture explanation
- Persona psychology
- Configuration options

### Want to customize?
Edit **personas.json** to:
- Adjust creativity (temperature)
- Change response length (max_tokens)
- Modify personality descriptions

---

## 📞 Getting Help

### Common Issues
1. Check this guide's troubleshooting section
2. Read README.md for detailed info
3. Delete `council_memory.db` and restart (fixes most issues)
4. Verify all files are in the correct location

### Files You Should Have
```
Council_of_Six/
├── main.py
├── personas.json
├── download_model.py
├── requirements.txt
├── build_exe.bat (Windows)
├── setup.sh (Linux/Mac)
├── README.md
├── QUICKSTART.md (this file)
└── models/
    └── dolphin-2_6-phi-2.Q4_K_M.gguf
```

---

## 🎉 You're Ready!

**That's it!** You now have:
- ✅ 12 AI personalities ready to debate
- ✅ A working interface
- ✅ Everything configured optimally

**Go ask them something interesting!** 🚀

---

**Quick Commands Reference:**

| Action | Command |
|--------|---------|
| **Launch (Windows)** | `dist\Council_of_Six.exe` |
| **Launch (Linux/Mac)** | `./launch.sh` |
| **Download model** | `python download_model.py` |
| **Run without compiling** | `python main.py` |
| **View logs** | Check `council_memory.db` |

---

**For full documentation, see README.md**

**For technical details, see the code comments in main.py**

**For updates and issues, check the project repository**