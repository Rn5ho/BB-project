# Parses the Greek U-21 coach's weekly skill workbook (S72 weeks 6-14) into tidy CSVs.
# Greek headers map, in column order: JS JR OD HA DR PA IS ID RB SB ST FT EXP GS
# Usage: python parse_greek.py   (run from this directory)
import pandas as pd
import json, re, os

PATH = 'skillsets-gameshapes-s72.xlsx'
OUT = '.'
SKILL_COLS = ['JS','JR','OD','HA','DR','PA','IS','ID','RB','SB','ST','FT','EXP','GS']
POS_MAP = {'ΣΦ':'SF','ΠΦ':'PF','PG':'PG','SG':'SG','C':'C','SF':'SF','PF':'PF'}

xl = pd.ExcelFile(PATH)
rows, meta = [], {'ent': {}, 'notes': [], 'minutes': {}}
for name in xl.sheet_names:
    week = int(re.search(r'\d+', name).group())
    df = xl.parse(name, header=None)
    hdr = next(i for i in range(4) if (df.iloc[i] == 'ΣμΑ').any())
    hdr_vals = list(df.iloc[hdr])
    js_col = hdr_vals.index('ΣμΑ')
    has_pos = 'ΘΕΣΗ' in hdr_vals
    minutes_col = hdr_vals.index('ΛΕΠΤΑ') if 'ΛΕΠΤΑ' in hdr_vals else None
    for i in range(hdr + 1, len(df)):
        pname = df.iat[i, 0]
        if not isinstance(pname, str) or not pname.strip():
            continue
        if pname.strip().upper().startswith('ENT'):
            meta['ent'][week] = {'label': pname.strip(),
                                 'values': [str(v) for v in df.iloc[i, 1:4] if pd.notna(v)]}
            continue
        rec = {'player': pname.strip(), 'week': week,
               'position': POS_MAP.get(str(df.iat[i, js_col - 1]).strip()) if has_pos else None}
        for k, v in zip(SKILL_COLS, df.iloc[i, js_col:js_col + 14]):
            rec[k] = int(v) if pd.notna(v) and str(v).strip() != '' else None
        if minutes_col is not None and pd.notna(df.iat[i, minutes_col]):
            try: meta['minutes'].setdefault(week, {})[rec['player']] = int(df.iat[i, minutes_col])
            except Exception: pass
        for v in df.iloc[i, js_col + 14:]:
            if isinstance(v, str) and v.strip() and not re.match(r'^\d', v.strip()):
                meta['notes'].append({'week': week, 'player': rec['player'], 'note': v.strip()})
        rows.append(rec)

tidy = pd.DataFrame(rows)
tidy['TSP10'] = tidy[['JS','JR','OD','HA','DR','PA','IS','ID','RB','SB']].sum(axis=1)
tidy['OSP'] = tidy[['JS','JR','OD','HA','DR','PA']].sum(axis=1)
tidy['ISP'] = tidy[['IS','ID','RB','SB']].sum(axis=1)
tidy = tidy.sort_values(['player','week'])
tidy.to_csv(f'{OUT}/greek_tidy.csv', index=False)

deltas = []
for p, g in tidy.groupby('player'):
    g = g.sort_values('week'); prev = None
    for _, r in g.iterrows():
        if prev is not None:
            for k in SKILL_COLS[:12]:
                if pd.notna(r[k]) and pd.notna(prev[k]) and r[k] != prev[k]:
                    deltas.append({'player': p, 'skill': k, 'from_week': int(prev['week']),
                                   'to_week': int(r['week']), 'delta': int(r[k] - prev[k])})
        prev = r
pd.DataFrame(deltas).sort_values(['player','to_week']).to_csv(f'{OUT}/greek_deltas.csv', index=False)

summ = []
for p, g in tidy.groupby('player'):
    g = g.sort_values('week'); f, l = g.iloc[0], g.iloc[-1]
    pos = g['position'].dropna().iloc[-1] if g['position'].notna().any() else None
    s = {'player': p, 'position': pos, 'first_week': int(f['week']), 'last_week': int(l['week']),
         'weeks_observed': len(g), 'TSP10_first': int(f['TSP10']), 'TSP10_last': int(l['TSP10']),
         'TSP10_gain': int(l['TSP10'] - f['TSP10']), 'OSP_last': int(l['OSP']), 'ISP_last': int(l['ISP']),
         'GS_min': int(g['GS'].min()), 'GS_max': int(g['GS'].max()), 'GS_mean': round(g['GS'].mean(), 2)}
    for k in SKILL_COLS[:12]:
        s[f'{k}_first'], s[f'{k}_last'] = int(f[k]), int(l[k])
        s[f'{k}_gain'] = int(l[k] - f[k])
    summ.append(s)
pd.DataFrame(summ).sort_values('TSP10_last', ascending=False).to_csv(f'{OUT}/greek_summary.csv', index=False)
with open(f'{OUT}/greek_meta.json', 'w', encoding='utf-8') as fh:
    json.dump(meta, fh, ensure_ascii=False, indent=1)
print('players:', tidy.player.nunique(), 'rows:', len(tidy), 'pop events:', len(deltas))
