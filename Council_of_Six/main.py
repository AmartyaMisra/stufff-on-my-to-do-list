"""
Council of Six v2.2 - Military Grade Edition
Complete implementation with all features
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, filedialog
import json
import sqlite3
import threading
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import sys
import gc
import random

try:
    from llama_cpp import Llama
    LLAMA_AVAILABLE = True
except ImportError:
    LLAMA_AVAILABLE = False

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


class PersonaEngine:
    def __init__(self, model_path: Optional[Path] = None):
        self.llm = None
        self.model_loaded = False
        self.personas = {}
        self.load_personas()
        if model_path and model_path.exists() and LLAMA_AVAILABLE:
            self.load_model(model_path)
    
    def load_personas(self):
        personas_file = Path("personas.json")
        if personas_file.exists():
            with open(personas_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.personas = {p['name']: p for p in data.get('personas', [])}
        else:
            self.personas = {}
    
    def load_model(self, model_path: Path):
        try:
            print(f"[TACTICAL] Loading: {model_path.name}")
            self.llm = Llama(model_path=str(model_path), n_ctx=2048, n_threads=4, 
                           n_batch=512, n_gpu_layers=0, verbose=False)
            self.model_loaded = True
            print("[TACTICAL] Matrix online")
            return True
        except Exception as e:
            print(f"[ERROR] {e}")
            return False
    
    def generate_response(self, persona_name: str, user_input: str, 
                         context: str = "", debate_context: str = "") -> Dict:
        persona = self.personas.get(persona_name)
        if not persona:
            return {"text": "Offline", "confidence": 0.0}
        if self.model_loaded and self.llm:
            return self._generate_llm(persona, user_input, context, debate_context)
        return self._generate_fallback(persona)
    
    def _generate_llm(self, persona, user_input, context, debate_context):
        try:
            prompt = f"{persona['system_prompt']}\n\n"
            if debate_context:
                prompt += f"Debate:\n{debate_context}\n\n"
            if context:
                prompt += f"Context: {context}\n\n"
            prompt += f"User: {user_input}\n{persona['name']}:"
            
            response = self.llm(prompt, max_tokens=persona['max_tokens'],
                              temperature=persona['temperature'],
                              stop=["\n\n", "User:"], echo=False)
            return {"text": response['choices'][0]['text'].strip(), "confidence": 0.8}
        except:
            return self._generate_fallback(persona)
    
    def _generate_fallback(self, persona):
        responses = ["I see your point.", "Interesting perspective.", "Noted."]
        return {"text": random.choice(responses), "confidence": 0.5}
    
    def conduct_debate(self, user_input: str, initial: List[Dict], rounds=3) -> List[Dict]:
        log = list(initial)
        positions = {r['persona']: r['text'] for r in initial}
        
        for rnd in range(rounds):
            stances = self._analyze_stances(log)
            pairs = self._create_pairs(stances)
            
            for challenger_name, target_name in pairs:
                if challenger_name not in self.personas or target_name not in self.personas:
                    continue
                
                challenger = self.personas[challenger_name]
                target = self.personas[target_name]
                
                prompt = f"{challenger['system_prompt']}\n\n{target_name} said: \"{positions.get(target_name, '')}\"\nChallenge them.\n{challenger_name}:"
                
                if self.model_loaded and self.llm:
                    try:
                        resp = self.llm(prompt, max_tokens=challenger['max_tokens'],
                                      temperature=challenger['temperature'],
                                      stop=["\n\n"], echo=False)
                        text = resp['choices'][0]['text'].strip()
                    except:
                        text = f"{target_name}, I disagree with that position."
                else:
                    text = f"{target_name}, that's flawed logic."
                
                log.append({"persona": challenger_name, "text": text, "confidence": 0.8,
                          "round": rnd+1, "type": "challenge", "target": target_name})
                positions[challenger_name] = text
                
                if random.random() < 0.8:
                    counter_prompt = f"{target['system_prompt']}\n\n{challenger_name} said: \"{text}\"\nRespond.\n{target_name}:"
                    if self.model_loaded and self.llm:
                        try:
                            resp = self.llm(counter_prompt, max_tokens=target['max_tokens'],
                                          temperature=target['temperature'],
                                          stop=["\n\n"], echo=False)
                            counter = resp['choices'][0]['text'].strip()
                        except:
                            counter = f"{challenger_name}, I maintain my position."
                    else:
                        counter = f"{challenger_name}, I hear you but disagree."
                    
                    log.append({"persona": target_name, "text": counter, "confidence": 0.7,
                              "round": rnd+1, "type": "counter", "target": challenger_name})
                    positions[target_name] = counter
        
        return log
    
    def _analyze_stances(self, log):
        stances = {"support": [], "oppose": [], "neutral": []}
        support_words = ['yes','agree','should','right','support','good','must','recommend']
        oppose_words = ['no','disagree','wrong','oppose','against','avoid','dangerous']
        
        for entry in log:
            if entry.get('type') != 'initial':
                continue
            text = entry['text'].lower()
            persona = entry['persona']
            sup = sum(1 for w in support_words if w in text)
            opp = sum(1 for w in oppose_words if w in text)
            
            if sup > opp:
                stances["support"].append(persona)
            elif opp > sup:
                stances["oppose"].append(persona)
            else:
                stances["neutral"].append(persona)
        
        while len(stances["neutral"]) > 3:
            n = stances["neutral"].pop()
            if len(stances["support"]) <= len(stances["oppose"]):
                stances["support"].append(n)
            else:
                stances["oppose"].append(n)
        return stances
    
    def _create_pairs(self, stances):
        pairs = []
        sup = stances["support"][:]
        opp = stances["oppose"][:]
        neu = stances["neutral"][:]
        random.shuffle(sup)
        random.shuffle(opp)
        random.shuffle(neu)
        
        for i in range(min(4, max(len(sup), len(opp)))):
            if i < len(sup) and i < len(opp):
                pairs.append((sup[i], opp[i]))
            elif i < len(sup) and opp:
                pairs.append((sup[i], opp[i % len(opp)]))
            elif i < len(opp) and sup:
                pairs.append((sup[i % len(sup)], opp[i]))
        
        for n in neu[:2]:
            others = sup + opp
            if others:
                pairs.append((n, random.choice(others)))
        
        if len(pairs) < 3:
            all_p = list(self.personas.keys())
            random.shuffle(all_p)
            while len(pairs) < 3 and len(all_p) >= 2:
                pairs.append((all_p.pop(), all_p.pop()))
        
        return pairs


class ConversationMemory:
    def __init__(self, db="council_memory.db"):
        self.conn = sqlite3.connect(db, check_same_thread=False)
        self.init_db()
    
    def init_db(self):
        c = self.conn.cursor()
        c.execute("""CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, user_input TEXT,
            persona_name TEXT, response TEXT, confidence REAL,
            debate_round INTEGER DEFAULT 0, response_type TEXT DEFAULT 'initial')""")
        c.execute("""CREATE TABLE IF NOT EXISTS votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, user_input TEXT,
            persona_name TEXT, vote TEXT, reasoning TEXT)""")
        self.conn.commit()
    
    def save_debate(self, user_input, log):
        c = self.conn.cursor()
        ts = datetime.now().isoformat()
        for e in log:
            c.execute("INSERT INTO conversations VALUES (NULL,?,?,?,?,?,?,?)",
                     (ts, user_input, e['persona'], e['text'], e['confidence'],
                      e.get('round',0), e.get('type','initial')))
        self.conn.commit()
    
    def save_votes(self, user_input, votes):
        c = self.conn.cursor()
        ts = datetime.now().isoformat()
        for v in votes:
            c.execute("INSERT INTO votes VALUES (NULL,?,?,?,?,?)",
                     (ts, user_input, v['persona'], v['vote'], v.get('reasoning','')))
        self.conn.commit()
    
    def get_recent_context(self, limit=5):
        c = self.conn.cursor()
        c.execute("SELECT persona_name, response FROM conversations WHERE response_type='initial' ORDER BY id DESC LIMIT ?", (limit,))
        return "\n".join([f"{r[0]}: {r[1]}" for r in reversed(c.fetchall())])
    
    def export_transcript(self, path):
        c = self.conn.cursor()
        c.execute("SELECT timestamp, user_input, persona_name, response, debate_round, response_type FROM conversations ORDER BY id")
        with open(path, 'w', encoding='utf-8') as f:
            f.write("COUNCIL OF SIX - TRANSCRIPT\n\n")
            curr = None
            for row in c.fetchall():
                if row[1] != curr:
                    curr = row[1]
                    f.write(f"\n{'='*60}\n[{row[0]}]\nQUERY: {row[1]}\n{'='*60}\n\n")
                rnd = f" [ROUND {row[4]}]" if row[4] > 0 else ""
                typ = f" [{row[5].upper()}]" if row[5] != 'initial' else ""
                f.write(f"{row[2]}{rnd}{typ}: {row[3]}\n\n")
    
    def close(self):
        if self.conn:
            self.conn.close()


class MilitaryGUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("COUNCIL OF SIX v2.2")
        self.root.geometry("1400x900")
        self.root.configure(bg='#000000')
        
        self.colors = {'bg':'#000000','panel':'#0a0a0a','border':'#00ff00',
                      'text':'#00ff00','highlight':'#00ffff','user':'#00ffff'}
        
        self.engine = None
        self.memory = ConversationMemory()
        self.online_mode = tk.BooleanVar(value=False)
        self.processing = False
        self.osc_active = False
        
        self.setup_ui()
        self.init_engine()
        self.start_osc()
    
    def setup_ui(self):
        main = tk.Frame(self.root, bg=self.colors['bg'])
        main.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        hdr = tk.Frame(main, bg=self.colors['bg'], highlightbackground=self.colors['border'], highlightthickness=2)
        hdr.pack(fill=tk.X, pady=(0,5))
        tk.Label(hdr, text="◢◣ COUNCIL OF SIX v2.2 - TACTICAL COMMAND ◢◣",
                bg=self.colors['bg'], fg=self.colors['border'], font=('Courier New',16,'bold')).pack(pady=10)
        tk.Label(hdr, text="[CLASSIFIED] NEURAL DEBATE MATRIX ACTIVE",
                bg=self.colors['bg'], fg=self.colors['highlight'], font=('Courier New',9)).pack()
        
        content = tk.Frame(main, bg=self.colors['bg'])
        content.pack(fill=tk.BOTH, expand=True)
        
        left = tk.Frame(content, bg=self.colors['panel'], highlightbackground=self.colors['border'], highlightthickness=1)
        left.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0,3))
        tk.Label(left, text="[ TACTICAL FEED ]", bg=self.colors['panel'], fg=self.colors['text'],
                font=('Courier New',10,'bold')).pack(pady=5)
        
        self.chat = scrolledtext.ScrolledText(left, wrap=tk.WORD, bg='#000000', fg='#00ff00',
                                              font=('Courier New',9), insertbackground='#00ff00',
                                              selectbackground='#003300')
        self.chat.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.chat.tag_config("user", foreground="#00ffff", font=('Courier New',9,'bold'))
        self.chat.tag_config("system", foreground="#ffff00", font=('Courier New',8,'italic'))
        self.chat.tag_config("vote", foreground="#00ff00", font=('Courier New',9,'bold'))
        
        right = tk.Frame(content, bg=self.colors['panel'], highlightbackground=self.colors['border'],
                        highlightthickness=1, width=300)
        right.pack(side=tk.RIGHT, fill=tk.Y, padx=(3,0))
        right.pack_propagate(False)
        
        tk.Label(right, text="[ NEURAL ACTIVITY ]", bg=self.colors['panel'], fg=self.colors['text'],
                font=('Courier New',9,'bold')).pack(pady=5)
        self.osc = tk.Canvas(right, bg='#000000', height=100, highlightthickness=0)
        self.osc.pack(fill=tk.X, padx=5, pady=5)
        
        tk.Label(right, text="[ ACTIVE PERSONAS ]", bg=self.colors['panel'], fg=self.colors['text'],
                font=('Courier New',9,'bold')).pack(pady=5)
        pf = tk.Frame(right, bg='#000000')
        pf.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        sb = tk.Scrollbar(pf, bg='#000000')
        sb.pack(side=tk.RIGHT, fill=tk.Y)
        self.plist = tk.Listbox(pf, bg='#000000', fg='#00ff00', font=('Courier New',8),
                               selectbackground='#003300', yscrollcommand=sb.set, highlightthickness=0)
        self.plist.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        sb.config(command=self.plist.yview)
        
        tk.Label(right, text="[ MISSION CONTROL ]", bg=self.colors['panel'], fg=self.colors['text'],
                font=('Courier New',9,'bold')).pack(pady=5)
        ctrl = tk.Frame(right, bg=self.colors['panel'])
        ctrl.pack(fill=tk.X, padx=5)
        tk.Checkbutton(ctrl, text="◉ RECON MODE", variable=self.online_mode, bg=self.colors['panel'],
                      fg=self.colors['text'], selectcolor='#000000', font=('Courier New',8),
                      activebackground=self.colors['panel']).pack(anchor=tk.W, pady=2)
        tk.Button(ctrl, text="⚡ EXPORT", command=self.export, bg='#0a0a0a', fg=self.colors['text'],
                 font=('Courier New',8), relief=tk.FLAT, borderwidth=1).pack(fill=tk.X, pady=2)
        tk.Button(ctrl, text="⊗ CLEAR", command=self.clear, bg='#0a0a0a', fg='#ffff00',
                 font=('Courier New',8), relief=tk.FLAT, borderwidth=1).pack(fill=tk.X, pady=2)
        
        inp_f = tk.Frame(main, bg=self.colors['bg'])
        inp_f.pack(fill=tk.X, pady=(5,0))
        tk.Label(inp_f, text="[ TACTICAL QUERY ]", bg=self.colors['bg'], fg=self.colors['text'],
                font=('Courier New',8)).pack(anchor=tk.W)
        inp_c = tk.Frame(inp_f, bg=self.colors['bg'])
        inp_c.pack(fill=tk.X)
        self.inp = tk.Entry(inp_c, bg='#000000', fg='#00ffff', font=('Courier New',11),
                           insertbackground='#00ffff', selectbackground='#003333', relief=tk.FLAT, borderwidth=2)
        self.inp.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0,5))
        self.inp.bind('<Return>', lambda e: self.send())
        self.btn = tk.Button(inp_c, text="► TRANSMIT", command=self.send, bg='#0a0a0a',
                            fg='#00ff00', font=('Courier New',10,'bold'), relief=tk.FLAT, borderwidth=2, width=12)
        self.btn.pack(side=tk.RIGHT)
        
        stat_f = tk.Frame(main, bg=self.colors['bg'], highlightbackground=self.colors['border'], highlightthickness=1)
        stat_f.pack(fill=tk.X, pady=(5,0))
        self.status = tk.StringVar(value="[INITIALIZING...]")
        tk.Label(stat_f, textvariable=self.status, bg='#000000', fg='#00ff00',
                font=('Courier New',8), anchor=tk.W).pack(fill=tk.X, padx=5, pady=3)
    
    def start_osc(self):
        self.osc_active = True
        self.osc_data = [50]*150
        self.anim_osc()
    
    def anim_osc(self):
        if not self.osc_active:
            return
        self.osc_data.pop(0)
        self.osc_data.append(50 + random.randint(-30 if self.processing else -5, 30 if self.processing else 5))
        self.osc.delete("all")
        w = self.osc.winfo_width() or 290
        for i in range(0,100,20):
            self.osc.create_line(0,i,w,i,fill='#001100',width=1)
        pts = []
        for i,v in enumerate(self.osc_data):
            pts.extend([(i/len(self.osc_data))*w, v])
        if len(pts)>=4:
            self.osc.create_line(pts,fill='#00ff00',width=2,smooth=True)
        self.root.after(50, self.anim_osc)
    
    def init_engine(self):
        mp = Path("models/dolphin-2_6-phi-2.Q4_K_M.gguf")
        if not mp.exists():
            mp = Path("models/mistral-7b-instruct-v0.2.Q4_K_M.gguf")
        
        self.log_sys("◢ INITIALIZING NEURAL MATRIX...")
        self.log_sys("◢ LOADING 12 TACTICAL PERSONAS...")
        
        if mp.exists():
            self.engine = PersonaEngine(mp)
            if self.engine.model_loaded:
                self.log_sys("◢ NEURAL MATRIX ONLINE")
                self.log_sys("◢ DEBATE PROTOCOLS ACTIVE")
                self.status.set("[READY] ALL SYSTEMS NOMINAL")
            else:
                self.engine = PersonaEngine()
                self.log_sys("⚠ SIMULATOR MODE")
                self.status.set("[SIMULATOR] LIMITED")
        else:
            self.engine = PersonaEngine()
            self.log_sys("⚠ NO MODEL DETECTED")
            self.status.set("[SIMULATOR] NO MODEL")
        
        for i,n in enumerate(self.engine.personas.keys(),1):
            self.plist.insert(tk.END, f"[{i:02d}] {n}")
    
    def log_sys(self, msg):
        self.chat.insert(tk.END, f"{msg}\n", "system")
        self.chat.see(tk.END)
        self.root.update_idletasks()
    
    def log_user(self, msg):
        self.chat.insert(tk.END, f"\n[OPERATOR] {msg}\n", "user")
        self.chat.insert(tk.END, f"{'─'*70}\n", "system")
        self.chat.see(tk.END)
    
    def log_persona(self, name, msg, rnd=0, typ="initial"):
        prefix = f"[ROUND {rnd}] " if rnd > 0 else ""
        p = self.engine.personas.get(name, {})
        color = p.get('color', '#00ff00')
        tag = f"p_{name}"
        self.chat.tag_config(tag, foreground=color)
        self.chat.insert(tk.END, f"{prefix}[{name}] ", tag)
        if typ == "counter":
            self.chat.insert(tk.END, "(COUNTER): ")
        self.chat.insert(tk.END, f"{msg}\n\n")
        self.chat.see(tk.END)
    
    def log_vote(self, votes):
        self.chat.insert(tk.END, "\n"+"═"*70+"\n", "vote")
        self.chat.insert(tk.END, "[ DEMOCRATIC VOTE - FINAL CONSENSUS ]\n", "vote")
        self.chat.insert(tk.END, "═"*70+"\n", "vote")
        for p,v in votes.items():
            sym = {"support":"✓ SUPPORT","oppose":"✗ OPPOSE","abstain":"◆ ABSTAIN"}.get(v['vote'],"◆")
            self.chat.insert(tk.END, f"[{p}] {sym}\n")
            if v.get('reasoning'):
                self.chat.insert(tk.END, f"  └─ {v['reasoning']}\n")
        sup = sum(1 for v in votes.values() if v['vote']=='support')
        opp = sum(1 for v in votes.values() if v['vote']=='oppose')
        abst = sum(1 for v in votes.values() if v['vote']=='abstain')
        self.chat.insert(tk.END, f"\n{'─'*70}\n", "vote")
        self.chat.insert(tk.END, f"TALLY: ✓{sup} | ✗{opp} | ◆{abst}\n", "vote")
        result = "APPROVED" if sup>opp else "REJECTED" if opp>sup else "DEADLOCK"
        self.chat.insert(tk.END, f"CONSENSUS: {result}\n", "vote")
        self.chat.insert(tk.END, "═"*70+"\n\n", "vote")
        self.chat.see(tk.END)
    
    def send(self):
        txt = self.inp.get().strip()
        if not txt or self.processing:
            return
        self.log_user(txt)
        self.inp.delete(0, tk.END)
        self.processing = True
        self.status.set("[PROCESSING]...")
        self.btn.config(state='disabled')
        threading.Thread(target=self.process, args=(txt,), daemon=True).start()
    
    def process(self, txt):
        try:
            ctx = self.memory.get_recent_context(3)
            self.root.after(0, self.log_sys, "\n◢ PHASE 1: INITIAL ANALYSIS")
            
            init = []
            plist = list(self.engine.personas.keys())
            for i,n in enumerate(plist,1):
                self.root.after(0, self.status.set, f"[ANALYZING] {n} ({i}/{len(plist)})")
                r = self.engine.generate_response(n, txt, ctx, "")
                init.append({"persona":n,"text":r['text'],"confidence":r['confidence'],"round":0,"type":"initial"})
                self.root.after(0, self.log_persona, n, r['text'])
            
            self.root.after(0, self.log_sys, "\n◢ PHASE 2: DEBATE INITIATED")
            self.root.after(0, self.status.set, "[DEBATING]...")
            
            st = self.engine._analyze_stances(init)
            self.root.after(0, self.log_sys, f"[DEBUG] Support:{len(st['support'])} Oppose:{len(st['oppose'])} Neutral:{len(st['neutral'])}")
            
            dlog = self.engine.conduct_debate(txt, init, 3)
            deb = [e for e in dlog if e.get('type') in ['challenge','counter']]
            self.root.after(0, self.log_sys, f"[DEBUG] {len(deb)} debate exchanges")
            
            for e in dlog:
                if e.get('type')=='challenge':
                    self.root.after(0, self.log_persona, e['persona'], e['text'], e.get('round',0), 'challenge')
                elif e.get('type')=='counter':
                    self.root.after(0, self.log_persona, e['persona'], e['text'], e.get('round',0), 'counter')
            
            self.root.after(0, self.log_sys, "\n◢ PHASE 3: VOTING")
            self.root.after(0, self.status.set, "[VOTING]...")
            
            votes = self.vote(txt, dlog)
            self.root.after(0, self.log_vote, votes)
            
            self.memory.save_debate(txt, dlog)
            self.memory.save_votes(txt, [{"persona":k,**v} for k,v in votes.items()])
        except Exception as e:
            self.root.after(0, self.log_sys, f"⚠ ERROR: {e}")
        finally:
            self.processing = False
            self.root.after(0, lambda: self.btn.config(state='normal'))
            self.root.after(0, self.status.set, "[READY]")
            gc.collect()
    
    def vote(self, txt, dlog):
        votes = {}
        for pn in self.engine.personas.keys():
            pr = [e for e in dlog if e['persona']==pn]
            if not pr:
                votes[pn] = {"vote":"abstain","reasoning":"No position"}
                continue
            all_txt = " ".join([r['text'].lower() for r in pr])
            sup = sum(1 for w in ['yes','agree','support','should'] if w in all_txt)
            opp = sum(1 for w in ['no','disagree','oppose','against'] if w in all_txt)
            if sup > opp and sup > 1:
                votes[pn] = {"vote":"support","reasoning":pr[-1]['text'][:80]+"..."}
            elif opp > sup and opp > 1:
                votes[pn] = {"vote":"oppose","reasoning":pr[-1]['text'][:80]+"..."}
            else:
                votes[pn] = {"vote":"abstain","reasoning":"Insufficient evidence"}
        return votes
    
    def export(self):
        path = filedialog.asksaveasfilename(defaultextension=".txt",
                                           filetypes=[("Text","*.txt")],
                                           title="Export Log")
        if path:
            self.memory.export_transcript(path)
            self.log_sys(f"◢ EXPORTED: {path}")
    
    def clear(self):
        if messagebox.askyesno("Confirm", "Clear feed?"):
            self.chat.delete(1.0, tk.END)
            self.log_sys("◢ CLEARED")
    
    def run(self):
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)
        self.root.mainloop()
    
    def on_close(self):
        self.osc_active = False
        self.memory.close()
        self.root.destroy()


if __name__ == "__main__":
    app = MilitaryGUI()
    app.run()