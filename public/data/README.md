# public/data

This directory contains static JSON files served directly to the frontend.

## cached_reviews.json

This file holds the processed review data used by the dashboard. Some records may contain
manually edited operator fields such as `status` (`resolved` / `dismissed`), which are used
for demo and QA purposes only.

**Important:** When the `/api/debug/rollback` endpoint is triggered, all operator-managed
fields (`status`, `pr_draft`, `pr_reply`, `operator_note`) are automatically stripped from
every remaining record. This is intentional — rollback is designed to reset the dataset to
a clean, post-LLM-analysis state.

As a result, any manually committed `status` values in this file will be wiped after a
rollback. Be aware of potential **merge conflicts** if multiple people are editing this file
or if a rollback runs between commits.
