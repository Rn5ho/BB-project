// Paste-ready DefaultArchetype[] additions derived 2026-08-04 (season 72).
// Target: v2/src/lib/archetypes/defaults.ts — review REPORT.md before adopting.
export const MARKET_ARCHETYPES = [
  {
    "key": "mkt72-outside-1",
    "name": "Market: outside #1",
    "description": "Derived from S72 market flood (496 members, 66 elite).",
    "rules": {
      "conditions": [
        {
          "kind": "field",
          "field": "outside_def",
          "op": ">=",
          "byAge": {
            "21": 15
          }
        },
        {
          "kind": "field",
          "field": "potential",
          "op": ">=",
          "byAge": {
            "21": 7
          }
        },
        {
          "kind": "field",
          "field": "height_cm",
          "op": ">=",
          "byAge": {
            "21": 180
          }
        }
      ]
    }
  },
  {
    "key": "mkt72-inside-1",
    "name": "Market: inside #1",
    "description": "Derived from S72 market flood (25 members, 6 elite).",
    "rules": {
      "conditions": [
        {
          "kind": "field",
          "field": "shot_blocking",
          "op": ">=",
          "byAge": {
            "21": 18
          }
        },
        {
          "kind": "field",
          "field": "inside_def",
          "op": ">=",
          "byAge": {
            "21": 16
          }
        },
        {
          "kind": "field",
          "field": "potential",
          "op": ">=",
          "byAge": {
            "21": 8
          }
        },
        {
          "kind": "field",
          "field": "height_cm",
          "op": ">=",
          "byAge": {
            "21": 203
          }
        }
      ]
    }
  },
  {
    "key": "mkt72-inside-2",
    "name": "Market: inside #2",
    "description": "Derived from S72 market flood (170 members, 11 elite).",
    "rules": {
      "conditions": [
        {
          "kind": "field",
          "field": "inside_def",
          "op": ">=",
          "byAge": {
            "21": 16
          }
        },
        {
          "kind": "field",
          "field": "potential",
          "op": ">=",
          "byAge": {
            "21": 8
          }
        },
        {
          "kind": "field",
          "field": "height_cm",
          "op": ">=",
          "byAge": {
            "21": 203
          }
        }
      ]
    }
  },
  {
    "key": "mkt72-wing-1",
    "name": "Market: wing #1",
    "description": "Derived from S72 market flood (245 members, 0 elite).",
    "rules": {
      "conditions": [
        {
          "kind": "field",
          "field": "inside_def",
          "op": ">=",
          "byAge": {
            "21": 16
          }
        },
        {
          "kind": "field",
          "field": "potential",
          "op": ">=",
          "byAge": {
            "21": 7
          }
        },
        {
          "kind": "field",
          "field": "height_cm",
          "op": ">=",
          "byAge": {
            "21": 178
          }
        }
      ]
    }
  }
];
