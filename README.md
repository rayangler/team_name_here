# A web app that allows users to keep track of the shows and movies that they've watched.

## Import shows data ##
1. Create shows table specified in app.js (Drop and recreate if it already exists)
2. Enter psql client
3. Execute `\copy shows FROM 'shows.csv' DELIMITER ',' CSV; SELECT setval('shows_id_seq', max(id))
FROM shows;`

