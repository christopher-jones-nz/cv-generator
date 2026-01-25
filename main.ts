// main.ts (plain TS, no framework)

declare const google: any;

const CLIENT_ID =
  "537194609804-tvj3898rujffqte5isb1nuk0mtje3osb.apps.googleusercontent.com";
const SPREADSHEET_ID = "1b1Gwv9DpZr79lIj0WqoIpLTu7tjxIHkwC1SLtghrF4w";

const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

type WorkExperienceRow = {
  roleTitle: string;
  startDate: string;
  endDate: string;
  company: string;
  location: string;
  description: string;
};

type EducationRow = {
  institution: string;
  qualificationName: string;
  startDate: string;
  endDate: string;
  gpaOrGrade: number | null;
  project1Title: string;
  project1Description: string;
};

type RefereeRow = {
  name: string;
  role: string;
  company: string;
  phone: string;
  email: string;
};

type CvDb = {
  header: { name: string; phone: string; email: string };
  professionalSummary: string;
  technicalSkills: string[];
  softSkills: string[];
  technologies: string[];
  workExperience: WorkExperienceRow[];
  education: EducationRow[];
  hobbies: string[];
  achievements: string[];
  referees: RefereeRow[];
};

function $(id: string) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
}

function setStatus(msg: string) {
  $("status").textContent = msg;
}

async function getAccessToken(): Promise<string> {
  return await new Promise((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp: any) => {
        if (resp?.access_token) resolve(resp.access_token);
        else reject(new Error("No access token returned"));
      },
      error_callback: (err: any) => reject(err),
    });
    tokenClient.requestAccessToken();
  });
}

async function readRange(
  accessToken: string,
  rangeA1: string,
): Promise<any[][]> {
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SPREADSHEET_ID)}/values/` +
    `${encodeURIComponent(rangeA1)}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok)
    throw new Error(`Sheets API error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return (json.values ?? []) as any[][];
}

function asList(values: any[][]): string[] {
  // assumes first row is header; filters blank rows
  return values
    .slice(1)
    .map((r) => String(r?.[0] ?? "").trim())
    .filter(Boolean);
}

function toTable(values: any[][]): Record<string, string>[] {
  const [hdr, ...rows] = values;
  const headers = (hdr ?? []).map((h: any) => String(h).trim());
  return rows
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => (obj[h] = String(r?.[i] ?? "").trim()));
      return obj;
    })
    .filter((o) => Object.values(o).some((v) => v.length > 0));
}

function normalize(
  headerCol: any[][],
  summaryCol: any[][],
  tech: any[][],
  soft: any[][],
  techs: any[][],
  workGrid: any[][],
  eduGrid: any[][],
  hobbies: any[][],
  ach: any[][],
  refs: any[][],
): CvDb {
  const headerRows = headerCol.slice(1).map((r) => String(r?.[0] ?? "").trim());
  const [name = "", phone = "", email = ""] = headerRows;

  const professionalSummary =
    summaryCol
      .slice(1)
      .map((r) => String(r?.[0] ?? "").trim())
      .filter(Boolean)[0] ?? "";

  const work = toTable(workGrid).map((o) => ({
    roleTitle: o["Role title"] ?? "",
    startDate: o["Start date"] ?? "",
    endDate: o["End date"] ?? "",
    company: o["Company"] ?? "",
    location: o["Physical location"] ?? "",
    description: o["Description"] ?? "",
  }));

  const education = toTable(eduGrid).map((o) => ({
    institution: o["Institution"] ?? "",
    qualificationName: o["Qualification name"] ?? "",
    startDate: o["Start date"] ?? "",
    endDate: o["End date"] ?? "",
    gpaOrGrade: o["GPA or grade"] ? Number(o["GPA or grade"]) : null,
    project1Title: o["Project 1 Title"] ?? "",
    project1Description: o["Project 1 Description"] ?? "",
  }));

  const referees = toTable(refs).map((o) => ({
    name: o["Name"] ?? "",
    role: o["Role"] ?? "",
    company: o["Company"] ?? "",
    phone: o["Phone"] ?? "",
    email: o["Email"] ?? "",
  }));

  return {
    header: { name, phone, email },
    professionalSummary,
    technicalSkills: asList(tech),
    softSkills: asList(soft),
    technologies: asList(techs),
    workExperience: work,
    education,
    hobbies: asList(hobbies),
    achievements: asList(ach),
    referees,
  };
}

function renderCheckboxList(title: string, items: string[]) {
  const wrap = document.createElement("div");
  const h = document.createElement("h3");
  h.textContent = title;
  wrap.appendChild(h);

  items.forEach((text, idx) => {
    const label = document.createElement("label");
    label.style.display = "block";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true; // default include
    cb.dataset.idx = String(idx);

    label.appendChild(cb);
    label.append(" " + text);
    wrap.appendChild(label);
  });

  return wrap;
}

function renderApp(db: CvDb) {
  const app = $("app");
  app.innerHTML = "";

  app.appendChild(renderCheckboxList("Technical Skills", db.technicalSkills));
  app.appendChild(renderCheckboxList("Soft Skills", db.softSkills));
  app.appendChild(renderCheckboxList("Technologies", db.technologies));
  app.appendChild(renderCheckboxList("Achievements", db.achievements));
  app.appendChild(renderCheckboxList("Hobbies", db.hobbies));

  // Work/Education/Referees are tables; keep minimal for now
  const w = document.createElement("div");
  w.innerHTML = `<h3>Work Experience</h3>`;
  db.workExperience.forEach((row, idx) => {
    const label = document.createElement("label");
    label.style.display = "block";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cb.dataset.workIdx = String(idx);
    label.appendChild(cb);
    label.append(
      ` ${row.roleTitle} — ${row.company} (${row.startDate} to ${row.endDate})`,
    );
    w.appendChild(label);
  });
  app.appendChild(w);

  const gen = document.createElement("button");
  gen.textContent = "Generate HTML";
  gen.onclick = () => {
    const html = generateCvHtml(db, collectSelection(db));
    openPrintWindow(html);
  };
  app.appendChild(gen);
}

function collectSelection(db: CvDb) {
  const app = $("app");
  const pick = (selector: string, arr: any[]) => {
    const idx: number[] = [];
    app.querySelectorAll<HTMLInputElement>(selector).forEach((cb) => {
      if (cb.checked) idx.push(Number(cb.dataset.idx));
    });
    return idx;
  };

  const workIdx: number[] = [];
  app
    .querySelectorAll<HTMLInputElement>(
      "input[data-work-idx], input[data-workidx], input[data-workIdx]",
    )
    .forEach((cb) => {
      if (cb.checked) workIdx.push(Number(cb.dataset.workIdx));
    });

  return {
    includeSummary: true,
    technicalSkillIdx: pick(
      'h3:contains("Technical Skills")',
      db.technicalSkills,
    ), // (not used; keep simple)
    // In practice you'd select by wrapping per section and querying within it.
    workExperienceIdx: workIdx,
  };
}

// Minimal generator: you will expand this into your real CV template
function generateCvHtml(db: CvDb, selection: any): string {
  const work = selection.workExperienceIdx.map(
    (i: number) => db.workExperience[i],
  );

  const esc = (s: string) =>
    s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>CV</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body { font-family: system-ui, sans-serif; }
    h1,h2 { margin: 0 0 6px 0; }
    .muted { opacity: 0.75; }
    .section { margin-top: 14px; }
    .item { margin-top: 8px; }
    .desc { white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${esc(db.header.name)}</h1>
  <div class="muted">${esc(db.header.phone)} • ${esc(db.header.email)}</div>

  <div class="section">
    <h2>Professional Summary</h2>
    <div class="desc">${esc(db.professionalSummary)}</div>
  </div>

  <div class="section">
    <h2>Work Experience</h2>
    ${work
      .map(
        (w: WorkExperienceRow) => `
      <div class="item">
        <strong>${esc(w.roleTitle)}</strong> — ${esc(w.company)} <span class="muted">(${esc(w.startDate)}–${esc(w.endDate)})</span><br/>
        <span class="muted">${esc(w.location)}</span>
        <div class="desc">${esc(w.description)}</div>
      </div>`,
      )
      .join("")}
  </div>
</body>
</html>`;
}

function openPrintWindow(html: string) {
  const w = window.open("", "_blank");
  if (!w) throw new Error("Popup blocked");
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

$("start").addEventListener("click", async () => {
  try {
    setStatus("Authenticating…");
    const token = await getAccessToken();

    setStatus("Reading Google Sheet…");

    const [
      headerCol,
      summaryCol,
      techSkillsCol,
      softSkillsCol,
      technologiesCol,
      workExpGrid,
      educationGrid,
      hobbiesCol,
      achievementsCol,
      refereesGrid,
    ] = await Promise.all([
      readRange(token, "'Header'!A:A"),
      readRange(token, "'Professional Summary'!A:A"),
      readRange(token, "'Technical Skills'!A:A"),
      readRange(token, "'Soft Skills'!A:A"),
      readRange(token, "'Programming Languages and Technologies'!A:A"),
      readRange(token, "'Work Experience'!A:F"),
      readRange(token, "'Education'!A:G"),
      readRange(token, "'Hobbies and Interests'!A:A"),
      readRange(token, "'Achievements and Extracurricular Activities'!A:A"),
      readRange(token, "'Referees'!A:E"),
    ]);

    const db = normalize(
      headerCol,
      summaryCol,
      techSkillsCol,
      softSkillsCol,
      technologiesCol,
      workExpGrid,
      educationGrid,
      hobbiesCol,
      achievementsCol,
      refereesGrid,
    );

    setStatus("Loaded.");
    renderApp(db);
  } catch (e: any) {
    console.error(e);
    setStatus(`Error: ${e?.message ?? String(e)}`);
  }
});
