export type GuideChapter = {
  id?: number;
  title: string;
  pageNumber: number;
  content: string;
  keyPoints?: string[];
};

export function downloadGuide(chapters: GuideChapter[]) {
  const html = buildGuideHtml(chapters);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Guide-Negociation-Master.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildGuideHtml(chapters: GuideChapter[]) {
  const coverText = `Guide Négociation Master`;
  const intro = `Transformez vos relations, boostez votre vie`;
  const footerText = `Contenu réservé aux membres. Merci de conserver ce guide pour votre usage personnel.`;

  const chapterHtml = chapters.map((ch) => {
    const contentHtml = ch.content
      .split('\n\n')
      .map((para) => {
        if (para.trim().startsWith('▌') || para.trim().startsWith('⬇') || para.trim().startsWith('━━')) {
          return `<div style="font-weight:bold;margin:20px 0 10px;color:#b8860b;">${para.trim()}</div>`;
        }
        return `<p>${para.trim()}</p>`;
      })
      .join('');

    return `
  <div class="chapter">
    <div class="chapter-title">${ch.title}</div>
    <div class="chapter-meta">Page ${ch.pageNumber}</div>
    ${ch.keyPoints ? `
    <div class="key-points">
      <div class="key-points-title">✨ Points clés</div>
      <ul>
        ${ch.keyPoints.map((pt) => `<li>${pt}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    <div class="chapter-content">
      ${contentHtml}
    </div>
  </div>
`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${coverText}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.8;
      color: #1a1a1a;
      background: #fafafa;
      max-width: 850px;
      margin: 0 auto;
      padding: 50px 30px;
    }
    .cover {
      text-align: center;
      padding: 60px 20px 40px;
      border-bottom: 3px solid #b8860b;
      margin-bottom: 50px;
    }
    .cover-title {
      font-size: 42px;
      font-weight: bold;
      color: #b8860b;
      margin-bottom: 15px;
    }
    .cover-subtitle {
      font-size: 20px;
      color: #666;
      margin-bottom: 30px;
    }
    .cover-meta {
      font-size: 14px;
      color: #999;
    }
    .toc {
      margin: 40px 0 50px;
      padding: 30px;
      background: #f5f0e8;
      border-radius: 12px;
    }
    .toc-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #b8860b;
    }
    .toc-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #ddd;
      font-size: 16px;
    }
    .toc-item:last-child { border-bottom: none; }
    .chapter {
      margin-bottom: 50px;
      page-break-after: always;
    }
    .chapter:last-child { page-break-after: auto; }
    .chapter-title {
      font-size: 28px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 10px;
      border-left: 5px solid #b8860b;
      padding-left: 20px;
    }
    .chapter-meta {
      font-size: 14px;
      color: #999;
      margin-bottom: 25px;
      padding-left: 25px;
    }
    .chapter-content {
      font-size: 17px;
      line-height: 1.9;
    }
    .chapter-content p {
      margin-bottom: 18px;
      text-align: justify;
    }
    .key-points {
      background: #f5f0e8;
      padding: 20px 25px;
      border-radius: 8px;
      margin: 20px 0 30px;
      border-left: 5px solid #b8860b;
    }
    .key-points-title {
      font-weight: bold;
      color: #b8860b;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    .key-points ul {
      list-style: none;
      padding: 0;
    }
    .key-points li {
      padding: 6px 0 6px 28px;
      position: relative;
    }
    .key-points li:before {
      content: "✦";
      color: #b8860b;
      position: absolute;
      left: 0;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      font-size: 13px;
      color: #999;
      border-top: 2px solid #ddd;
      padding-top: 30px;
      margin-top: 50px;
    }
    @media print {
      body { background: white; padding: 20px; }
      .chapter { page-break-after: always; }
      .chapter:last-child { page-break-after: auto; }
    }
    @media (max-width: 600px) {
      body { padding: 20px 15px; }
      .cover-title { font-size: 28px; }
      .chapter-title { font-size: 22px; }
      .toc-item { font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="cover">
    <div class="cover-title">${coverText}</div>
    <div class="cover-subtitle">${intro}</div>
    <div class="cover-meta">
      <p>${chapters.length} chapitres · ${new Date().getFullYear()}</p>
      <p style="margin-top:10px;font-size:12px;color:#bbb;">Contenu réservé aux membres. Conservez-le pour votre usage personnel.</p>
    </div>
  </div>

  <div class="toc">
    <div class="toc-title">📚 Sommaire</div>
    ${chapters.map((ch, i) => `
      <div class="toc-item">
        <span>${i + 1}. ${ch.title}</span>
        <span style="color:#999;">Page ${ch.pageNumber}</span>
      </div>
    `).join('')}
  </div>

  ${chapterHtml}

  <div class="footer">
    <p>Guide Négociation Master © ${new Date().getFullYear()} · Tous droits réservés</p>
    <p style="margin-top:10px;font-size:12px;">${footerText}</p>
  </div>
</body>
</html>`;
}
