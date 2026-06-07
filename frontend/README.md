# EasyPeasy Frontend Prototype

Frontend-only React prototype for EasyPeasy, a warm English practice app for South Asian immigrant homemakers.

## Information Architecture

- Home: greeting, continue practice, quick start, today's phrase, recent activity, shortcuts.
- Cooking: recipe hub with food imagery and progress.
- Cooking Session: guided recipe step with instruction, phrase, and practice controls.
- Cooking Conversation: natural correction and speaking practice.
- Daily Life: scenario hub for doctor, school, grocery, pharmacy, transportation, and emergency practice.
- Scenario Screens: phrase-led conversation practice for each everyday situation.
- Phrase Bank: saved phrases grouped by category.
- Profile: language, speech speed, AI voice, saved phrases, help, and about.

## Navigation Flow

```mermaid
flowchart TD
  Home["Home"] --> Cooking["Cooking Hub"]
  Home --> Daily["Daily Life Hub"]
  Home --> PhraseBank["Phrase Bank"]
  Home --> Profile["Profile"]
  Cooking --> Recipe["Cooking Session"]
  Recipe --> Conversation["Cooking Conversation"]
  Conversation --> Recipe
  Daily --> Doctor["Doctor Visit"]
  Daily --> School["Parent Teacher Meeting"]
  Daily --> Grocery["Grocery Store"]
  Daily --> Pharmacy["Pharmacy"]
  Daily --> Transit["Transportation"]
  Daily --> Emergency["Emergency"]
  Doctor --> PhraseBank
  School --> PhraseBank
  Grocery --> PhraseBank
  Pharmacy --> PhraseBank
  Transit --> PhraseBank
  Emergency --> PhraseBank
```

## User Flow

```mermaid
flowchart LR
  Start["Open app"] --> Continue{"Continue practice?"}
  Continue -->|Yes| Dal["Resume Making Dal"]
  Continue -->|No| Quick["Choose quick start"]
  Quick --> Cooking["Practice cooking English"]
  Quick --> Everyday["Practice daily-life English"]
  Cooking --> Hear["Hear phrase"]
  Hear --> Repeat["Repeat phrase"]
  Repeat --> Next["Next step"]
  Everyday --> Scenario["Open scenario"]
  Scenario --> Save["Save useful phrase"]
  Save --> Bank["Review in Phrase Bank"]
```

## Run

```bash
npm install
npm run dev
```
