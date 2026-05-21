const stream = require('stream');

exports.streamCursorAsCSV = async (res, cursor, keys, transform = (d) => d) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');

  // Write header
  res.write(keys.join(',') + '\n');

  try {
    for await (const doc of cursor) {
      const rowObj = transform(doc);
      const line = keys.map((k) => {
        const v = rowObj[k] ?? '';
        const s = typeof v === 'string' ? v : (v === null || v === undefined ? '' : v.toString());
        return '"' + s.replace(/"/g, '""') + '"';
      }).join(',');
      if (!res.write(line + '\n')) {
        await new Promise((resolve) => res.once('drain', resolve));
      }
    }
    res.end();
  } catch (err) {
    res.destroy(err);
  }
};
