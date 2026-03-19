# IPL Decision Analytics System (IPL Solver) 🏏📊

A comprehensive, end-to-end data analytics platform designed to solve the complexity of player performance tracking and strategic decision-making in the Indian Premier League (IPL).

---

## 🚀 The Problem Statement
Every IPL season generates a massive amount of data. With hundreds of players competing, it becomes nearly impossible for team owners, scouts, and fans to track individual performances manually. 

**The Challenges:**
- **Data Overload:** Managing thousands of records across batting, bowling, and all-rounder categories.
- **Metric Fragmentation:** Comparing a batter's Strike Rate and Average against a bowler's Dot Ball % and Economy in a unified way.
- **Strategic Blindness:** Identifying who the "Superstars" really are versus "Wildcards" or "Replacement Level" players.
- **Auction Pressure:** Making high-stakes decisions during auctions without a clear, data-backed performance baseline.

---

## 💡 Our Solution
We built the **IPL Decision Analytics System** to transform raw match data into actionable insights. This platform provides a centralized hub for scouting, comparison, and squad optimization.

### **How it Helps:**
1. **Automated Scouting:** Instantly filter and find top performers in any category (Openers, Finishers, Death Bowlers).
2. **Visual Comparisons:** Use Radar Charts and Scatter Plots to see how players stack up against league-leading benchmarks.
3. **Strategic Categorization:** The **Player Matrix** automatically classifies players into performance clusters (Superstar, Anchor, Wildcard).
4. **Smart Squad Building:** Our **Magic Fill** 🪄 feature uses randomized elite selection algorithms to generate balanced, high-performance teams that respect IPL rules (like the 4-overseas limit).
5. **Auction Readiness:** Helps owners identify "Hot Picks" and undervalued talent before the next auction.

---

## ✨ Key Features

### **1. Advanced Scouting Registry**
- Comprehensive stats for Batting (Runs, SR, Boundaries, Consistency).
- Deep-dive Bowling metrics (Wickets, Economy, Dot Ball %, Overs-to-Balls conversion).
- All-Rounder impact scoring.

### **2. Player Matchup Performance Registry**
- Side-by-side comparison of two players.
- Dynamic **Radar Charts** that normalize performance across multiple metrics.
- Identifies who has the edge in specific roles.

### **3. Strategic Player Matrix**
- A 2D Scatter Plot mapping **Consistency** vs. **Explosiveness**.
- Dynamic median lines based on the current season's mean performance.
- Automated clustering into: **Superstars, Anchors, Wildcards, and Replacement Level.**

### **4. Dream Team & Magic Fill** 🪄
- Interactive squad drafting tool.
- **Magic Fill:** An algorithmic generator that drafts a balanced 11-player squad (2 Openers, 3 Middle Order, 1 Finisher, 2 All-rounders, 3 Bowlers).
- Enforces IPL constraints (Max 4 Overseas players).
- Real-time **Squad Strength Rating** and composition analysis.

---

## 🛠️ Technical Stack

**Backend:**
- **Python / Flask:** Scalable API development.
- **Pandas & NumPy:** High-performance data processing and statistical normalization.
- **PostgreSQL (Neon):** Cloud-native relational database for match statistics and user data.
- **Scrapy/BeautifulSoup:** Automated data extraction from match registries.

**Frontend:**
- **React 18:** Modern, component-based UI.
- **Tailwind CSS:** Utility-first styling for a sleek, dark-themed dashboard.
- **Recharts:** High-end data visualization (Radar, Scatter, Bar, Line charts).
- **Framer Motion:** Smooth, pro-grade animations and transitions.

---

## 🛠️ Setup & Installation

### **Prerequisites**
- Python 3.9+
- Node.js 18+
- PostgreSQL Database

### **1. Backend Setup**
```bash
cd ipl-backend
pip install -r requirements.txt
python app.py
```

### **2. Frontend Setup**
```bash
cd ipl-frontend
npm install
npm run dev
```

---

## 🎯 Conclusion
The **IPL Solver** isn't just a stats viewer—it's a decision-support system. By applying advanced analytical scoring and visualization to massive IPL datasets, we empower users to make smarter, data-driven choices for the tournament and the auction table.
