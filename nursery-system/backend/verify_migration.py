import sqlite3

conn = sqlite3.connect('nursery.db')
cur = conn.cursor()

# Check governorates
cur.execute('SELECT COUNT(*) FROM governorates')
print(f'Governorates count: {cur.fetchone()[0]}')

cur.execute('SELECT name_en, name_ar FROM governorates LIMIT 3')
print('\nSample governorates:')
for row in cur.fetchall():
    print(f'  {row[0]} - {row[1]}')

# Check if governorate_id column was added to nurseries
cur.execute("PRAGMA table_info(nurseries)")
columns = cur.fetchall()
has_governorate_id = any(col[1] == 'governorate_id' for col in columns)
print(f'\nNurseries table has governorate_id column: {has_governorate_id}')

conn.close()
print('\n✓ Migration verification complete')
