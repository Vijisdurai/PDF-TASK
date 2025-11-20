import sqlite3

conn = sqlite3.connect('backend/annotations.db')
cursor = conn.cursor()

cursor.execute('SELECT id, filename, original_filename FROM documents LIMIT 5')
rows = cursor.fetchall()

print('ID | Filename | Original Filename')
print('-' * 100)

for row in rows:
    doc_id = row[0][:36] if row[0] else 'NULL'
    filename = row[1][:40] if row[1] else 'NULL'
    original = row[2] if row[2] else 'NULL'
    print(f'{doc_id} | {filename} | {original}')

conn.close()