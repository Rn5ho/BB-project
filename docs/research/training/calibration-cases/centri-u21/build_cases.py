"""Convert Centri U-21 parsed series into repo ReplayCase JSON files.

Emits one case per (player, staff-segment) — the engine takes a single staff config
per case, and these coaches upgraded staff mid-series.

Two alignment variants (the reports' cards could show state before or after the
week's training): align=N   -> pops between card N-1 and card N caused by training N
                  align=N+1 -> ... caused by training N+1
Run the replay scorer on both; the correct alignment wins on pop recall.
"""
import pandas as pd, json, os, sys

PARSED = r"C:\Users\Rn5ho\Downloads\centri-u21\parsed"
OUTBASE = r"C:\ClaudeProjects\BB-project\docs\research\training\calibration-cases\centri-u21"
SKILLS = ['js','jr','od','ha','dr','pa','is','id','rb','sb']

series = pd.read_csv(os.path.join(PARSED, 'series.csv'), encoding='utf-8-sig')
weeks = pd.read_csv(os.path.join(PARSED, 'weeks.csv'), encoding='utf-8-sig')

def lvl(x):
    try: return int(float(x))
    except Exception: return None

def staff_key(w):
    return (lvl(w.get('coach_level')), lvl(w.get('youth_trainer_level')) or 0,
            lvl(w.get('training_court_level')) or 0)

def build(align_next: bool):
    outdir = OUTBASE + ('-alignNext' if align_next else '')
    os.makedirs(outdir, exist_ok=True)
    for f in os.listdir(outdir):
        if f.endswith('.json'): os.remove(os.path.join(outdir, f))
    made, skipped = [], []
    for (pid, author), g in series.groupby(['player_id', 'author']):
        g = g[g.week_no.notna()].sort_values('week_no')
        g = g[g.week_no > 0]                       # drop week-0 baselines
        if len(g) < 6: skipped.append((pid, author, f'only {len(g)} weeks')); continue
        wk = weeks[weeks.author == author].set_index('week_no')
        rows = g.to_dict('records')
        # segment by staff config of the training week that drives each transition
        segs, cur = [], []
        prev_staff = None
        for i in range(1, len(rows)):
            a, b = rows[i-1], rows[i]
            if b['week_no'] - a['week_no'] != 1:
                if cur: segs.append(cur); cur = []
                prev_staff = None
                continue                            # gap: interval not clean, break segment
            tw = b['week_no'] + (1 if align_next else 0)
            if tw not in wk.index:
                if cur: segs.append(cur); cur = []
                prev_staff = None
                continue
            w = wk.loc[tw]
            tk = lvl(w.get('training_key'))
            if tk is None:
                if cur: segs.append(cur); cur = []
                prev_staff = None
                continue
            st = staff_key(w)
            if prev_staff is not None and st != prev_staff:
                if cur: segs.append(cur)
                cur = []
            prev_staff = st
            pops = {k: int(b[k]) for k in SKILLS if int(b[k]) > int(a[k])}
            unmod = {}
            for k in ('st','ft'):
                if pd.notna(a.get(k)) and pd.notna(b.get(k)) and int(b[k]) > int(a[k]): unmod[k] = int(b[k])
            cur.append({'prev': a, 'row': b, 'trainingId': tk, 'staff': st,
                        'pops': pops, 'unmod': unmod, 'date': str(b['report_date'])[:10]})
        if cur: segs.append(cur)
        for si, seg in enumerate(segs):
            if len(seg) < 5: skipped.append((pid, author, f'segment {si} only {len(seg)} weeks')); continue
            first, last = seg[0]['prev'], seg[-1]['row']
            coach, yt, tc = seg[0]['staff']
            wks = []
            for s in seg:
                w = {'date': s['date'], 'trainingId': s['trainingId'], 'minutes': 48,
                     'observedPops': s['pops']}
                if s['unmod']: w['unmodeledPops'] = s['unmod']
                if int(s['row']['age']) != int(s['prev']['age']): w['ageAfterThis'] = int(s['row']['age'])
                wks.append(w)
            case = {
                'label': f"centri {first['player_name']} ({int(pid)}) {author} wk{int(first['week_no'])}-{int(last['week_no'])} coach{coach}/yt{yt}",
                'player': {
                    'startSkillsDisplayed': {k: int(first[k]) for k in SKILLS},
                    'age': int(first['age']), 'heightCm': int(first['height_cm']),
                    'potential': int(first['potential_num']) if pd.notna(first['potential_num']) else 8,
                    'startStamina': int(first['st']) if pd.notna(first['st']) else None,
                    'startFreeThrow': int(first['ft']) if pd.notna(first['ft']) else None,
                },
                'coachLevel': coach or 5, 'youthTrainerLevel': yt, 'gymLevel': 0, 'trainingCourtLevel': tc,
                'weeks': wks,
                'endSkillsDisplayed': {k: int(last[k]) for k in SKILLS},
            }
            name = f"{first['player_name'].replace(' ','_')}_{author}_seg{si}.json"
            with open(os.path.join(outdir, name), 'w', encoding='utf-8') as fh:
                json.dump(case, fh, ensure_ascii=False, indent=1)
            made.append((name, len(wks), sum(len(w['observedPops']) for w in wks)))
    return outdir, made, skipped

for align_next in (False, True):
    outdir, made, skipped = build(align_next)
    tot_w = sum(m[1] for m in made); tot_p = sum(m[2] for m in made)
    print(f"\n=== align={'N+1' if align_next else 'N'} -> {outdir}")
    print(f"cases: {len(made)}, weeks: {tot_w}, scored pops: {tot_p}")
    for m in made: print(f"  {m[0]}: {m[1]}wk {m[2]}pops")
    if skipped: print(f"  skipped: {skipped[:6]}{' ...' if len(skipped)>6 else ''}")
