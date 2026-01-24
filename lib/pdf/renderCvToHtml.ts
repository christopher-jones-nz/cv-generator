import { ItemType } from "@prisma/client";

type CvModel = {
  headerName: string;
  headerPhone: string;
  headerEmail: string;
  headerLinks: string;
  summary: string;
  sections: Record<ItemType, { title: string; content: string }[]>;
};

function csvJoin(items: string[]) {
  return items.join(", ");
}

export function renderCvToHtml(model: CvModel) {
  const techSkills = model.sections.TECHNICAL_SKILL?.map((i) => i.title) ?? [];
  const softSkills = model.sections.SOFT_SKILL?.map((i) => i.title) ?? [];
  const langs = model.sections.LANGUAGE?.map((i) => i.title) ?? [];
  const tech = model.sections.TECHNOLOGY?.map((i) => i.title) ?? [];
  const hobbies = model.sections.HOBBY?.map((i) => i.title) ?? [];

  const achievements = model.sections.ACHIEVEMENT ?? [];
  const work = model.sections.WORK_EXPERIENCE ?? [];
  const edu = model.sections.EDUCATION ?? [];
  const refs = model.sections.REFEREE ?? [];

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${/* inject css file content at runtime in route */ ""}</style>
</head>
<body>
  <div class="header">
    <div class="name">${escapeHtml(model.headerName)}</div>
    <div class="contact">
      ${escapeHtml(model.headerPhone)} • ${escapeHtml(model.headerEmail)}${model.headerLinks ? " • " + escapeHtml(model.headerLinks) : ""}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div class="paragraph">${escapeHtml(model.summary)}</div>
  </div>

  <div class="section">
    <div class="section-title">Technical Skills</div>
    <div class="paragraph">${escapeHtml(csvJoin(techSkills))}</div>
  </div>

  <div class="section">
    <div class="section-title">Soft Skills</div>
    <div class="paragraph">${escapeHtml(csvJoin(softSkills))}</div>
  </div>

  <div class="section">
    <div class="section-title">Programming Languages and Technologies</div>
    <div class="paragraph">${escapeHtml(csvJoin([...langs, ...tech]))}</div>
  </div>

  <div class="section">
    <div class="section-title">Work Experience</div>
    ${work.map((w) => `<div class="paragraph">${escapeHtml(w.content)}</div>`).join("")}
  </div>

  <div class="section">
    <div class="section-title">Education</div>
    ${edu.map((e) => `<div class="paragraph">${escapeHtml(e.content)}</div>`).join("")}
  </div>

  <div class="section">
    <div class="section-title">Hobbies and Interests</div>
    <div class="paragraph">${escapeHtml(csvJoin(hobbies))}</div>
  </div>

  <div class="section">
    <div class="section-title">Achievements and Extracurricular Activities</div>
    <ul>
      ${achievements.map((a) => `<li>${escapeHtml(a.content || a.title)}</li>`).join("")}
    </ul>
  </div>

  <div class="section">
    <div class="section-title">Referees</div>
    ${refs
      .slice(0, 3)
      .map(
        (r) =>
          `<div class="paragraph">${escapeHtml(r.content || r.title)}</div>`,
      )
      .join("")}
  </div>
</body>
</html>
  `;
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
