// main.ts (plain TS, no framework)

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
  header: {
    name: string;
    phone: string;
    email: string;
    location: string;
    linkedin: string;
    github: string;
  };
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

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        current.push(cell);
        cell = "";
      } else if (char === '\n' || (char === '\r' && next === '\n')) {
        current.push(cell);
        if (current.some(c => c.length > 0)) {
          rows.push(current);
        }
        current = [];
        cell = "";
        if (char === '\r') i++;
      } else if (char !== '\r') {
        cell += char;
      }
    }
  }

  // Handle last cell/row
  if (cell || current.length > 0) {
    current.push(cell);
    if (current.some(c => c.length > 0)) {
      rows.push(current);
    }
  }

  return rows;
}

async function loadCSV(filename: string): Promise<string[][]> {
  const res = await fetch(`./data/${filename}`);
  if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
  const text = await res.text();
  return parseCSV(text);
}

async function loadJSON<T>(filename: string): Promise<T> {
  const res = await fetch(`./data/${filename}`);
  if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
  return res.json();
}

type HeaderData = {
  name: string;
  phone: string;
  email: string;
  location: string;
  linkedin: string;
  github: string;
};

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
  header: HeaderData,
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
    header,
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

function renderCheckboxList(
  sectionKey: string,
  title: string,
  items: string[],
) {
  const wrap = document.createElement("div");
  wrap.dataset.section = sectionKey;

  const h = document.createElement("h3");
  h.textContent = title;
  wrap.appendChild(h);

  items.forEach((text, idx) => {
    const label = document.createElement("label");
    label.style.display = "block";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
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

  app.appendChild(renderCheckboxList("technicalSkills", "Technical Skills", db.technicalSkills));
  app.appendChild(renderCheckboxList("softSkills", "Soft Skills", db.softSkills));
  app.appendChild(renderCheckboxList("technologies", "Technologies", db.technologies));
  app.appendChild(renderCheckboxList("achievements", "Achievements", db.achievements));
  app.appendChild(renderCheckboxList("hobbies", "Hobbies", db.hobbies));

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
  gen.textContent = "Generate CV";
  gen.onclick = () => {
    const html = generateCvHtml(db, collectSelection(db));
    showCvPreview(html, () => renderApp(db));
  };
  app.appendChild(gen);
}

function collectSelection(db: CvDb) {
  const app = $("app");
  const pick = (sectionKey: string, arr: any[]) => {
    const idx: number[] = [];
    app.querySelectorAll<HTMLInputElement>(`div[data-section="${sectionKey}"] input[data-idx]`).forEach((cb) => {
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
    technicalSkillIdx: pick("technicalSkills", db.technicalSkills),
    softSkillIdx: pick("softSkills", db.softSkills),
    technologiesIdx: pick("technologies", db.technologies),
    achievementsIdx: pick("achievements", db.achievements),
    hobbiesIdx: pick("hobbies", db.hobbies),
    workExperienceIdx: workIdx,
  };
}

// Minimal generator: you will expand this into your real CV template
function generateCvHtml(db: CvDb, selection: any): string {
  const work = selection.workExperienceIdx.map(
    (i: number) => db.workExperience[i],
  );
  const technicalSkills = selection.technicalSkillIdx.map(
    (i: number) => db.technicalSkills[i],
  );
  const softSkills = selection.softSkillIdx.map(
    (i: number) => db.softSkills[i],
  );
  const technologies = selection.technologiesIdx.map(
    (i: number) => db.technologies[i],
  );
  const achievements = selection.achievementsIdx.map(
    (i: number) => db.achievements[i],
  );
  const hobbies = selection.hobbiesIdx.map(
    (i: number) => db.hobbies[i],
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
    .skill-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .skill-tag { background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>${esc(db.header.name)}</h1>
  <div class="contact">
    ${db.header.phone ? `<div>${esc(db.header.phone)}</div>` : ""}
    ${db.header.email ? `<div>${esc(db.header.email)}</div>` : ""}
    ${db.header.location ? `<div>${esc(db.header.location)}</div>` : ""}
    ${db.header.linkedin ? `<div><a href="${esc(db.header.linkedin)}">${esc(db.header.linkedin)}</a></div>` : ""}
    ${db.header.github ? `<div><a href="${esc(db.header.github)}">${esc(db.header.github)}</a></div>` : ""}
  </div>

  <div class="section">
    <h2>Professional Summary</h2>
    <div class="desc">${esc(db.professionalSummary)}</div>
  </div>

  ${technicalSkills.length > 0 ? `
  <div class="section">
    <h2>Technical Skills</h2>
    <div class="skill-list">
      ${technicalSkills.map((s: string) => `<span class="skill-tag">${esc(s)}</span>`).join("")}
    </div>
  </div>
  ` : ""}

  ${softSkills.length > 0 ? `
  <div class="section">
    <h2>Soft Skills</h2>
    <div class="skill-list">
      ${softSkills.map((s: string) => `<span class="skill-tag">${esc(s)}</span>`).join("")}
    </div>
  </div>
  ` : ""}

  ${technologies.length > 0 ? `
  <div class="section">
    <h2>Technologies</h2>
    <div class="skill-list">
      ${technologies.map((s: string) => `<span class="skill-tag">${esc(s)}</span>`).join("")}
    </div>
  </div>
  ` : ""}

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

  ${achievements.length > 0 ? `
  <div class="section">
    <h2>Achievements</h2>
    <ul>
      ${achievements.map((a: string) => `<li>${esc(a)}</li>`).join("")}
    </ul>
  </div>
  ` : ""}

  ${hobbies.length > 0 ? `
  <div class="section">
    <h2>Hobbies</h2>
    <div class="skill-list">
      ${hobbies.map((h: string) => `<span class="skill-tag">${esc(h)}</span>`).join("")}
    </div>
  </div>
  ` : ""}
</body>
</html>`;
}

function showCvPreview(cvHtml: string, onStartAgain: () => void) {
  const app = $("app");
  app.innerHTML = "";

  const controls = document.createElement("div");
  controls.className = "cv-controls";

  const startAgainBtn = document.createElement("button");
  startAgainBtn.textContent = "Start Again";
  startAgainBtn.onclick = onStartAgain;

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save as PDF";
  saveBtn.onclick = () => window.print();

  controls.appendChild(startAgainBtn);
  controls.appendChild(saveBtn);
  app.appendChild(controls);

  const iframe = document.createElement("iframe");
  iframe.className = "cv-preview";
  app.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(cvHtml);
    iframeDoc.close();
  }
}

$("start").addEventListener("click", async () => {
  try {
    setStatus("Loading CSV data…");

    const [
      header,
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
      loadJSON<HeaderData>("header.json"),
      loadCSV("professional-summary.csv"),
      loadCSV("technical-skills.csv"),
      loadCSV("soft-skills.csv"),
      loadCSV("technologies.csv"),
      loadCSV("work-experience.csv"),
      loadCSV("education.csv"),
      loadCSV("hobbies.csv"),
      loadCSV("achievements.csv"),
      loadCSV("referees.csv"),
    ]);

    const db = normalize(
      header,
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
