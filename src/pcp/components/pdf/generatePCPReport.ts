import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PCPState, SectionScore, SectionId } from '../../types';
import { CHECKLIST_SECTIONS } from '../../data/checklistData';
import { ACTION_PLANS } from '../../data/actionPlans';
import type { ActionPlan } from '../../data/actionPlans';
import { calcScore } from '../../utils/scoring';
import logoSquare from '../../assets/logo-square.png';

type RGB = [number, number, number];

const BLUE_DARK: RGB = [30, 58, 138];
const BLUE_MID: RGB = [59, 130, 246];
const SLATE_800: RGB = [30, 41, 59];
const SLATE_500: RGB = [100, 116, 139];
const SLATE_600: RGB = [71, 85, 105];
const WHITE: RGB = [255, 255, 255];
const AMBER_100: RGB = [254, 243, 199];
const AMBER_400: RGB = [251, 191, 36];
const AMBER_900: RGB = [120, 53, 15];
const GREEN: RGB = [34, 197, 94];
const YELLOW: RGB = [251, 191, 36];
const RED: RGB = [239, 68, 68];
const SLATE_100: RGB = [241, 245, 249];
const BLUE_50: RGB = [239, 246, 255];
const BLUE_100: RGB = [219, 234, 254];

function semaforoRGB(s: 'red' | 'yellow' | 'green'): RGB {
  if (s === 'green') return GREEN;
  if (s === 'yellow') return YELLOW;
  return RED;
}

function semaforoStatusLabel(s: 'red' | 'yellow' | 'green'): string {
  if (s === 'green') return 'Consolidado';
  if (s === 'yellow') return 'Em Desenvolvimento';
  return 'Crítico';
}

function prazoLabel(p: ActionPlan['prazo']): string {
  if (p === 'imediato') return 'Imediato';
  if (p === 'curto') return 'Curto prazo';
  return 'Médio prazo';
}

function prazoRGB(p: ActionPlan['prazo']): RGB {
  if (p === 'imediato') return [239, 68, 68];
  if (p === 'curto') return [251, 191, 36];
  return [59, 130, 246];
}

function getDoc() {
  return new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as jsPDF & {
    lastAutoTable: { finalY: number };
  };
}

export function generatePCPReport(state: PCPState): void {
  const doc = getDoc();
  const { companyInfo, answers, impressao } = state;

  const scores: SectionScore[] = CHECKLIST_SECTIONS.map(sec =>
    calcScore(sec, answers[sec.id as SectionId]),
  );

  // ── PAGE 1: Cover ─────────────────────────────────────────────────────────
  doc.setFillColor(...BLUE_DARK);
  doc.rect(0, 0, 210, 70, 'F');
  doc.setFillColor(...BLUE_MID);
  doc.rect(0, 68, 210, 4, 'F');

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('Diagnóstico de PCP', 105, 30, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Planejamento e Controle da Produção', 105, 43, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Construção Civil', 105, 54, { align: 'center' });

  doc.addImage(logoSquare, 'PNG', 152, 8, 32, 32);

  doc.setTextColor(...SLATE_800);
  const infoStartY = 90;
  const rows: [string, string][] = [
    ['Empresa:', companyInfo.empresa || '—'],
    ['CNPJ:', companyInfo.cnpj || '—'],
    ['Responsável:', companyInfo.responsavel || '—'],
    ['Cargo:', companyInfo.cargo || '—'],
    ['Data:', companyInfo.data || '—'],
    ['Obra / Projeto:', companyInfo.obraProjeto || '—'],
  ];
  rows.forEach(([label, value], i) => {
    const y = infoStartY + i * 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...SLATE_500);
    doc.text(label, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE_800);
    doc.text(value, 68, y);
    doc.setDrawColor(230, 234, 240);
    doc.setLineWidth(0.3);
    doc.line(20, y + 3, 190, y + 3);
  });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_500);
  doc.text('Relatório gerado automaticamente pelo sistema ObraCheck — Diagnóstico PCP', 105, 268, { align: 'center' });

  // ── PAGE 2: Executive Summary ──────────────────────────────────────────────
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...SLATE_800);
  doc.text('Resumo Executivo', 20, 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_500);
  doc.text('Pontuação geral por dimensão do PCP avaliada', 20, 30);

  autoTable(doc, {
    startY: 36,
    head: [['#', 'Dimensão', 'Score', 'Status', 'Situação']],
    body: scores.map((sc, i) => [`${i + 1}`, sc.titulo, `${sc.percentual}%`, '●', semaforoStatusLabel(sc.semaforo)]),
    headStyles: { fillColor: BLUE_DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { textColor: SLATE_800, fontSize: 9 },
    alternateRowStyles: { fillColor: SLATE_100 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 50 },
    },
    didDrawCell: (data) => {
      if (data.column.index === 3 && data.section === 'body') {
        const rgb = semaforoRGB(scores[data.row.index].semaforo);
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        doc.setFontSize(14);
        doc.text('●', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2, { align: 'center' });
        doc.setTextColor(...SLATE_800);
        doc.setFontSize(9);
      }
    },
  });

  const legendY = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_600);
  doc.text('Legenda:', 20, legendY);
  const legend: [RGB, string][] = [
    [GREEN, 'Consolidado (71-100%)'],
    [YELLOW, 'Em Desenvolvimento (41-70%)'],
    [RED, 'Crítico (0-40%)'],
  ];
  legend.forEach(([color, label], i) => {
    doc.setFillColor(...color);
    doc.circle(35 + i * 68, legendY + 5, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE_800);
    doc.text(label, 39 + i * 68, legendY + 6);
  });

  // ── PAGES 3-8: One per section ─────────────────────────────────────────────
  CHECKLIST_SECTIONS.forEach((section, idx) => {
    doc.addPage();
    const score = scores[idx];
    const sectionAnswers = answers[section.id as SectionId];
    const headerColor = semaforoRGB(score.semaforo);

    doc.setFillColor(...headerColor);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Seção ${idx + 1}: ${section.titulo}`, 15, 13);
    doc.setFontSize(10);
    doc.text(`${score.percentual}% — ${semaforoStatusLabel(score.semaforo)}`, 195, 13, { align: 'right' });

    doc.setTextColor(...SLATE_500);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(section.descricao, 15, 28);

    autoTable(doc, {
      startY: 32,
      head: [['#', 'Item de Verificação', 'Resp.']],
      body: section.items.map((item, i) => {
        const resp = sectionAnswers.respostas[item.id];
        return [`${i + 1}`, item.texto, resp === true ? 'Sim' : resp === false ? 'Não' : '—'];
      }),
      headStyles: { fillColor: SLATE_600, textColor: WHITE, fontSize: 8 },
      bodyStyles: { textColor: SLATE_800, fontSize: 8 },
      alternateRowStyles: { fillColor: SLATE_100 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 158 },
        2: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      },
      didDrawCell: (data) => {
        if (data.column.index === 2 && data.section === 'body') {
          const item = section.items[data.row.index];
          const resp = sectionAnswers.respostas[item.id];
          if (resp === true) doc.setTextColor(34, 197, 94);
          else if (resp === false) doc.setTextColor(239, 68, 68);
          else doc.setTextColor(148, 163, 184);
          doc.setFontSize(8);
          const text = resp === true ? 'Sim' : resp === false ? 'Não' : '—';
          doc.text(text, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
          doc.setTextColor(...SLATE_800);
        }
      },
    });

    if (sectionAnswers.observacoes.trim()) {
      const obsY = doc.lastAutoTable.finalY + 7;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, obsY, 180, 8, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...SLATE_600);
      doc.text('Observações:', 19, obsY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...SLATE_800);
      const wrapped = doc.splitTextToSize(sectionAnswers.observacoes, 155);
      const extraH = Math.max(0, (wrapped.length - 1) * 4);
      if (extraH > 0) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, obsY, 180, 8 + extraH, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...SLATE_600);
        doc.text('Observações:', 19, obsY + 5);
      }
      doc.setFont('helvetica', 'normal');
      doc.text(wrapped, 52, obsY + 5);
    }
  });

  // ── PRIORITIES PAGE ────────────────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(...BLUE_DARK);
  doc.rect(0, 0, 210, 20, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Prioridades de Ação', 105, 13, { align: 'center' });

  impressao.prioridades.forEach((p, i) => {
    const y = 30 + i * 24;
    doc.setFillColor(...AMBER_100);
    doc.roundedRect(15, y, 180, 18, 3, 3, 'F');
    doc.setFillColor(...AMBER_400);
    doc.roundedRect(15, y, 10, 18, 2, 2, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`${i + 1}`, 20, y + 11);
    doc.setTextColor(...AMBER_900);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(p || '(não informado)', 30, y + 11);
  });

  if (impressao.observacoesGerais.trim()) {
    const obsY = 110;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...SLATE_800);
    doc.text('Observações Gerais', 20, obsY);
    doc.setDrawColor(...BLUE_MID);
    doc.setLineWidth(0.5);
    doc.line(20, obsY + 2, 190, obsY + 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...SLATE_800);
    const wrapped = doc.splitTextToSize(impressao.observacoesGerais, 170);
    doc.text(wrapped, 20, obsY + 10);
  }

  // ── ACTION PLAN PAGES ──────────────────────────────────────────────────────
  const actionsBySec = CHECKLIST_SECTIONS.map(sec => {
    const secAnswers = answers[sec.id as SectionId];
    const failedItems = sec.items.filter(item => secAnswers.respostas[item.id] === false);
    const plans = failedItems
      .map(item => ACTION_PLANS.find(ap => ap.itemId === item.id))
      .filter((ap): ap is ActionPlan => ap !== undefined);
    return { section: sec, plans };
  }).filter(s => s.plans.length > 0);

  if (actionsBySec.length > 0) {
    doc.addPage();

    // Action plan cover strip
    doc.setFillColor(...BLUE_DARK);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Plano de Ação Detalhado', 105, 13, { align: 'center' });

    const totalAcoes = actionsBySec.reduce((s, x) => s + x.plans.length, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${totalAcoes} ação(ões) recomendada(s) para os itens respondidos "Não"`,
      105, 28, { align: 'center' },
    );
    doc.setTextColor(...SLATE_500);
    doc.setFontSize(8);
    doc.text(
      'Baseado em Last Planner System, Lean Construction, PMBOK e boas práticas de gestão de obras',
      105, 35, { align: 'center' },
    );

    let curY = 44;

    for (const { section, plans } of actionsBySec) {
      // Section header
      if (curY > 255) { doc.addPage(); curY = 15; }
      doc.setFillColor(...BLUE_100);
      doc.roundedRect(15, curY, 180, 8, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 64, 175);
      doc.text(section.titulo.toUpperCase(), 20, curY + 5.5);
      doc.setTextColor(30, 64, 175);
      doc.setFontSize(8);
      doc.text(`${plans.length} ação(ões)`, 192, curY + 5.5, { align: 'right' });
      curY += 11;

      for (const plan of plans) {
        // Estimate height: title(10) + desc(lines*4) + steps(n*8) + metodologia(6) + margin(6)
        const descLines = doc.splitTextToSize(plan.descricao, 160).length;
        const stepsHeight = plan.passos.reduce((h, p) => {
          return h + doc.splitTextToSize(p, 148).length * 4 + 2;
        }, 0);
        const estimatedH = 10 + descLines * 4 + stepsHeight + 14;

        if (curY + estimatedH > 272) { doc.addPage(); curY = 15; }

        // Card background
        doc.setFillColor(...BLUE_50);
        doc.roundedRect(15, curY, 180, estimatedH, 2, 2, 'F');
        doc.setDrawColor(...BLUE_100);
        doc.setLineWidth(0.3);
        doc.roundedRect(15, curY, 180, estimatedH, 2, 2, 'S');

        // Prazo badge
        const pRGB = prazoRGB(plan.prazo);
        doc.setFillColor(pRGB[0], pRGB[1], pRGB[2]);
        doc.roundedRect(165, curY + 2, 28, 5, 1, 1, 'F');
        doc.setTextColor(...WHITE);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text(prazoLabel(plan.prazo), 179, curY + 5.3, { align: 'center' });

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...SLATE_800);
        doc.text(plan.titulo, 19, curY + 7);

        // Responsável
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...SLATE_500);
        doc.text(`Responsável: ${plan.responsavel}`, 19, curY + 12);

        let lineY = curY + 17;

        // Description
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...SLATE_600);
        const descWrapped = doc.splitTextToSize(plan.descricao, 168);
        doc.text(descWrapped, 19, lineY);
        lineY += descWrapped.length * 4 + 3;

        // Steps
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...SLATE_800);
        doc.text('Passos de implementação:', 19, lineY);
        lineY += 4;

        plan.passos.forEach((passo, pi) => {
          const pw = doc.splitTextToSize(passo, 148);
          doc.setFillColor(59, 130, 246);
          doc.circle(21, lineY - 1, 1.5, 'F');
          doc.setTextColor(...WHITE);
          doc.setFontSize(6);
          doc.text(`${pi + 1}`, 21, lineY - 0.3, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(...SLATE_800);
          doc.text(pw, 25, lineY);
          lineY += pw.length * 4 + 2;
        });

        // Methodology
        doc.setFillColor(219, 234, 254);
        doc.roundedRect(17, lineY, 174, 6, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(30, 64, 175);
        doc.text('Metodologia: ', 20, lineY + 4);
        doc.setFont('helvetica', 'normal');
        const metaStart = 20 + doc.getTextWidth('Metodologia: ');
        const metaWrapped = doc.splitTextToSize(plan.metodologia, 160 - metaStart + 20);
        doc.text(metaWrapped[0], metaStart, lineY + 4);

        curY += estimatedH + 4;
      }

      curY += 4;
    }
  }

  // ── Footers ────────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 286, 210, 11, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE_500);
    doc.text(
      `Diagnóstico PCP  ·  ${companyInfo.empresa || 'Empresa'}  ·  Página ${pg} de ${totalPages}`,
      105, 292, { align: 'center' },
    );
  }

  const safeName = (companyInfo.empresa || 'empresa').replace(/\s+/g, '-').toLowerCase();
  doc.save(`diagnostico-pcp-${safeName}.pdf`);
}
