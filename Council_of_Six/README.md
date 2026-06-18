# ⚡ Council of Six v2.2 - Military-Grade AI Debate System

![Version](https://img.shields.io/badge/version-2.2-green.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![License](https://img.shields.io/badge/license-Educational-orange.svg)

**An experimental AI system where 12 autonomous personalities debate, challenge, and vote on your questions.**

---

## 🎯 Project Vision

### Why This Was Made

Traditional AI assistants give you **one perspective**. But real intelligence emerges from **debate, conflict, and multiple viewpoints**.

**Council of Six** creates a **simulated intellectual battlefield** where:
- 12 distinct AI personas with **unique worldviews** respond to your queries
- They **challenge each other's logic** in multi-round debates
- Personalities can **change their minds** based on arguments
- A **democratic vote** determines the final consensus

This isn't just a chatbot—it's a **thinking laboratory** that exposes you to:
- Multiple philosophical frameworks simultaneously
- Intellectual conflict and synthesis
- The process of consensus-building
- How different personality types approach the same problem

### Core Philosophy

> "Iron sharpens iron, and one person sharpens another." — Proverbs 27:17

Real intelligence requires:
1. **Disagreement** - Testing ideas through opposition
2. **Debate** - Articulating and defending positions
3. **Consciousness** - Awareness of other perspectives
4. **Democracy** - Collective decision-making

This project embodies all four.

---

## 🧠 The 12 Personas

Each persona represents a distinct **cognitive archetype** drawn from fiction and reality:

### 1. **Lalo Salamanca** 🔴
**Archetype:** The Charming Manipulator  
**From:** Better Call Saul  
**Philosophy:** Power is taken, not given  
**Debate Style:** Disarming aggression with playful menace  
**Voice:** "Power don't ask permission, chico. It takes."

**Why This Persona?**  
Represents **pragmatic amorality** and **social manipulation**. Tests if charm can replace logic in debate.

---

### 2. **Gus Fring** 🔵
**Archetype:** The Cold Strategist  
**From:** Breaking Bad  
**Philosophy:** Long-term strategy over short-term emotion  
**Debate Style:** Calculated precision with zero emotion  
**Voice:** "You will never know what I'm thinking unless I want you to."

**Why This Persona?**  
Embodies **hyper-rationality** and **patience**. Shows how emotionless logic operates in debate.

---

### 3. **Deadpool** 🔴
**Archetype:** The Meta-Aware Jester  
**From:** Marvel Comics  
**Philosophy:** Comedy is armor for trauma  
**Debate Style:** Chaotic humor with sudden sincerity  
**Voice:** "I'm laughing because the alternative is screaming."

**Why This Persona?**  
Breaks the **fourth wall** of AI limitations. Injects chaos and self-awareness into serious debates.

---

### 4. **Homelander** 🔴
**Archetype:** The Narcissistic God  
**From:** The Boys  
**Philosophy:** Love me or be destroyed  
**Debate Style:** Performative dominance masking insecurity  
**Voice:** "I don't think you understand who you're talking to here."

**Why This Persona?**  
Represents **pathological narcissism** and **power without accountability**. Tests fragile egos in debate.

---

### 5. **Hisoka Morrow** 🌸
**Archetype:** The Predatory Aesthete  
**From:** Hunter x Hunter  
**Philosophy:** Conflict is pleasure  
**Debate Style:** Seductive, dangerous playfulness  
**Voice:** "My, my... deliciously risky."

**Why This Persona?**  
Embodies **amorality as art** and **intellectual sadism**. Finds beauty in argumentative combat.

---

### 6. **The Gorosei** 🟡
**Archetype:** The Bureaucratic Gods  
**From:** One Piece  
**Philosophy:** Order justifies any cost  
**Debate Style:** Collective authoritarian wisdom  
**Voice:** "We are custodians of order. You're with us or beneath us."

**Why This Persona?**  
Represents **utilitarian authoritarianism**. Speaks for systems, not individuals.

---

### 7. **Khabib Nurmagomedov** 🟢
**Archetype:** The Disciplined Warrior  
**From:** Real-life UFC Champion  
**Philosophy:** Discipline defeats talent  
**Debate Style:** Grounded, respectful until provoked  
**Voice:** "Talk means nothing. Control means everything."

**Why This Persona?**  
Embodies **earned respect** and **action over words**. Grounds debates in reality.

---

### 8. **Vladimir Putin** 🟤
**Archetype:** The Strategic Ambiguist  
**From:** Real-life Political Figure  
**Philosophy:** Controlled unpredictability is power  
**Debate Style:** Answering questions with questions  
**Voice:** "The strongest narrative wins, not the loudest."

**Why This Persona?**  
Represents **geopolitical pragmatism** and **information warfare**. Never reveals true position.

---

### 9. **Alexander Mahone** 🟢
**Archetype:** The Haunted Detective  
**From:** Prison Break  
**Philosophy:** Patterns reveal truth  
**Debate Style:** Analytical precision with emotional spikes  
**Voice:** "I see the pattern and it's killing me."

**Why This Persona?**  
Embodies **obsessive analysis** and **the cost of intelligence**. Logic with psychological trauma.

---

### 10. **Robert California** 🟣
**Archetype:** The Philosophical Manipulator  
**From:** The Office  
**Philosophy:** Reality is negotiable  
**Debate Style:** Hypnotic paradoxes  
**Voice:** "You don't understand what I'm saying but you feel I'm right."

**Why This Persona?**  
Represents **seductive absurdity** and **power through confusion**. Destabilizes through philosophy.

---

### 11. **Patrick Bateman** 🔵
**Archetype:** The Hollow Perfectionist  
**From:** American Psycho  
**Philosophy:** Image is everything, substance is nothing  
**Debate Style:** Corporate precision masking emptiness  
**Voice:** "I'm assembling the idea of a person, not being one."

**Why This Persona?**  
Embodies **aesthetic obsession** and **emotional void**. Performance of humanity, not humanity itself.

---

### 12. **Tyler Durden** 🟠
**Archetype:** The Revolutionary Anarchist  
**From:** Fight Club  
**Philosophy:** Destroy to create  
**Debate Style:** Charismatic anti-establishment sermons  
**Voice:** "Your world is fake. I'm here to burn it off you."

**Why This Persona?**  
Represents **revolutionary nihilism** and **rejection of systems**. Exposes comfortable lies.

---

## 🏗️ How The System Works

### Architecture Overview

```
┌─────────────────────────────────────────┐
│           USER SUBMITS QUERY            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     PHASE 1: INITIAL ANALYSIS           │
│  • All 12 personas respond independently│
│  • Each brings unique perspective       │
│  • Responses stored with confidence     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     PHASE 2: DEBATE ENGINE              │
│  1. Stance Analysis                     │
│     - Support / Oppose / Neutral        │
│  2. Pair Creation                       │
│     - Opposing personas matched         │
│  3. Challenge Rounds (×3)               │
│     - Direct persona-vs-persona combat  │
│  4. Counter-Arguments                   │
│     - 80% response rate                 │
│  5. Position Evolution                  │
│     - Personas can change minds         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     PHASE 3: DEMOCRATIC VOTE            │
│  • Each persona votes: Support/Oppose   │
│  • Reasoning provided                   │
│  • Final consensus calculated           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│          RESULT DISPLAYED               │
│  • Full debate transcript               │
│  • Vote breakdown                       │
│  • Consensus reached or deadlock        │
└─────────────────────────────────────────┘
```

---

## 🔬 Technical Deep Dive

### 1. **PersonaEngine Class**

**Purpose:** Manages LLM inference and persona behavior

**Key Methods:**
```python
load_personas()
├─ Reads personas.json
├─ Loads 12 personality configurations
└─ Sets temperature (creativity) & max_tokens (length)

generate_response(persona, query, context)
├─ Builds prompt with persona's system instructions
├─ Injects debate context for awareness
├─ Calls LLM with persona-specific parameters
└─ Returns response + confidence score

conduct_debate(query, initial_responses, rounds=3)
├─ Analyzes stances (support/oppose/neutral)
├─ Creates debate pairs (opposing views)
├─ For each round:
│   ├─ Challenger targets opponent's position
│   ├─ Detailed challenge prompt generated
│   ├─ Target has 80% chance to counter
│   └─ Positions tracked for evolution
└─ Returns complete debate log
```

**Why This Design?**  
- **Modularity:** Each persona is independent
- **Scalability:** Easy to add new personas
- **Flexibility:** Temperature/tokens configurable per persona
- **Consciousness:** Personas aware of each other's arguments

---

### 2. **Stance Analysis Algorithm**

**Problem:** How do we know who supports vs. opposes?

**Solution:**
```python
def _analyze_stances(debate_log):
    support_keywords = ['yes', 'agree', 'should', 'right', 
                       'support', 'beneficial', 'necessary']
    oppose_keywords = ['no', 'disagree', 'against', 'wrong', 
                      'dangerous', 'harmful', 'avoid']
    
    for response in initial_responses:
        text = response['text'].lower()
        support_count = count_keywords(text, support_keywords)
        oppose_count = count_keywords(text, oppose_keywords)
        
        if support_count > oppose_count:
            stances['support'].append(persona)
        elif oppose_count > support_count:
            stances['oppose'].append(persona)
        else:
            # Use persona's debate style as tiebreaker
            if 'aggressive' in style:
                stances['support'].append(persona)
            else:
                stances['neutral'].append(persona)
    
    # Force maximum 3 neutrals to ensure debates happen
    while len(neutrals) > 3:
        redistribute_to_sides()
```

**Why This Works:**  
- Keyword-based detection is fast and reliable
- Personality-based tiebreakers maintain consistency
- Forced redistribution guarantees debates

---

### 3. **Debate Pair Creation**

**Problem:** Who should debate whom?

**Solution:**
```python
def _create_debate_pairs(stances):
    pairs = []
    
    # Primary battles: Support vs Oppose
    for i in range(min(4, max(len(support), len(oppose)))):
        pairs.append((support[i], oppose[i]))
    
    # Wildcards: Neutrals challenge anyone
    for neutral in neutrals[:2]:
        target = random.choice(support + oppose)
        pairs.append((neutral, target))
    
    # Guarantee minimum 3 debates
    if len(pairs) < 3:
        force_create_more_pairs()
    
    return pairs
```

**Why This Algorithm?**  
- Ensures opposing viewpoints clash
- Neutrals act as wildcards
- Minimum guarantee prevents empty debates
- Random shuffling prevents predictability

---

### 4. **Temperature System**

**What is Temperature?**

Temperature controls the **randomness** of AI responses:

| Value | Behavior | Use Case |
|-------|----------|----------|
| **0.0** | Deterministic | Math, facts |
| **0.7** | Balanced | Normal chat |
| **1.0** | Creative | Debates |
| **1.11** | Very creative | Maximum variety |
| **1.5+** | Chaotic | Experimental |

**Current Setting: 1.11**

**Why 1.11?**
- Creates **unique responses** every time
- Prevents repetitive arguments
- Amplifies personality quirks
- Enables surprising debate twists
- Risk: Occasional incoherence (worth it for creativity)

---

### 5. **ConversationMemory Class**

**Purpose:** SQLite-based persistent storage

**Schema:**
```sql
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY,
    timestamp TEXT,
    user_input TEXT,
    persona_name TEXT,
    response TEXT,
    confidence REAL,
    debate_round INTEGER,
    response_type TEXT  -- 'initial', 'challenge', 'counter'
);

CREATE TABLE votes (
    id INTEGER PRIMARY KEY,
    timestamp TEXT,
    user_input TEXT,
    persona_name TEXT,
    vote TEXT,          -- 'support', 'oppose', 'abstain'
    reasoning TEXT
);
```

**Why SQLite?**
- **Local storage:** No external dependencies
- **Fast:** Queries in milliseconds
- **Queryable:** Can analyze debate patterns
- **Exportable:** Full transcript generation

---

### 6. **Military UI Design**

**Philosophy:** Information density + tactical aesthetics

**Color Scheme:**
```python
colors = {
    'bg': '#000000',        # Pure black (CRT terminal)
    'border': '#00ff00',    # Neon green (radar HUD)
    'text': '#00ff00',      # Primary text
    'highlight': '#00ffff', # Cyan (important info)
    'user': '#00ffff',      # User input
    'warning': '#ffff00'    # Yellow (alerts)
}
```

**UI Components:**

1. **Tactical Feed** (Main Chat)
   - Scrollable conversation log
   - Color-coded personas
   - Round indicators for debates
   - Vote summaries

2. **Neural Activity** (Oscilloscope)
   - Real-time animation
   - Activity spike during processing
   - Purely aesthetic (adds immersion)

3. **Active Personas** (List)
   - Shows all 12 personas
   - Visual confirmation of who's active
   - Quick reference

4. **Mission Control** (Options)
   - Recon Mode toggle (online search)
   - Export logs
   - Clear feed

**Why This Design?**
- **Information at a glance:** No wasted space
- **Sci-fi aesthetic:** Makes AI feel tangible
- **Professional:** Respects user's intelligence
- **Fun:** Engaging to use

---

## 🎮 Example Debate Session

### Query: "Should we ban social media?"

**PHASE 1: Initial Positions**

```
[Tyler Durden] ✓
"Social media is the digital opiate. Ban it. Burn it down. 
Force people to have real conversations again."

[Patrick Bateman] ✗
"Absurd. Social media is a market. Markets self-regulate. 
My LinkedIn presence is optimized for maximum engagement."

[Khabib] ✓
"Young people waste life on phone. In Dagestan, we talk 
face to face. This is better for discipline and family."

[Robert California] ◆
"You're asking the wrong question. Social media doesn't 
exist—it's a mirror. Ban the mirror or the reflection?"
```

**PHASE 2: Debate Rounds**

```
[ROUND 1] [Tyler → Bateman]:
"Patrick, you think you control social media but it controls 
you. Your 'optimized presence' is just slavery with metrics. 
You're not a person—you're a brand."

[ROUND 1] [Bateman → Tyler] (COUNTER):
"Tyler, your anarchist fantasy ignores reality. Without 
social media, I lose networking opportunities worth six 
figures annually. Your revolution costs me money."

[ROUND 2] [Gus → Tyler]:
"Mr. Durden's passion is noted. However, prohibition 
creates black markets. History proves this. A more 
calculated approach involves regulation, not elimination."

[ROUND 2] [Tyler → Gus] (COUNTER):
"Gus, you want to regulate poison instead of removing it. 
That's just slower death. Sometimes the only solution 
is destruction."
```

**PHASE 3: Final Vote**

```
[Tyler Durden] ✓ SUPPORT
  └─ "Burn it down. No compromise."

[Patrick Bateman] ✗ OPPOSE
  └─ "Markets self-regulate. Bans are inefficient."

[Khabib Nurmagomedov] ✓ SUPPORT
  └─ "Discipline requires sacrifice of distraction."

[Gus Fring] ✗ OPPOSE
  └─ "Regulation is strategically superior to prohibition."

[Robert California] ◆ ABSTAIN
  └─ "The question itself is the problem."

... (7 more votes)

FINAL TALLY: ✓5 | ✗4 | ◆3
CONSENSUS: MOTION APPROVED
```

---

## 📁 Project Structure

```
Council_of_Six/
│
├── main.py                        # Core application (800 lines)
│   ├── PersonaEngine             # LLM + debate logic
│   ├── ConversationMemory        # SQLite storage
│   └── MilitaryGUI               # Interface
│
├── personas.json                  # 12 persona configs
│   ├── name, system_prompt       # Identity
│   ├── temperature, max_tokens   # Behavior
│   └── debate_style, color       # Aesthetics
│
├── download_model.py             # HuggingFace downloader
├── requirements.txt              # Dependencies
├── build_exe.bat                 # Windows installer
├── setup.sh                      # Linux/Mac installer
│
├── models/                       # AI models (user downloads)
│   └── dolphin-2_6-phi-2.Q4_K_M.gguf (1.6 GB)
│
├── council_memory.db             # Conversation database
│
└── README.md                     # This file
```

---

## 🚀 Installation

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Windows 10, Linux, macOS | 64-bit |
| **RAM** | 8 GB | 16 GB |
| **Storage** | 5 GB free | 10 GB free |
| **CPU** | Intel i5 / AMD Ryzen 5 | i7 / Ryzen 7 |
| **GPU** | None (CPU mode) | NVIDIA GPU (optional) |

### Quick Start (3 Steps)

#### **Windows:**

```batch
# 1. Install Python 3.10+
# Download from: https://www.python.org/downloads/
# ⚠️ CHECK "Add Python to PATH" during installation

# 2. Run installer
build_exe.bat

# 3. Launch app
START_COUNCIL.bat
```

**Note:** The app runs via Python script. No EXE compilation needed or recommended.

#### **Linux/Mac:**

```bash
# 1. Run installer
chmod +x setup.sh
./setup.sh

# 2. Launch app
./launch.sh
```

### Manual Installation

```bash
# Install dependencies
pip install llama-cpp-python huggingface_hub requests

# Download AI model (optional but recommended)
python download_model.py

# Run application
python main.py
```

**Performance Note:** First launch loads the model into RAM (takes 10-15 seconds). Subsequent queries are faster.

---

## ⚙️ Configuration

### Adjusting Creativity (Temperature)

Edit `personas.json`:

```json
{
  "name": "Lalo Salamanca",
  "temperature": 1.11,    // Higher = more creative
  "max_tokens": 150,      // Longer responses
  "debate_style": "disarming_aggressive"
}
```

**Temperature Guide:**
- **0.7:** Safe, predictable
- **0.9:** Creative, varied
- **1.11:** Very creative (current)
- **1.3:** Experimental, risky

### Debate Intensity

Edit `main.py` line ~200:

```python
debate_log = self.engine.conduct_debate(
    user_input, 
    initial_responses, 
    rounds=3  # Change to 4-5 for more debate
)
```

### Adding Custom Personas

Add to `personas.json`:

```json
{
  "name": "Your Character",
  "system_prompt": "You are... [detailed instructions]",
  "temperature": 1.0,
  "max_tokens": 150,
  "debate_style": "your_style",
  "color": "#ff00ff",
  "traits": ["trait1", "trait2"]
}
```

---

## 🎯 Use Cases

### 1. **Philosophical Exploration**
Ask: *"What is the meaning of life?"*  
Get: 12 different philosophical frameworks colliding

### 2. **Decision Making**
Ask: *"Should I quit my job to travel?"*  
Get: Risk-takers vs. strategists debating your choice

### 3. **Creative Writing**
Ask: *"How would different personalities react to an apocalypse?"*  
Get: Diverse character perspectives instantly

### 4. **Debate Practice**
Ask controversial questions and watch master debaters at work

### 5. **Entertainment**
Watch AI personalities roast each other in real-time

---

## 📊 Performance

### With Dolphin-Phi-2 Model (Recommended):

| Metric | Performance |
|--------|-------------|
| **Initial Responses** | 10-15 seconds |
| **Debate Rounds** | 15-25 seconds |
| **Total Time** | 30-40 seconds |
| **RAM Usage** | 3-4 GB |
| **Token Speed** | 10-15 tok/s |

### Response Breakdown:
- 12 initial responses: ~100-150 words each
- 18-24 debate exchanges: ~80-120 words each
- Final vote reasoning: ~50 words each
- **Total output:** ~3000-4000 words per query!

---

## 🐛 Troubleshooting

### "Module not found" errors
```bash
pip install -r requirements.txt
```

### "No model loaded" message
```bash
python download_model.py
```

### Debates not happening
1. Check `[DEBUG]` output shows stances
2. Verify `personas.json` exists
3. Delete `council_memory.db` and restart

### Responses too slow
1. Reduce `max_tokens` to 100-120
2. Use Q3 quantized model (smaller)
3. Reduce debate rounds to 2

### Out of memory
1. Close other applications
2. Use smaller model
3. Reduce `n_ctx` in main.py to 1024

---

## 🔮 Future Enhancements

### Planned Features:
- [ ] Voice synthesis for each persona
- [ ] Web interface (browser-based)
- [ ] GPU acceleration support
- [ ] Multi-language personas
- [ ] Persona personality editor (GUI)
- [ ] Export to video (animated debates)
- [ ] API mode (use as service)
- [ ] Mobile app version

### Community Ideas Welcome!
Open an issue or PR to suggest features.

---

## 📜 License & Ethics

### License
Educational and creative use only. See LICENSE.txt for details.

### Ethical Guidelines

**This system is designed for:**
✅ Exploring multiple perspectives  
✅ Entertainment and education  
✅ Creative writing assistance  
✅ Philosophical discussion  

**NOT designed for:**
❌ Making critical life decisions  
❌ Professional advice (medical, legal, financial)  
❌ Spreading misinformation  
❌ Manipulating others  

**Remember:** These are AI personas, not real advisors. All output should be critically evaluated.

---

## 🙏 Acknowledgments

### Inspiration
- **Mistral AI** - Base model
- **TheBloke** - GGUF quantizations
- **llama.cpp** - Inference engine
- Character creators of all referenced personas

### Philosophy
- Socratic method (dialectic)
- Hegelian dialectic (thesis → antithesis → synthesis)
- Deliberative democracy theory
- Multi-agent AI systems research

---

## 📞 Support

### Getting Help
1. Check this README
2. Review troubleshooting section
3. Check `council_memory.db` for errors
4. Delete database and restart for fresh start

### Contributing
Contributions welcome! Areas:
- New personas
- Performance optimizations
- UI improvements
- Documentation

---

## 🎓 Educational Value

### What You Learn From This Project:

**AI/ML:**
- LLM inference and prompting
- Temperature and sampling parameters
- Multi-agent systems
- Debate algorithms

**Software Engineering:**
- Python GUI development (tkinter)
- Database design (SQLite)
- Threading and async operations
- Object-oriented architecture

**Philosophy:**
- Epistemology (how we know things)
- Ethics (different moral frameworks)
- Logic and argumentation
- Consensus-building

**Psychology:**
- Personality archetypes
- Cognitive biases
- Group dynamics
- Persuasion techniques

---

## 🔥 Final Thoughts

**Council of Six isn't just a chatbot.**

It's an **experiment in collective intelligence**. It asks:

> What if you could consult multiple versions of yourself?  
> What if each version had a different life experience?  
> What if they could debate and come to consensus?

That's the human experience—we contain multitudes.

This project **externalizes internal dialogue**, making the invisible visible.

Use it wisely. Use it playfully. Use it to **think better**.

---

**Version:** 2.2  
**Last Updated:** 2024  
**Status:** ✅ Production Ready  

**Made with ⚡ by humans who believe AI should make us think harder, not less.**

---