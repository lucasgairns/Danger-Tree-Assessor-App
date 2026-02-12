import * as FileSystem from 'expo-file-system';

import { parseDecision } from './decision';
import type { TreeRecord } from '../types';

export const buildExportHtml = async (general: Record<string, string>, trees: TreeRecord[]) => {
  const mark = (checked: boolean) => (checked ? '&#9745;' : '&#9744;');
  const management = (decisionValue: string) => {
    const base = parseDecision(decisionValue).base;
    return {
      safe: base === 'Safe',
      nwz: base === 'Dangerous - Create NWZ',
      other: base !== 'Safe' && base !== 'Dangerous - Create NWZ',
    };
  };
  const overallRating = (decisionValue: string) =>
    parseDecision(decisionValue).base === 'Safe' ? 'S' : 'D';

  const rows = trees.slice().reverse().map((record) => {
    const checks = record.lodChecks || {};
    const managementFlags = management(record.decision);
    return `
      <tr>
        <td class="center">${record.treeNumber}</td>
        <td>${record.tree.species || ''}</td>
        <td class="center">${record.tree.treeClass || ''}</td>
        <td class="center">${record.tree.wildlifeValue || ''}</td>
        <td class="center">${record.tree.treeHeight || ''}</td>
        <td class="center">${record.tree.diameter || ''}</td>
        <td class="center">${mark(Boolean(checks['Insecurely lodged or hung up limbs/tops']))}</td>
        <td class="center">${mark(Boolean(checks['Highly unstable tree']))}</td>
        <td class="center">${mark(Boolean(checks['Recent lean with unstable roots']))}</td>
        <td class="center">${mark(Boolean(checks['Hazardous Top']))}</td>
        <td class="center">${mark(Boolean(checks['Dead Limbs']))}</td>
        <td class="center">${mark(Boolean(checks['Witches\' Broom']))}</td>
        <td class="center">${mark(Boolean(checks['Split Trunk']))}</td>
        <td class="center">${mark(Boolean(checks['Stem Damage']))}</td>
        <td class="center">${mark(Boolean(checks['Thick Sloughing Bark or Sapwood']))}</td>
        <td class="center">${mark(Boolean(checks['Butt and Stem Cankers']))}</td>
        <td class="center">${mark(Boolean(checks['Fungal Fruiting Bodies']))}</td>
        <td class="center">${mark(Boolean(checks['Tree Lean']))}</td>
        <td class="center">${mark(Boolean(checks['Root Inspection']))}</td>
        <td class="center">${record.rst || ''}</td>
        <td class="center">${record.ast || ''}</td>
        <td class="center">${mark(Boolean(checks['Class 1 Tree']))}</td>
        <td class="center">${mark(Boolean(checks['Class 2 tree with no structural defects']))}</td>
        <td class="center">${mark(Boolean(checks['Class 2 Cedar with low failture potential']))}</td>
        <td class="center">${mark(Boolean(checks['Class 3 Conifer with no structural defects']))}</td>
        <td class="center">${mark(Boolean(checks['None of the above']))}</td>
        <td class="center">${overallRating(record.decision)}</td>
        <td class="center">${mark(managementFlags.safe)}</td>
        <td class="center">${mark(managementFlags.nwz)}</td>
        <td class="center">${mark(managementFlags.other)}</td>
        <td class="center">${general.date || ''}</td>
      </tr>
    `;
  });

  const buildAttachmentPage = async (uri: string) => {
    if (!uri) return '';
    const sanitized = uri.split('?')[0].split('#')[0];
    const ext = sanitized.split('.').pop()?.toLowerCase() ?? '';
    const imageExts = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);
    if (!imageExts.has(ext)) return '';

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      return `
      <div class="attachment-page">
        <img class="attachment-image-full" src="data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${base64}" />
      </div>`;
    } catch (err) {
      return '';
    }
  };

  const attachmentPage = await buildAttachmentPage(general.mapAttached || '');

  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Danger Tree Assessment Field Data</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; margin: 16px; color: #000; }
      .form { width: 1000px; margin: 0 auto; }
      h1 { font-size: 16px; margin: 6px 0 4px; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      td, th { border: 1px solid #000; padding: 2px 3px; font-size: 9px; line-height: 1.1; }
      .center { text-align: center; }
      .header-table td { font-size: 10px; height: 18px; }
      .section { font-weight: 700; text-align: center; }
      .vertical { writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; }
      .small { font-size: 8px; }
      .comments td { height: 16px; }
      .attachment-page {
        page-break-before: always;
        width: 100vw;
        height: 100vh;
        margin: 0;
        padding: 0;
      }
      .attachment-image-full {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }
    </style>
  </head>
  <body>
    <div class="form">
      <h1>DANGER TREE ASSESSMENT FIELD DATA</h1>
      <table class="header-table">
        <tr>
          <td colspan="4"><strong>District:</strong> ${general.district || ''}</td>
          <td colspan="5"><strong>Location:</strong> ${general.location || ''}</td>
          <td colspan="3"><strong>Licensee:</strong> ${general.licenseeCp || ''}</td>
          <td colspan="3"><strong>Assessor's Name:</strong> ${general.assessorName || ''}</td>
          <td colspan="2"><strong>Date:</strong> ${general.date || ''}</td>
        </tr>
        <tr>
          <td colspan="4"><strong>Licencee/CP:</strong> ${general.licenseeCp || ''}</td>
          <td colspan="3"><strong>Block:</strong> ${general.block || ''}</td>
          <td colspan="5"><strong>Other Reference:</strong> ${general.otherReference || ''}</td>
          <td colspan="3"><strong>Certificate #</strong> ${general.certificateNumber || ''}</td>
          <td colspan="2"><strong>Map Attached:</strong> ${mark(Boolean(general.mapAttached))}</td>
        </tr>
        <tr>
          <td colspan="12"><strong>Activity:</strong> ${general.activity || ''}</td>
          <td colspan="5"><strong>Level of Disturbance (LOD):</strong> ${general.levelOfDisturbance || ''}</td>
        </tr>
      </table>
      <table>
        <tr>
          <th rowspan="3" class="vertical">Tree #</th>
          <th rowspan="3" class="vertical">Species</th>
          <th rowspan="3" class="vertical">Tree Class</th>
          <th rowspan="3" class="vertical">Wildlife Value (Low, Mod, High)</th>
          <th rowspan="3" class="vertical">Tree Height (m)</th>
          <th rowspan="3" class="vertical">Diameter (cm)</th>
          <th colspan="3" class="section">LOD = 1</th>
          <th colspan="10" class="section">LOD = 2 or 3</th>
          <th colspan="2" class="section small">Stem Thickness</th>
          <th colspan="5" class="section">LOD = 4</th>
          <th rowspan="3" class="vertical">OVERALL RATING (S or D)</th>
          <th colspan="3" class="section">Management</th>
          <th rowspan="3" class="vertical">Action completed yyyy/mm/dd</th>
        </tr>
        <tr>
          <th colspan="3" class="center small">From Table 3</th>
          <th colspan="10" class="center small">From Table 4 or 4A</th>
          <th colspan="2" class="center small">AST / RST</th>
          <th colspan="5" class="center small">From Table 5</th>
          <th colspan="3" class="center small"> </th>
        </tr>
        <tr>
          <th class="vertical">Insecurely lodged / hung up limbs/tops = D</th>
          <th class="vertical">Highly unstable tree = D</th>
          <th class="vertical">Recent lean with unstable roots = D</th>
          <th class="vertical">HT</th>
          <th class="vertical">DL</th>
          <th class="vertical">WB</th>
          <th class="vertical">ST</th>
          <th class="vertical">SD</th>
          <th class="vertical">SB</th>
          <th class="vertical">CA</th>
          <th class="vertical">CM</th>
          <th class="vertical">TL</th>
          <th class="vertical">RI</th>
          <th class="vertical">RST (radius x 0.3)</th>
          <th class="vertical">AST (cm)</th>
          <th class="vertical">Class 1 Trees = S</th>
          <th class="vertical">Class 2 trees with no structural defects = S</th>
          <th class="vertical">Class 2 cedar with low failure potential = S</th>
          <th class="vertical">Class 3 conifer with no structural defects = S</th>
          <th class="vertical">None of the above = D</th>
          <th class="vertical">Safe - no action required</th>
          <th class="vertical">Dangerous - Install NWZ</th>
          <th class="vertical">Other (remove hazardous part)</th>
        </tr>
        ${rows.join('')}
      </table>
      <table class="comments" style="margin-top: 6px;">
        <tr><td colspan="1"><strong>Comments</strong></td></tr>
        <tr><td>&nbsp;</td></tr>
        <tr><td>&nbsp;</td></tr>
        <tr><td>&nbsp;</td></tr>
        <tr><td>&nbsp;</td></tr>
      </table>
    </div>
    ${attachmentPage}
  </body>
  </html>`;
};
