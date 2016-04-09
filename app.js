'use strict';

// Подключаем необходимые модули
const Http = require('http');
const Path = require('path');
const Yaml = require('yamljs');
const Express = require('express');
const Logger = require('morgan');
// Создаем Express приложение
const app = Express();
// Загружаем конфигурационный файл
const config = Yaml.load(Path.join(__dirname, 'src/config.yml'));
// Устанавливаем шаблонизатор Jade
app.set('view engine', 'jade');
// Указываем где располагаются шаблоны
app.set('views', './src/views');
// Подключаем логер http запросов
app.use(Logger('dev'));
// Указываем public директорию, где будут храниться статические файлы
app.use(Express.static(__dirname + '/public'));

// Эта функция будет рендерить шаблон передавая в него аргументы
function response (res, template, locals) {
    locals = Object.assign({}, config.scope, locals || {});
    res.render(template, locals);
}
// Настраиваем маршрутизацию из конфигурационного файла
Object.keys(config.routes).forEach( routeName => {
    let route = config.routes[routeName];
    let controller = require(Path.join(__dirname, 'src/controllers', route.controller));
    let method = (route.method || 'get').toUpperCase();
    // Проверяем валидность HTTP метода
    if (~Http.METHODS.indexOf(method)) {
        // Привязываем контроллер к маршруту
        app[method.toLowerCase()](route.path, (req, res, next) => {
            try {
                // передаем переменую запроса, функцию рендеринга и функцию пропуска в контроллер
                controller(req, response.bind(null, res, route.view || route.controller), next);
            } catch(e) {
                next(e);
            }
        });
    }
});
// Слушаем указаный порт или порт по-умолчанию
app.listen(process.env.PORT || 3000, function () {
    console.log('Listening on http://localhost:' + (process.env.PORT || 3000))
});
