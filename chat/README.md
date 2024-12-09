```
npm install
npm run dev
```

```
npm run deploy
```
about db 
``` shell
wrangler d1 create db
wrangler d1 execute db --local  --file=./schema.sql
wrangler d1 execute db   --file=./schema.sql --remote
npx wrangler d1 execute db --local --command="SELECT * FROM threads"
npx wrangler d1 db --remote --command="SELECT * FROM threads"
```