# A web app that allows users to keep track of the shows and movies that they've watched.

## Import shows data ##
### PSQL ###
1. Create shows table specified in app.js (Drop and recreate if it already exists)
2. Enter psql client
3. Execute `\copy shows FROM 'shows.csv' DELIMITER ',' CSV; SELECT setval('shows_id_seq', max(id))
FROM shows;`

### mongodb ### 
1. Execute `mongoimport -d team_name_here -c shows --type CSV --fields=extraid,title,genre,studio,synopsis,episodes,year,runtime,type --file shows.csv`
