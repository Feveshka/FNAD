# Как получить APK и установщик для ПК

Проще всего — через GitHub (ничего ставить не нужно):
1. Создай репозиторий на github.com и загрузи в него содержимое этой папки (папка `.github` обязательна).
2. Вкладка **Actions → Build APK and Windows installer → Run workflow**.
3. Через ~10 минут внизу страницы запуска появятся файлы: `dibil-daddy-apk` (app-debug.apk) и `dibil-daddy-windows` (.exe).
4. APK перекинь на телефон и установи (разреши «установку из неизвестных источников»).

Без GitHub:
- **ПК (Windows):** `npm install`, затем `npm run electron:win` → установщик в папке `release/`.
- **Android:** `npm install`, `npm run build:web`, `npx cap add android`, `npx cap sync android`, затем собрать в Android Studio (или `cd android && ./gradlew assembleDebug`). Нужны Android Studio и Java 21.
- **Без сборки:** выложи папку `dist` (после `npm run build`) на любой хостинг (Netlify, GitHub Pages). Открой сайт на телефоне или в Chrome/Edge на ПК и выбери «Установить приложение» / «Добавить на главный экран».
