// database.js
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("little_lemon"); // sync API to match tx callbacks

export async function createTable() {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS menuitems (
            id INTEGER PRIMARY KEY NOT NULL,
            name TEXT,
            price TEXT,
            description TEXT,
            image TEXT,
            category TEXT
          );`
        );
      },
      reject,
      resolve
    );
  });
}

export async function getMenuItems() {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          "SELECT * FROM menuitems ORDER BY category, name;",
          [],
          (_t, { rows }) => resolve(rows._array),
          (_t, e) => {
            reject(e);
            return true;
          }
        );
      },
      reject
    );
  });
}

// Bulk insert with a single SQL statement
export async function saveMenuItems(menuItems) {
  if (!Array.isArray(menuItems) || menuItems.length === 0) return;

  const cols = "(id, name, price, description, image, category)";
  const placeholders = menuItems.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");
  const params = [];
  for (const it of menuItems) {
    params.push(
      it.id ?? null,
      it.name ?? "",
      it.price ?? "",
      it.description ?? "",
      it.image ?? "",
      it.category ?? ""
    );
  }

  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO menuitems ${cols} VALUES ${placeholders};`,
          params
        );
      },
      reject,
      resolve
    );
  });
}

/**
 * SQL filter: AND-combine query (LIKE on name) with selected categories.
 * Debounce is handled in UI; this function just runs the query.  :contentReference[oaicite:3]{index=3}
 */
export async function filterByQueryAndCategories(query, activeCategories) {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      let sql = "SELECT * FROM menuitems";
      const where = [];
      const params = [];

      const q = (query ?? "").trim().toLowerCase();
      if (q.length > 0) {
        where.push("LOWER(name) LIKE ?");
        params.push(`%${q}%`);
      }

      const cats = Array.isArray(activeCategories)
        ? activeCategories.filter((c) => typeof c === "string" && c.length > 0)
        : [];
      if (cats.length > 0) {
        const ph = cats.map(() => "?").join(", ");
        where.push(`category IN (${ph})`);
        params.push(...cats);
      }

      if (where.length > 0) {
        sql += ` WHERE ${where.join(" AND ")}`;
      }
      sql += " ORDER BY category, name;";

      tx.executeSql(
        sql,
        params,
        (_tx, { rows }) => resolve(rows._array),
        (_tx, err) => {
          reject(err);
          return true;
        }
      );
    });
  });
}
