#!/usr/bin/env bash
# Probe buzzeriq.com training simulate/solve API. Polite: 1s sleep between requests.
set -u
DIR="C:/Users/Rn5ho/AppData/Local/Temp/claude/D--ClaudeProjects-BB-project-v2/17eecb99-2da5-4d93-9da7-2bb01d636dfa/scratchpad/biq/probes"
mkdir -p "$DIR"
BASE="https://buzzeriq.com/api/tools/training"

probe() { # $1=num-name  $2=endpoint(simulate|solve)  $3=json body
  local name="$1" ep="$2" body="$3"
  printf '%s' "$body" > "$DIR/$name.req.json"
  curl -s -X POST "$BASE/$ep" -H "Content-Type: application/json" -d "$body" -o "$DIR/$name.res.json" -w "%{http_code}"
  echo "  <- $name"
  sleep 1
}

# base player template: open_source, age18, all skills 7, height 201, pot 9, coach 5, yt0, tc0
P_BASE='"skills":[7,7,7,7,7,7,7,7,7,7],"age":18,"height":201,"potential":9,"coach_level":5,"youth_trainer_level":0,"training_court_level":0,"ft_skill":5'

sim() { # $1=name $2=player-json $3=schedule
  probe "$1" simulate "{\"player\":{$2},\"training_schedule\":$3,\"start_season\":1,\"start_week\":1}"
}

### 1) skill-array-order probes (open_source, known coefficients)
sim 01-order-HA1   "$P_BASE,\"training_model\":\"open_source\"" '[12]'
sim 02-order-JR2   "$P_BASE,\"training_model\":\"open_source\"" '[5]'
sim 03-order-SB5   "$P_BASE,\"training_model\":\"open_source\"" '[29]'
sim 04-order-PA1   "$P_BASE,\"training_model\":\"open_source\"" '[18]'
sim 05-order-IS5   "$P_BASE,\"training_model\":\"open_source\"" '[21]'

### 2) spot-check more IDs against bundle mapping
sim 06-id1-JS12    "$P_BASE,\"training_model\":\"open_source\"" '[1]'
sim 07-id24-ID5    "$P_BASE,\"training_model\":\"open_source\"" '[24]'
sim 08-id27-RB45   "$P_BASE,\"training_model\":\"open_source\"" '[27]'
sim 09-id32-stamina "$P_BASE,\"training_model\":\"open_source\"" '[32]'
sim 10-id33-ft     "$P_BASE,\"training_model\":\"open_source\"" '[33]'
sim 11-id34-invalid "$P_BASE,\"training_model\":\"open_source\"" '[34]'

### 3) coach_level sweep (t=[12] HA for 1; level 5 covered by probe 01)
for cl in 1 2 3 4 6 7; do
  P="\"skills\":[7,7,7,7,7,7,7,7,7,7],\"age\":18,\"height\":201,\"potential\":9,\"coach_level\":$cl,\"youth_trainer_level\":0,\"training_court_level\":0,\"ft_skill\":5,\"training_model\":\"open_source\""
  sim "12-coach$cl" "$P" '[12]'
done

### 4) youth trainer (age 18): level 5 and 7; and age 22 with yt5 (expect no effect?)
sim 13-yt5-age18 '"skills":[7,7,7,7,7,7,7,7,7,7],"age":18,"height":201,"potential":9,"coach_level":5,"youth_trainer_level":5,"training_court_level":0,"ft_skill":5,"training_model":"open_source"' '[12]'
sim 14-yt7-age18 '"skills":[7,7,7,7,7,7,7,7,7,7],"age":18,"height":201,"potential":9,"coach_level":5,"youth_trainer_level":7,"training_court_level":0,"ft_skill":5,"training_model":"open_source"' '[12]'
sim 15-yt5-age22 '"skills":[7,7,7,7,7,7,7,7,7,7],"age":22,"height":201,"potential":9,"coach_level":5,"youth_trainer_level":5,"training_court_level":0,"ft_skill":5,"training_model":"open_source"' '[12]'
sim 16-yt0-age22 '"skills":[7,7,7,7,7,7,7,7,7,7],"age":22,"height":201,"potential":9,"coach_level":5,"youth_trainer_level":0,"training_court_level":0,"ft_skill":5,"training_model":"open_source"' '[12]'

### 5) training court level 1 and 3
sim 17-tc1 '"skills":[7,7,7,7,7,7,7,7,7,7],"age":18,"height":201,"potential":9,"coach_level":5,"youth_trainer_level":0,"training_court_level":1,"ft_skill":5,"training_model":"open_source"' '[12]'
sim 18-tc3 '"skills":[7,7,7,7,7,7,7,7,7,7],"age":18,"height":201,"potential":9,"coach_level":5,"youth_trainer_level":0,"training_court_level":3,"ft_skill":5,"training_model":"open_source"' '[12]'

### 6) cap behavior: skills 19, potential 5, both models
sim 19-cap-open   '"skills":[19,19,19,19,19,19,19,19,19,19],"age":18,"height":201,"potential":5,"coach_level":5,"youth_trainer_level":0,"training_court_level":0,"ft_skill":5,"training_model":"open_source"' '[12]'
sim 20-cap-parrot '"skills":[19,19,19,19,19,19,19,19,19,19],"age":18,"height":201,"potential":5,"coach_level":5,"youth_trainer_level":0,"training_court_level":0,"ft_skill":5,"training_model":"coach_parrot"' '[12]'

### 7) model comparison: identical call coach_parrot (compare with probe 01) + one big-man type
sim 21-parrot-HA1 "$P_BASE,\"training_model\":\"coach_parrot\"" '[12]'
sim 22-parrot-SB5 "$P_BASE,\"training_model\":\"coach_parrot\"" '[29]'

### 8) age + height validation (open_source): age21 (x0.78), height175 IS (x0.5)
sim 23-age21 '"skills":[7,7,7,7,7,7,7,7,7,7],"age":21,"height":201,"potential":9,"coach_level":5,"youth_trainer_level":0,"training_court_level":0,"ft_skill":5,"training_model":"open_source"' '[12]'
sim 24-h175-IS5 '"skills":[7,7,7,7,7,7,7,7,7,7],"age":18,"height":175,"potential":9,"coach_level":5,"youth_trainer_level":0,"training_court_level":0,"ft_skill":5,"training_model":"open_source"' '[21]'

### 9) solve endpoint shape
probe 25-solve solve "{\"player\":{$P_BASE,\"training_model\":\"open_source\"},\"target_skills\":[7,7,7,9,9,7,7,7,7,7],\"start_season\":1,\"start_week\":1}"

echo DONE
