import { ACTIVE_SESSION_ID, getDatabase } from './database';
import { parseDateLabel, toISODate } from '../utils/date';
import type { IndicatorRow, TreeRecord, TreeRow } from '../types';

export type HydratedData = {
  general: Record<string, string> | null;
  dateValue: Date | null;
  trees: TreeRecord[];
};

export const initializeDatabase = async (initialDate: Date): Promise<HydratedData> => {
  const db = await getDatabase();
  await db.execAsync(
    `
          PRAGMA foreign_keys = ON;

          CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY NOT NULL,
            date_key TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS general_page (
            session_id INTEGER PRIMARY KEY NOT NULL,
            assessor_name TEXT,
            date_label TEXT,
            certificate_number TEXT,
            map_attached TEXT,
            district TEXT,
            location TEXT,
            licensee_cp TEXT,
            block TEXT,
            activity TEXT,
            level_of_disturbance TEXT,
            other_reference TEXT,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS tree_page (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            tree_number INTEGER NOT NULL,
            date_key TEXT NOT NULL,
            species TEXT,
            tree_class TEXT,
            wildlife_value TEXT,
            tree_height TEXT,
            diameter TEXT,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS lod_page (
            tree_page_id INTEGER PRIMARY KEY NOT NULL,
            lod INTEGER NOT NULL,
            FOREIGN KEY (tree_page_id) REFERENCES tree_page(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS lod_details_page (
            tree_page_id INTEGER PRIMARY KEY NOT NULL,
            ast TEXT,
            rst TEXT,
            FOREIGN KEY (tree_page_id) REFERENCES tree_page(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS danger_indicators_page (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tree_page_id INTEGER NOT NULL,
            label TEXT NOT NULL,
            checked INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (tree_page_id) REFERENCES tree_page(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS decision_page (
            tree_page_id INTEGER PRIMARY KEY NOT NULL,
            decision TEXT NOT NULL,
            FOREIGN KEY (tree_page_id) REFERENCES tree_page(id) ON DELETE CASCADE
          );
          `
  );

  await db.runAsync(
    `INSERT INTO sessions (id, date_key) VALUES (?, ?)
           ON CONFLICT(id) DO NOTHING`,
    ACTIVE_SESSION_ID,
    toISODate(initialDate)
  );

  const generalRow = await db.getFirstAsync<{
    assessor_name: string | null;
    date_label: string | null;
    certificate_number: string | null;
    map_attached: string | null;
    district: string | null;
    location: string | null;
    licensee_cp: string | null;
    block: string | null;
    activity: string | null;
    level_of_disturbance: string | null;
    other_reference: string | null;
  }>(
    `SELECT assessor_name, date_label, certificate_number, map_attached, district, location,
                  licensee_cp, block, activity, level_of_disturbance, other_reference
           FROM general_page
           WHERE session_id = ?`,
    ACTIVE_SESSION_ID
  );

  let general: Record<string, string> | null = null;
  let dateValue: Date | null = null;

  if (generalRow) {
    general = {
      assessorName: generalRow.assessor_name ?? '',
      date: generalRow.date_label ?? '',
      certificateNumber: generalRow.certificate_number ?? '',
      mapAttached: generalRow.map_attached ?? '',
      district: generalRow.district ?? '',
      location: generalRow.location ?? '',
      licenseeCp: generalRow.licensee_cp ?? '',
      block: generalRow.block ?? '',
      activity: generalRow.activity ?? '',
      levelOfDisturbance: generalRow.level_of_disturbance ?? '',
      otherReference: generalRow.other_reference ?? '',
    };

    if (general.date) {
      const parsedDate = parseDateLabel(general.date);
      if (parsedDate) {
        dateValue = parsedDate;
      }
    }
  }

  const treeRows = await db.getAllAsync<TreeRow>(
    `SELECT
             t.id AS treeId,
             t.tree_number AS treeNumber,
             t.date_key AS dateKey,
             t.species AS species,
             t.tree_class AS treeClass,
             t.wildlife_value AS wildlifeValue,
             t.tree_height AS treeHeight,
             t.diameter AS diameter,
             l.lod AS lod,
             ld.ast AS ast,
             ld.rst AS rst,
             d.decision AS decision
           FROM tree_page t
           INNER JOIN lod_page l ON l.tree_page_id = t.id
           INNER JOIN decision_page d ON d.tree_page_id = t.id
           LEFT JOIN lod_details_page ld ON ld.tree_page_id = t.id
           WHERE t.session_id = ?
           ORDER BY t.id DESC`,
    ACTIVE_SESSION_ID
  );

  const trees: TreeRecord[] = [];
  for (const row of treeRows) {
    const indicators = await db.getAllAsync<IndicatorRow>(
      `SELECT label, checked
             FROM danger_indicators_page
             WHERE tree_page_id = ?`,
      row.treeId
    );
    const lodChecks = indicators.reduce<Record<string, boolean>>((acc, indicator) => {
      acc[indicator.label] = Boolean(indicator.checked);
      return acc;
    }, {});

    trees.push({
      id: String(row.treeId),
      treeNumber: row.treeNumber,
      dateKey: row.dateKey,
      tree: {
        species: row.species ?? '',
        treeClass: row.treeClass ?? '',
        wildlifeValue: row.wildlifeValue ?? '',
        treeHeight: row.treeHeight ?? '',
        diameter: row.diameter ?? '',
      },
      lod: row.lod as 1 | 2 | 3 | 4,
      lodChecks,
      ast: row.ast ?? undefined,
      rst: row.rst ?? undefined,
      decision: row.decision,
    });
  }

  return { general, dateValue, trees };
};

export const persistGeneral = async (general: Record<string, string>, dateValue: Date) => {
  const db = await getDatabase();
  const dateKey = toISODate(dateValue);
  await db.runAsync(
    `INSERT INTO sessions (id, date_key, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(id) DO UPDATE SET date_key = excluded.date_key, updated_at = CURRENT_TIMESTAMP`,
    ACTIVE_SESSION_ID,
    dateKey
  );

  await db.runAsync(
    `INSERT INTO general_page (
             session_id, assessor_name, date_label, certificate_number, map_attached, district,
             location, licensee_cp, block, activity, level_of_disturbance, other_reference
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(session_id) DO UPDATE SET
             assessor_name = excluded.assessor_name,
             date_label = excluded.date_label,
             certificate_number = excluded.certificate_number,
             map_attached = excluded.map_attached,
             district = excluded.district,
             location = excluded.location,
             licensee_cp = excluded.licensee_cp,
             block = excluded.block,
             activity = excluded.activity,
             level_of_disturbance = excluded.level_of_disturbance,
             other_reference = excluded.other_reference`,
    ACTIVE_SESSION_ID,
    general.assessorName ?? '',
    general.date ?? '',
    general.certificateNumber ?? '',
    general.mapAttached ?? '',
    general.district ?? '',
    general.location ?? '',
    general.licenseeCp ?? '',
    general.block ?? '',
    general.activity ?? '',
    general.levelOfDisturbance ?? '',
    general.otherReference ?? ''
  );
};

const resolveTreePageId = async (record: TreeRecord) => {
  const numericId = Number(record.id);
  if (!Number.isNaN(numericId) && numericId > 0) return numericId;
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM tree_page WHERE session_id = ? AND tree_number = ? AND date_key = ?`,
    ACTIVE_SESSION_ID,
    record.treeNumber,
    record.dateKey
  );
  return row?.id ?? null;
};

export const persistTreeRecord = async (record: TreeRecord) => {
  const db = await getDatabase();
  let treePageId = 0;

  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO tree_page (
           session_id, tree_number, date_key, species, tree_class, wildlife_value, tree_height, diameter
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ACTIVE_SESSION_ID,
      record.treeNumber,
      record.dateKey,
      record.tree.species ?? '',
      record.tree.treeClass ?? '',
      record.tree.wildlifeValue ?? '',
      record.tree.treeHeight ?? '',
      record.tree.diameter ?? ''
    );

    treePageId = Number(result.lastInsertRowId ?? 0);
    await db.runAsync(
      `INSERT INTO lod_page (tree_page_id, lod) VALUES (?, ?)`,
      treePageId,
      record.lod
    );

    await db.runAsync(
      `INSERT INTO lod_details_page (tree_page_id, ast, rst) VALUES (?, ?, ?)`,
      treePageId,
      record.ast ?? null,
      record.rst ?? null
    );

    const selectedDangers = Object.keys(record.lodChecks).filter((label) => record.lodChecks[label]);
    for (const label of selectedDangers) {
      await db.runAsync(
        `INSERT INTO danger_indicators_page (tree_page_id, label, checked) VALUES (?, ?, 1)`,
        treePageId,
        label
      );
    }

    await db.runAsync(
      `INSERT INTO decision_page (tree_page_id, decision) VALUES (?, ?)`,
      treePageId,
      record.decision
    );
  });
  return treePageId;
};

export const updateTreeRecord = async (record: TreeRecord) => {
  const db = await getDatabase();
  const treePageId = await resolveTreePageId(record);
  if (!treePageId) throw new Error('Tree record not found.');

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE tree_page
         SET tree_number = ?, date_key = ?, species = ?, tree_class = ?, wildlife_value = ?, tree_height = ?, diameter = ?
         WHERE id = ?`,
      record.treeNumber,
      record.dateKey,
      record.tree.species ?? '',
      record.tree.treeClass ?? '',
      record.tree.wildlifeValue ?? '',
      record.tree.treeHeight ?? '',
      record.tree.diameter ?? '',
      treePageId
    );

    await db.runAsync(
      `INSERT INTO lod_page (tree_page_id, lod) VALUES (?, ?)
         ON CONFLICT(tree_page_id) DO UPDATE SET lod = excluded.lod`,
      treePageId,
      record.lod
    );

    await db.runAsync(
      `INSERT INTO lod_details_page (tree_page_id, ast, rst) VALUES (?, ?, ?)
         ON CONFLICT(tree_page_id) DO UPDATE SET ast = excluded.ast, rst = excluded.rst`,
      treePageId,
      record.ast ?? null,
      record.rst ?? null
    );

    await db.runAsync(
      `DELETE FROM danger_indicators_page WHERE tree_page_id = ?`,
      treePageId
    );

    const selectedDangers = Object.keys(record.lodChecks).filter((label) => record.lodChecks[label]);
    for (const label of selectedDangers) {
      await db.runAsync(
        `INSERT INTO danger_indicators_page (tree_page_id, label, checked) VALUES (?, ?, 1)`,
        treePageId,
        label
      );
    }

    await db.runAsync(
      `INSERT INTO decision_page (tree_page_id, decision) VALUES (?, ?)
         ON CONFLICT(tree_page_id) DO UPDATE SET decision = excluded.decision`,
      treePageId,
      record.decision
    );
  });

  return treePageId;
};

export const deleteTreeRecord = async (record: TreeRecord) => {
  const db = await getDatabase();
  const treePageId = await resolveTreePageId(record);
  if (!treePageId) throw new Error('Tree record not found.');
  await db.runAsync(`DELETE FROM tree_page WHERE id = ?`, treePageId);
};
