import db from "./database";

export const initDatabase = async () => {
  try {
    await db.executeAsync(`
      CREATE TABLE IF NOT EXISTS downloads (
        id TEXT PRIMARY KEY,
        title TEXT,
        artist TEXT,
        album TEXT,
        image TEXT,
        path TEXT,
        extension TEXT,
        downloadedAt INTEGER
      );
    `);

    console.log("Downloads table created");
  } catch (e) {
    console.log("Create table error:", e);
  }
};

export const saveDownload = async song => {
  try {
    await db.executeAsync(
      `INSERT OR REPLACE INTO downloads
      (
        id,
        title,
        artist,
        album,
        image,
        path,
        extension,
        downloadedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        song.id,
        song.title,
        song.artist,
        song.album,
        song.image,
        song.path,
        song.extension,
        song.downloadedAt,
      ]
    );

    console.log("Song saved");
  } catch (e) {
    console.log("Save error:", e);
  }
};

export const getDownloads = async () => {
  try {
    const result = await db.executeAsync(
      "SELECT * FROM downloads ORDER BY downloadedAt DESC"
    );

    return result.rows ?? [];
  } catch (e) {
    console.log(e);
    return [];
  }
};

export const deleteDownload = async id => {
  try {
    await db.executeAsync(
      "DELETE FROM downloads WHERE id=?",
      [id]
    );
  } catch (e) {
    console.log(e);
  }
};