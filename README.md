# ПРОТОТИП CLAUDE — лендинг КАПСЛУК (черновик)

Это **собранная статика** прототипа лендинга Telegram-бота КАПСЛУК, подготовленного Claude.
Не боевой сайт: стоит `noindex`, заглушки подсвечены жёлтым. Параллельно делается вариант в Codex.

Исходники лежат в приватном репозитории `kapsula-replit`, ветка `claude/landing-prototype`,
папка `prototypes/landing-claude`. Здесь только результат сборки, редактировать его не нужно.

Обновление: в исходниках выполнить
`SITE_URL=https://rubigotrafikcash-gif.github.io BASE_PATH=/-kapsluk-landing-draft/ npm run build`
и заменить файлы здесь содержимым `dist/`.

Публикация: Settings → Pages → Source «Deploy from a branch», ветка `main`, папка `/ (root)`.
Файл `.nojekyll` нужен, чтобы GitHub отдавал папку `_astro`.
