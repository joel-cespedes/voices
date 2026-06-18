import csv, pandas as pd
df = pd.read_excel("voices.xlsx", header=None)
df = df[df[1].notna()]
with open("index.csv","w",newline="",encoding="utf-8-sig") as f:
    w = csv.writer(f); w.writerow(["numero","archivo","en","es"])
    for i,(_,row) in enumerate(df.iterrows(), 1):
        en = str(row[1]).strip()
        es = str(row[2]).strip() if df.shape[1] > 2 and pd.notna(row[2]) else ""
        w.writerow([i, f"{i:04d}.mp3", en, es])
print(f"index.csv: {len(df)} frases")
