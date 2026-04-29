import bcrypt
h1 = bcrypt.hashpw(b'comercial123', bcrypt.gensalt(12)).decode()
h2 = bcrypt.hashpw(b'marketing123', bcrypt.gensalt(12)).decode()
sql = "UPDATE usuarios SET password_hash = '" + h1 + "' WHERE email = 'comercial@csjd.com';"
sql += "UPDATE usuarios SET password_hash = '" + h2 + "' WHERE email = 'marketing@csjd.com';"
open('/tmp/u.sql', 'w').write(sql)
print('OK:', h1)
