# -*- coding: utf-8 -*-
"""Assemble BuzzerBeater card extractions + Discord report text into
per-player weekly skill series, training-week metadata, pop tables and a
calibration-readiness summary.

Outputs (in PARSED): series.csv, weeks.csv, pops.csv, history_pops.csv,
assembly_summary.json
"""
import json, glob, os, re, sys, unicodedata
from collections import defaultdict, Counter
import pandas as pd

PARSED = r"C:\Users\Rn5ho\Downloads\centri-u21\parsed"
CARDS = os.path.join(PARSED, "cards")
SKILLS = ["js", "jr", "od", "ha", "dr", "pa", "is", "id", "rb", "sb", "st", "ft"]
JOIN_WINDOW_MIN = 60.0
SAME_DAY_FALLBACK_MIN = 24 * 60.0   # late same-day card posts

# ---------------------------------------------------------------- helpers
def deacc(s):
    if s is None:
        return ""
    s = unicodedata.normalize("NFKD", str(s))
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower().strip()

CONF_RANK = {"high": 3, "medium": 2, "low": 1, None: 0}

# ---------------------------------------------------------------- load cards
cards = {}
for path in sorted(glob.glob(os.path.join(CARDS, "*.json"))):
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    cards[d.get("file") or os.path.basename(path)[:-5]] = d

# ---------------------------------------------------------------- load messages
def load_msgs(name, channel):
    df = pd.read_csv(os.path.join(PARSED, name), encoding="utf-8-sig")
    df["channel"] = channel
    df["ts"] = pd.to_datetime(df.timestamp_iso, format="ISO8601", utc=True)
    df["ts_local"] = pd.to_datetime(df.timestamp_iso, format="ISO8601").dt.tz_localize(None) \
        if False else df.timestamp_iso.str.slice(0, 10)
    return df

rep = load_msgs("reports.csv", "report-treninga")
dis = load_msgs("discussion.csv", "splosna-diskusija")
msgs = pd.concat([rep, dis], ignore_index=True).sort_values("ts").reset_index(drop=True)

# ---------------------------------------------------------------- training text parsing
POS_PATTERNS = [
    (r"\b(c\s*/\s*kc|kc\s*/\s*c|pf\s*[-/]\s*c|c\s*[-/]\s*pf)\b", "PF-C"),
    (r"\b(k\s*/\s*kc|kc\s*/\s*k|krila|kril|sf\s*[-/]\s*pf)\b", "SF-PF"),
    (r"\b(oi|pg|organizator)\b", "PG"),
    (r"\b(bo|pg\s*/\s*sg)\b", "PG-SG"),
    (r"\bkc\b", "PF"),
    (r"\bc\b", "C"),
]
TRAIN_PATTERNS = [
    (r"1\s*na\s*1|1na1|one on one", "One on One"),
    (r"oviranje\s+meta|blokad", "Shot Blocking"),
    (r"obramba\s+pod\s+kosem|\bopk\b", "Inside Defense"),
    (r"met\s+pod\s+kosem|\bmpk\b", "Inside Scoring"),
    (r"\bskok\b|skok\s+za", "Rebounding"),
    (r"podaj|\bpodaje\b", "Passing"),
    (r"met\s+iz\s+skoka", "Jump Shot"),
]
CATALOG = {
    ("One on One", "SF-PF"): 16, ("One on One", "PF"): 16,
    ("One on One", "PG-SG"): 15, ("One on One", "PG"): 15,
    ("Inside Defense", "C"): 24, ("Inside Defense", "PF-C"): 25,
    ("Shot Blocking", "C"): 29, ("Shot Blocking", "PF-C"): 30,
    ("Rebounding", "PF-C"): 27,
    ("Inside Scoring", "C"): 21, ("Inside Scoring", "PF-C"): 22,
    ("Passing", "PG"): 18,
    ("Jump Shot", "SF-PF"): 2,
}
HEAD_RE = re.compile(r"^\s*(\d+)\s*\.?\s*trening\s*:\s*", re.I)
BARE_HEAD_RE = re.compile(r"^\s*trening\s*:\s*", re.I)
COACH_RE = re.compile(r"(?<!mladinski )tren(?:er|eg)\s*:\s*(\d+|/)", re.I)
YOUTH_RE = re.compile(r"mladinski\s+trener\s*:\s*(\d+|/)", re.I)
FIT_RE = re.compile(r"fitnes\s*:\s*(\d+|/)", re.I)
COURT_RE = re.compile(r"trening\s+igrisce\s*:\s*(\d+|/)", re.I)


def lvl(m):
    if not m:
        return None
    v = m.group(1)
    return None if v == "/" else int(v)


def parse_report(raw):
    """-> dict(training_raw, training_name, position_group, training_key, minutes_note, levels)"""
    txt = str(raw)
    flat = deacc(txt)
    body = BARE_HEAD_RE.sub("", HEAD_RE.sub("", txt)).strip()
    # split off the staff tail
    tail_split = re.split(r",?\s*tren(?:er|eg)\s*:", body, maxsplit=1, flags=re.I)
    front = tail_split[0]
    parts = [p.strip() for p in front.split(",")]
    training_raw = parts[0] if parts else None
    minutes_note = ", ".join(parts[1:]).strip(" .") or None
    tflat = deacc(training_raw)
    name = next((n for pat, n in TRAIN_PATTERNS if re.search(pat, tflat)), None)
    pos = next((p for pat, p in POS_PATTERNS if re.search(pat, tflat)), None)
    key = CATALOG.get((name, pos)) if (name and pos) else None
    return dict(
        training_raw=training_raw,
        training_name=name,
        position_group=pos,
        training_key=key,
        minutes_note=minutes_note,
        coach_level=lvl(COACH_RE.search(flat)),
        youth_trainer_level=lvl(YOUTH_RE.search(flat)),
        fitness_level=lvl(FIT_RE.search(flat)),
        training_court_level=lvl(COURT_RE.search(flat)),
    )


REPORT_CH = "report-treninga"
wk_rows = []
for _, m in msgs[(msgs.week_no.notna()) & (msgs.channel == REPORT_CH)].iterrows():
    p = parse_report(m.raw_text)
    wk_rows.append(dict(
        author=m.author_name, week_no=int(m.week_no), week_no_source="reported",
        report_date=m.timestamp_iso[:10],
        report_ts=m.timestamp_iso, message_id=m.message_id, channel=m.channel, **p))

# --- unnumbered report-shaped messages: infer week_no from the author's 7-day cadence
UNNUM_RE = re.compile(r"trening\s*:", re.I)
inferred_weeks = []
anchors = defaultdict(list)
for r_ in wk_rows:
    anchors[r_["author"]].append((pd.Timestamp(r_["report_date"]), r_["week_no"]))
for _, m in msgs[(msgs.week_no.isna()) & (msgs.channel == REPORT_CH)].iterrows():
    txt = str(m.raw_text)
    if txt == "nan" or not UNNUM_RE.search(txt) or HEAD_RE.match(txt):
        continue
    p = parse_report(txt)
    if p["training_name"] is None:
        continue
    d = pd.Timestamp(m.timestamp_iso[:10])
    cand = anchors.get(m.author_name, [])
    if not cand:
        continue
    ad, aw = min(cand, key=lambda t: abs((d - t[0]).days))   # nearest numbered anchor
    est = aw + (d - ad).days / 7.0
    wk = int(round(est))
    inferred_weeks.append(dict(author=m.author_name, week_no=wk, est=round(est, 2),
                               anchor_week=aw, anchor_date=str(ad.date()),
                               report_date=m.timestamp_iso[:10], message_id=int(m.message_id),
                               training_raw=p["training_raw"], training_key=p["training_key"]))
    wk_rows.append(dict(
        author=m.author_name, week_no=wk, week_no_source="inferred_from_cadence",
        report_date=m.timestamp_iso[:10],
        report_ts=m.timestamp_iso, message_id=m.message_id, channel=m.channel, **p))

weeks = pd.DataFrame(wk_rows).sort_values(["author", "week_no"]).reset_index(drop=True)

# ---------------------------------------------------------------- image -> week join
img_rows = []
inferred_msgids = {r["message_id"] for r in inferred_weeks}
for _, m in msgs[msgs.attachment_count > 0].iterrows():
    files = [f.strip() for f in str(m.attachment_files).split(";") if f.strip()]
    for f in files:
        ow = int(m.week_no) if pd.notna(m.week_no) else None
        if ow is None and m.message_id in inferred_msgids:
            ow = next(r["week_no"] for r in inferred_weeks if r["message_id"] == m.message_id)
            rule = "same_message_inferred_week"
        else:
            rule = "same_message" if ow is not None else None
        img_rows.append(dict(file=f, message_id=m.message_id, author=m.author_name,
                             ts=m.ts, ts_iso=m.timestamp_iso, channel=m.channel,
                             own_week=ow, own_rule=rule))
imgs = pd.DataFrame(img_rows)

_wk = pd.DataFrame(wk_rows)
_wk["ts"] = pd.to_datetime(_wk.report_ts, format="ISO8601", utc=True)
wk_by_author = {a: g.sort_values("ts") for a, g in _wk.groupby("author")}


def assign_week(row):
    if row["channel"] != REPORT_CH:
        return None, None, "side_channel_not_joined"
    if row["own_week"] is not None and pd.notna(row["own_week"]):
        return int(row["own_week"]), row["ts_iso"][:10], row["own_rule"]
    g = wk_by_author.get(row["author"])
    if g is None or len(g) == 0:
        return None, None, "no_week_reports_by_author"
    delta = (row["ts"] - g["ts"]).dt.total_seconds() / 60.0   # +ve = image after report
    prev = delta[delta >= 0]
    nxt = delta[delta < 0]
    if len(prev) and prev.min() <= JOIN_WINDOW_MIN:
        i = prev.idxmin()
        return int(g.loc[i, "week_no"]), g.loc[i, "report_date"], "prev_within_60min"
    if not len(prev):
        # posted before the author's FIRST numbered report -> pre-season baseline
        i = nxt.idxmax()
        return 0, row["ts_iso"][:10], "pre_first_report_baseline_week0"
    if prev.min() <= SAME_DAY_FALLBACK_MIN:
        i = prev.idxmin()
        return int(g.loc[i, "week_no"]), g.loc[i, "report_date"], "prev_late_same_day"
    return None, None, "unjoined"


if len(imgs):
    assigned = imgs.apply(assign_week, axis=1, result_type="expand")
    imgs[["week_no", "report_date", "join_rule"]] = assigned

# ---------------------------------------------------------------- series
name_by_id, id_by_name = Counter(), {}
for d in cards.values():
    for p in d.get("players", []):
        if p.get("player_id"):
            name_by_id[(p["player_id"], p.get("name"))] += 1
canon_name, best = {}, defaultdict(lambda: (0, 0))
for (pid, nm), c in name_by_id.items():
    score = (c, len(nm))          # prefer frequent, then the diacritic-rich spelling
    if score > best[pid]:
        best[pid], canon_name[pid] = score, nm
for pid, nm in canon_name.items():
    id_by_name[deacc(nm)] = pid
for d in cards.values():          # cover spelling variants
    for p in d.get("players", []):
        if p.get("player_id"):
            id_by_name.setdefault(deacc(p.get("name")), p["player_id"])

ser_rows, unjoined_cards, no_id = [], [], []
for _, im in imgs.iterrows():
    d = cards.get(im["file"])
    if d is None:
        continue
    for p in d.get("players", []):
        pid = p.get("player_id")
        if pid is None:
            pid = id_by_name.get(deacc(p.get("name")))
            no_id.append((im["file"], p.get("name"), pid))
        nm = canon_name.get(pid, p.get("name"))
        if im["week_no"] is None or pd.isna(im["week_no"]):
            unjoined_cards.append(dict(file=im["file"], player=nm, author=im["author"],
                                       ts=im["ts_iso"], rule=im["join_rule"]))
            continue
        sk = p.get("skills") or {}
        ser_rows.append(dict(
            player_name=nm, player_id=pid, author=im["author"], week_no=int(im["week_no"]),
            report_date=im["report_date"], image_date=im["ts_iso"][:10],
            age=p.get("age"), height_cm=p.get("height_cm"), potential_num=p.get("potential_num"),
            potential_word=p.get("potential_word"),
            **{s: sk.get(s) for s in SKILLS},
            tsp=p.get("tsp_printed"), game_shape=p.get("game_shape"),
            experience=p.get("experience"), salary=p.get("salary"), dmi=p.get("dmi"),
            source_image=im["file"], confidence=p.get("confidence"),
            checksum_ok=p.get("tsp_checksum_ok"), join_rule=im["join_rule"],
            source_message_id=im["message_id"], source_channel=im["channel"]))

series = pd.DataFrame(ser_rows)
dup_report = []
if len(series):
    series["_conf"] = series.confidence.map(lambda c: CONF_RANK.get(c, 0))
    series["_chk"] = series.checksum_ok.fillna(False).astype(int)
    series["_sum"] = series[SKILLS].sum(axis=1)
    key = ["player_id", "author", "week_no"]
    g = series.groupby(key)
    for k, grp in g:
        if len(grp) > 1:
            uniq = grp[SKILLS].drop_duplicates()
            dup_report.append(dict(player=grp.player_name.iloc[0], author=k[1], week_no=int(k[2]),
                                   n=len(grp), identical=bool(len(uniq) == 1),
                                   images=list(grp.source_image)))
    series = (series.sort_values(key + ["_chk", "_conf", "image_date", "_sum"],
                                 ascending=[True, True, True, False, False, True, True])
                    .drop_duplicates(subset=key, keep="first")
                    .drop(columns=["_conf", "_chk", "_sum"])
                    .sort_values(["player_name", "author", "week_no"]).reset_index(drop=True))

SERIES_COLS = ["player_name", "player_id", "author", "week_no", "report_date", "image_date",
               "age", "height_cm", "potential_num", "potential_word"] + SKILLS + \
              ["tsp", "game_shape", "experience", "salary", "dmi",
               "source_image", "confidence", "checksum_ok", "join_rule",
               "source_message_id", "source_channel"]
series = series[SERIES_COLS]
series.to_csv(os.path.join(PARSED, "series.csv"), index=False, encoding="utf-8-sig")

ncards = (series.groupby(["author", "week_no"]).size().rename("n_player_cards")
          if len(series) else pd.Series(dtype=int, name="n_player_cards"))
weeks = weeks.merge(ncards, how="left", left_on=["author", "week_no"], right_index=True)
weeks["n_player_cards"] = weeks.n_player_cards.fillna(0).astype(int)
WEEK_COLS = ["author", "week_no", "week_no_source", "report_date", "training_raw",
             "training_name", "position_group", "training_key", "minutes_note",
             "coach_level", "youth_trainer_level", "fitness_level", "training_court_level",
             "n_player_cards", "report_ts", "message_id"]
weeks[WEEK_COLS].to_csv(os.path.join(PARSED, "weeks.csv"), index=False, encoding="utf-8-sig")

# ---------------------------------------------------------------- pops
tk = {(r.author, int(r.week_no)): (r.training_key, r.training_name, r.position_group)
      for r in weeks.itertuples()}
pop_rows, dec_rows = [], []
for (pid, author), grp in series.groupby(["player_id", "author"], dropna=False):
    grp = grp.sort_values("week_no")
    rows = grp.to_dict("records")
    for a, b in zip(rows, rows[1:]):
        span = [w for w in range(int(a["week_no"]) + 1, int(b["week_no"]) + 1)]
        keys = [tk.get((author, w), (None, None, None))[0] for w in span]
        names = [tk.get((author, w), (None, None, None))[1] for w in span]
        baseline = (int(a["week_no"]) == 0)
        for s in SKILLS:
            fr, to = a[s], b[s]
            if fr is None or to is None or pd.isna(fr) or pd.isna(to):
                continue
            fr, to = int(fr), int(to)
            if to > fr:
                pop_rows.append(dict(
                    player=a["player_name"], player_id=pid, author=author, skill=s,
                    from_level=fr, to_level=to, delta=to - fr,
                    week_from=int(a["week_no"]), week_to=int(b["week_no"]),
                    date_from=a["report_date"], date_to=b["report_date"],
                    weeks_in_interval=len(span),
                    training_keys=";".join("" if k is None or pd.isna(k) else str(int(k)) for k in keys),
                    training_names=";".join("" if n is None else str(n) for n in names),
                    clean_interval=bool(len(span) == 1 and not baseline
                                        and all(k is not None and not pd.isna(k) for k in keys)),
                    from_baseline_week0=baseline, source="series"))
            elif to < fr:
                dec_rows.append(dict(player=a["player_name"], author=author, skill=s,
                                     from_level=fr, to_level=to,
                                     week_from=int(a["week_no"]), week_to=int(b["week_no"]),
                                     date_from=a["report_date"], date_to=b["report_date"],
                                     legitimate_stamina_decay=bool(s == "st"),
                                     images=[a["source_image"], b["source_image"]]))
pops = pd.DataFrame(pop_rows)
if len(pops):
    pops = pops.sort_values(["player", "week_to", "skill"]).reset_index(drop=True)
pops.to_csv(os.path.join(PARSED, "pops.csv"), index=False, encoding="utf-8-sig")

# ---------------------------------------------------------------- history pops
hist_rows, hist_files, hist_weeks_no_pop = [], [], 0
for f, d in cards.items():
    if d.get("image_type") != "training_history" and not d.get("history_entries"):
        continue
    author = None
    hit = imgs[imgs.file == f]
    if len(hit):
        author = hit.iloc[0]["author"]
    hist_files.append(f)
    for e in d.get("history_entries", []):
        if not e.get("pops"):
            hist_weeks_no_pop += 1
        for p in e.get("pops", []):
            hist_rows.append(dict(player=p.get("player"), skill=p.get("skill"),
                                  **{"from": p.get("from"), "to": p.get("to")},
                                  date=e.get("date"), training=e.get("training"),
                                  author=author, source_image=f, source="history"))
hist = pd.DataFrame(hist_rows)
if len(hist):
    hist = hist.drop_duplicates(subset=["player", "skill", "from", "to", "date"]) \
               .sort_values(["date", "player", "skill"]).reset_index(drop=True)
hist.to_csv(os.path.join(PARSED, "history_pops.csv"), index=False, encoding="utf-8-sig")

# ---------------------------------------------------------------- summary
players_summary = []
for (pid, nm), grp in series.groupby(["player_id", "player_name"], dropna=False):
    ws = sorted(grp.week_no.unique().tolist())
    obs = [w for w in ws if w > 0]
    players_summary.append(dict(
        player=nm, player_id=None if pd.isna(pid) else int(pid),
        authors=sorted(grp.author.unique().tolist()),
        n_weeks=len(ws), week_min=int(min(ws)), week_max=int(max(ws)),
        has_week0_baseline=bool(0 in ws),
        missing_weeks_in_span=[int(w) for w in range(int(min(obs)), int(max(obs)) + 1)
                               if w not in ws] if obs else [],
        date_first=grp.sort_values("week_no").report_date.iloc[0],
        date_last=grp.sort_values("week_no").report_date.iloc[-1],
        age_first=None if pd.isna(grp.sort_values("week_no").age.iloc[0]) else int(grp.sort_values("week_no").age.iloc[0]),
        age_last=None if pd.isna(grp.sort_values("week_no").age.iloc[-1]) else int(grp.sort_values("week_no").age.iloc[-1]),
        tsp_first=int(grp.sort_values("week_no").tsp.iloc[0]),
        tsp_last=int(grp.sort_values("week_no").tsp.iloc[-1]),
        n_pops=int(((pops.player_id == pid).sum()) if len(pops) else 0)))
players_summary.sort(key=lambda r: -r["n_weeks"])

cardweeks = set(zip(series.author, series.week_no))
textweeks = set(zip(weeks.author, weeks.week_no))
weeks_with_text_no_cards = sorted([[a, int(w)] for a, w in textweeks - cardweeks])
weeks_with_cards_no_text = sorted([[a, int(w)] for a, w in cardweeks - textweeks])

n_cards_total = len(cards)
n_card_type = Counter(d.get("image_type") for d in cards.values())
checksum_fail = sum(1 for d in cards.values() for p in d.get("players", [])
                    if p.get("tsp_checksum_ok") is False)
low_conf = sum(1 for d in cards.values() for p in d.get("players", [])
               if p.get("confidence") not in ("high", None))

att_all = set()
for s in msgs.attachment_files.dropna():
    for x in str(s).split(";"):
        if x.strip():
            att_all.add(x.strip())
att_no_card = sorted(att_all - set(cards))
card_no_msg = sorted(set(cards) - att_all)

summary = dict(
    generated_from=dict(cards_dir=CARDS, n_card_json=n_cards_total,
                        card_image_types=dict(n_card_type),
                        n_report_messages=int(len(rep)), n_discussion_messages=int(len(dis))),
    join=dict(n_images_in_messages=int(len(imgs)),
              join_rule_counts={k: int(v) for k, v in imgs.join_rule.value_counts().items()},
              n_images_unjoined=int((imgs.join_rule == "unjoined").sum()),
              attachments_with_no_card_json=att_no_card,
              card_json_with_no_message=card_no_msg),
    players=players_summary,
    n_players=len(players_summary),
    total_player_weeks=int(len(series)),
    total_player_weeks_excl_baseline=int((series.week_no > 0).sum()),
    weeks_rows=int(len(weeks)),
    weeks_unmappable_training=[dict(author=r.author, week_no=int(r.week_no),
                                    training_raw=r.training_raw)
                               for r in weeks.itertuples()
                               if r.training_key is None or pd.isna(r.training_key)],
    training_key_distribution={str(int(k)): int(v) for k, v in
                               weeks.training_key.dropna().value_counts().sort_index().items()},
    total_pops=int(len(pops)),
    pops_by_skill={k: int(v) for k, v in (pops.skill.value_counts().to_dict().items()
                                          if len(pops) else [])},
    pops_clean_single_week_interval=int(pops.clean_interval.sum()) if len(pops) else 0,
    pops_multiweek_interval=int((pops.weeks_in_interval > 1).sum()) if len(pops) else 0,
    pops_by_training_key={k: int(v) for k, v in
                          (pops[pops.clean_interval].training_keys.value_counts().to_dict().items()
                           if len(pops) else [])},
    pops_interval_length_histogram={str(k): int(v) for k, v in
                                    (pops.weeks_in_interval.value_counts().sort_index().to_dict().items()
                                     if len(pops) else [])},
    pops_with_unknown_training_in_interval=int(
        pops.training_keys.astype(str).apply(lambda s: any(x == "" for x in s.split(";"))).sum()
    ) if len(pops) else 0,
    clean_pops_by_training_key_and_skill=(
        pd.crosstab(pops[pops.clean_interval].training_keys.astype(str),
                    pops[pops.clean_interval].skill).to_dict("index") if len(pops) else {}),
    player_weeks_by_author=({k: int(v) for k, v in series.groupby("author").size().items()}),
    pop_intervals_by_author=({k: int(v) for k, v in pops.groupby("author").size().items()}
                             if len(pops) else {}),
    history_pops=dict(n_rows=int(len(hist)),
                      n_source_images=len(hist_files), source_images=hist_files,
                      date_min=(hist.date.min() if len(hist) else None),
                      date_max=(hist.date.max() if len(hist) else None),
                      by_skill={k: int(v) for k, v in (hist.skill.value_counts().to_dict().items()
                                                       if len(hist) else [])},
                      players=sorted(hist.player.dropna().unique().tolist()) if len(hist) else [],
                      trainings={k: int(v) for k, v in (hist.training.value_counts().to_dict().items()
                                                        if len(hist) else [])},
                      history_weeks_with_zero_pops=hist_weeks_no_pop,
                      overlaps_series_players=sorted(
                          set(deacc(x) for x in hist.player.dropna().unique())
                          & set(deacc(x) for x in series.player_name.unique())) if len(hist) else [],
                      distinct_history_weeks=int(hist.date.nunique()) if len(hist) else 0),
    weeks_with_training_text_but_no_cards=weeks_with_text_no_cards,
    weeks_with_cards_but_no_training_text=weeks_with_cards_no_text,
    inferred_week_numbers=inferred_weeks,
    orphan_cards_no_training_frame=unjoined_cards,
    checksum_failure_count=checksum_fail,
    low_confidence_player_records=low_conf,
    duplicate_player_week_records=dup_report,
    cards_dropped_unjoined=unjoined_cards,
    players_missing_player_id_in_source=[dict(file=f, name=n, resolved_id=(None if i is None else int(i)))
                                         for f, n, i in no_id],
    skill_decreases=dec_rows,
    skill_decreases_excluding_stamina=[d for d in dec_rows if not d["legitimate_stamina_decay"]],
)
with open(os.path.join(PARSED, "assembly_summary.json"), "w", encoding="utf-8") as fh:
    json.dump(summary, fh, ensure_ascii=False, indent=2, default=str)

print("series", series.shape, "weeks", weeks.shape, "pops", pops.shape, "hist", hist.shape)
