# Operations

1. Run `scripts/bootstrap.sh`, replace every placeholder in `.env`, then run `scripts/migrate.sh`.
2. Run `./start.sh`; it only starts this repository's two processes and only stops the PIDs it created.
3. Demo data is destructive and opt-in: `CONFIRM_DEMO_SEED=yes scripts/seed-demo.sh` outside production only.

The governed API is `/api/disclosure-workflow`. Provider imports are accepted into `esg_integration_inbox`; a separately deployed, credentialed connector must validate and process them. Publication requires an independent reviewer and administrator. No carbon-factor registry, framework, jurisdiction, assurance, or external reporting validation is claimed by this repository.
