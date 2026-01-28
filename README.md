# CV Generator

A simple browser-based CV generator. Select which skills, experience, and achievements to include, then generate a printable HTML CV.

## Setup

```bash
npm install
```

## Build

```bash
npx tsc
```

After changing `main.ts`, run `npx tsc` again to recompile. You don't need to restart the server - just refresh the browser to load the new JavaScript.

CSV files don't require recompilation - just refresh the browser.

## Run

The app needs to be served over HTTP (browsers block local file fetches). Use any static file server:

```bash
npx serve
```

Then open http://localhost:3000 in your browser.

## Usage

1. Click "Start" to load your CV data
2. Use checkboxes to select which items to include
3. Click "Generate HTML" to create and print your CV

## Customizing Your CV

Edit the CSV files in the `data/` directory:

| File | Content |
|------|---------|
| `header.csv` | Name, phone, email, location, LinkedIn URL, GitHub URL |
| `professional-summary.csv` | Career summary |
| `technical-skills.csv` | Technical skills list |
| `soft-skills.csv` | Soft skills list |
| `technologies.csv` | Technologies/tools list |
| `work-experience.csv` | Job history (role, dates, company, location, description) |
| `education.csv` | Qualifications |
| `hobbies.csv` | Hobbies list |
| `achievements.csv` | Achievements list |
| `referees.csv` | References |

For multi-column CSVs, keep the header row intact. Use quotes around fields containing commas or newlines.
