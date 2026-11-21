# Выдвижение кандидатов на пост Хокаге — комплект сайта

## Что внутри
- `index.html`, `style.css`, `app.js` — сайт в стиле свитка для подачи заявки кандидата (Ник, SteamID, Ранг, Предвыборная речь).
- `config.js` — настройки подключения к Supabase.
- `database.sql` — SQL для создания таблиц и правил доступа.

## 1. Настрой базу Supabase
1. Открой проект на https://supabase.com/
2. Перейди в SQL Editor → New query.
3. Скопируй весь текст из `database.sql` и выполни его.

## 2. Опубликуй на GitHub Pages
1. Загрузи в корень репозитория файлы: `index.html`, `style.css`, `app.js`, `config.js`, `database.sql`.
2. Открой Settings → Pages, выбери ветку `main` и папку `/ (root)`.

## 3. Где смотреть поданные заявки
В Supabase → SQL Editor выполни:

```sql
select nickname, steam_id, rank, speech, created_at
from public.candidates
order by created_at asc;
```

## 4. Как закрыть или открыть приём заявок
Закрыть:
```sql
update public.nomination_settings set nominations_open = false where id = true;
```

Открыть снова:
```sql
update public.nomination_settings set nominations_open = true where id = true;
```
