# TicketVerse — Project Report

This folder is gitignored (see `docs/report/` in the root `.gitignore`) — it is not committed to the repo.

## Structure

- `chapters/` — one Markdown file per chapter, numbered in reading order.
- `figures/` — diagrams and screenshots referenced by the chapters.
- `scripts/` — `assemble.js`, which concatenates the chapters and converts them to a single `.docx`.
- `dist/` — build output (the generated `.docx`).

## Chapters

| File                          | Chapter                                   |
| ----------------------------- | ----------------------------------------- |
| `00-front-matter.md`          | Title page, declaration, acknowledgements |
| `01-abstract.md`              | Ch.1 Abstract                             |
| `02-project-description.md`   | Ch.2 Project Description                  |
| `03-requirement-gathering.md` | Ch.3 Requirement Gathering                |
| `04-payments-integration.md`  | Ch.4 Payments Integration                 |
| `05-security.md`              | Ch.5 Security                             |
| `06-deployment-flow.md`       | Ch.6 Deployment Flow                      |
| `07-technologies-used.md`     | Ch.7 Technologies Used                    |
| `08-conclusion.md`            | Ch.8 Conclusion                           |
| `09-references.md`            | References                                |

## Building the .docx

```
node docs/report/scripts/assemble.js
```

Requires [pandoc](https://pandoc.org/) to be installed locally (`brew install pandoc` on macOS).
Output is written to `docs/report/dist/TicketVerse-Project-Report.docx`.
