# CoachParrot 2.1 training model — reconstructed from cp_2_1_excel.xls

Source: SourceForge project `coachparrot`, file `cp_2_1/cp_2_1_excel.xls` (last saved 2013-12-31).
Model lives in sheet `Coeff` (rows 198-256) and is applied in sheet `Calculators` rows 13-21.
Coeff!A198: "New analysis of training speeds based on crowd-sourced data at training.bb-usa.net".

## Weekly gain formula (per skill s, training type t) — Calculators!D21:M21

```
weekly_gain(s) = rate(t, s)                          # Coeff!B224:AH233  (levels/week, already per-skill)
              x age_mult(age)                        # Coeff!AJ214:AK232 (18->1.00 ... 36->0.00)
              x height_mult(height_cm, s)            # Coeff!AM214:AW235 (JS/DR/PA ~1; JR/OD/HA -0.05/step; IS/ID/RB/SB +0.05/step)
              x elastic_mult(s)                      # 0.91 ^ (skill_s - avg(linked skills of s))   [Coeff!AZ226, links Coeff!B246:K256]
              x xtrain_mult(s)                       # if s == player's max skill: 0.925 ^ (skill_s - avg(all 10 skills)) else 1   [Coeff!AZ229]
              x potential_mult                       # 1 if below potential cap else 1/3            [Coeff!AZ232]
              x coach_mult(level)                    # Coeff!AY215:AZ221 (L1 0.88 ... L5 1.00 ... L7 1.06)
```

Exact spreadsheet formulas (Calculators, column D = JS, training type index B14):
- D14 rate:      `=OFFSET(Coeff!$B$224,COLUMN()-COLUMN($D$1),$B14-1)`
- D15 age:       `=VLOOKUP($Q$13,Coeff!$AJ$214:$AK$236,2,0)`
- D16 height:    `=VLOOKUP($R$13,Coeff!$AM$214:$AW$235,1+HLOOKUP($B$14,Coeff!$B$209:$AF$212,4,0),0)`
- D17 elastic:   `=Coeff!$AZ$226^(D13-SUMPRODUCT($D$13:$M$13,TRANSPOSE(Coeff!B$246:B$255))/Coeff!B$256)`
- D18 xtrain:    `=IF(D13=MAX($D13:$M13),Coeff!$AZ$229^(D13-AVERAGE($D13:$M13)),1)`
- D19 potential: `=IF(potential_used < player_potential, 1, 1/3)`
- D20 coach:     `=VLOOKUP($B$20,Coeff!$AY$215:$AZ$221,2,0)`
- D21 total:     `=D14*D15*D16*D17*D18*D19*D20`

Verified example (built into the sheet): OD for 1, age 27, 201cm, coach L4,
skills JS5 JR5 OD4 HA3 DR2 PA5 IS3 ID2 RB3 SB1:
OD gain = 0.5 x 0.27 x 1.00 x 0.91^(4-(3+2+2)/3) x 1 x 1 x 0.97 = 0.1119 levels/week. Matches sheet.

## Notes / semantics

- 33 training types = primary skill x position-group ("JS for 12", "OD for 123", "RB for team", ...), see training_rate_matrix.csv.
  Rates already include position-count dilution (legend Coeff!A200:E203: primary=0.5, PA=0.6; 1to2 x0.75, 1to3 x0.4, 2to5 x0.44, 1to5 x0.25... baked in).
- NO minutes factor: the model assumes the trained player gets full minutes at the trained position(s).
- NO game-shape factor in training.
- Stamina (type 32) = flat 2/3 level/week, Free Throw (type 33) = flat 1/2 level/week, NO multipliers at all (Calculators!N14/O14).
- Elastic effect is symmetric in CP (skill above linked-average trains SLOWER, below trains FASTER: 0.91^delta).
  Forum consensus (thread 291954 msg 13/21): in the real game only the >1 (boost) side may apply; CP applies both. No definitive answer.
- Cross-training ("Xtrain") malus applies only to the player's HIGHEST skill: 0.925^(max_skill - avg_all_skills).
  The random skill-pop side of cross-training is NOT modeled (acknowledged in thread msg 15).
- Potential cap: potential_used(pos) = SUMPRODUCT(potential_weights[pos], skills)/2 - 4 (Calcs!X293:X297, weights Coeff!F8:O12
  = potential_weights.csv). Cap reached when max over 5 positions >= player's potential value (0-11 scale) -> training x 1/3. Hard step, not sigmoid.
- Height multiplier: JS/DR/PA constant 0.9975273768 (fitted, ~1.0); JR/OD/HA slope -0.05 per height step; IS/ID/RB/SB +0.05 per step; anchored at 6'7"/201cm = 1.00. Steps are BB height increments (175,178,180,...,229 cm).
- Age multipliers identical to the community table already in BB-project CLAUDE.md (18:1.00, 19:0.95, 20:0.88, 21:0.78 ... 36:0.00).
- Coach (trainer) multipliers identical to community table (L1 0.88 ... L7 1.06).
- Elastic links (trained skill <- {skills whose average it is compared against} / divisor):
  JS <- {JR,HA,DR}/3;  JR <- {JS,HA,DR}/3;  OD <- {HA,DR,ID}/3;  HA <- {OD,DR}/2;  DR <- {JS,HA}/2;
  PA <- {HA,DR}/2;  IS <- {JS,ID}/2;  ID <- {IS,SB}/2;  RB <- {IS,ID}/2;  SB <- {ID,RB}/2.
  (Read elastic_links.csv column-wise: trained skill = column; rows with 1 = linked set; divisor row at bottom.)

## Provenance (forum thread 291954 "Coefficients in Coach Parrot", 2018)

- Author Joey_Ka: coefficients fitted from observable data only — team ratings of ~450 games pulled via BBAPI (2009),
  crowd-sourced training results (training.bb-usa.net), and market salaries (salary part now obsolete; buzzer-manager.com is newer).
- Method: iterative least-squares with Excel Solver; near-zero coefficients pruned to 0 between iterations.
- Author's own caveat: small noisy sample; implausible small cross-terms in the ratings model may be fitting artifacts;
  "structure of most models is correct".
