(function () {
    var Tasks = function () {
        var nudge = function () {
            setTimeout(function () { window.scrollTo(0, 0); }, 1000);
        };
        var jump = function () {
            switch (location.hash) {
                case '#add':
                    document.body.className = 'add';
                    break;
                case '#settings':
                    document.body.className = 'settings';
                    break;
                default:
                    document.body.className = 'list';
            }
            nudge();
        };
        jump();
        window.addEventListener('hashchange', jump, false);
        window.addEventListener('orientationchange', nudge, false);
        //读取.
        var localStorageAvailable = ('localStorage' in window);
        var loadsetttings = function () {
            if (localStorageAvailable) {
                var name = localStorage.getItem('name'),
                    colorScheme = localStorage.getItem('colorScheme'),
                    nameDisplay = document.getElementById('user_name'),
                    nameField = document.forms.settings.name,
                    doc = document.documentElement,
                    colorSchemeField = document.forms.settings.color_scheme;

                if (name) {
                    nameDisplay.innerHTML = name + "'s";
                    nameField.value = name;
                } else {
                    nameDisplay.innerHTML = 'My';
                    nameField.value = '';
                }


                if (colorScheme) {
                    doc.className = colorScheme.toLowerCase();
                    colorSchemeField.value = colorScheme;
                } else {
                    doc.className = 'blue';
                    colorSchemeField.value = 'Blue';
                }
            }
        };
        //保存
        var saveSettings = function (e) {
            e.preventDefault();
            if (localStorageAvailable) {
                var name = document.forms.settings.name.value;
                if (name.length > 0) {
                    var colorScheme = document.forms.settings.color_scheme.value;

                    localStorage.setItem('name', name);
                    localStorage.setItem('colorScheme', colorScheme);
                    loadsetttings();
                    alert('settings saved successfully', 'settings saved');
                    location.hash = '#list';
                } else {
                    alert('Please Enter Your Name');
                }
            } else {
                alert('You Brower is not support localStorage');
            }
        };
        //删除
        var resetSettings = function (e) {
            e.preventDefault();
            if (confirm('This Will erase all data. Are you sure?', 'Reset data')) {
                if (localStorageAvailable) {
                    localStorage.clear();
                }
                loadsetttings();
                alert('Application data has been reset', 'Reset successful');
                location.hash = '#list';
            }
        };
        //绑定
        loadsetttings();
        document.forms.settings.addEventListener('submit', saveSettings, false);
        document.forms.settings.addEventListener('reset', resetSettings, false);
        //开始使用indexedDB数据库 来完善 list 和 add <section>里的内容
        //鉴定
        var indexDB = window.indexDB || window.webkitIndexDB || window.mozIndexDB || window.msIndexDB || false,
            IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.mozIDBKeyRange || window.msIDBKeyRange || false,
            webSQLSupport = ('openDatabase' in window);
        //舒适化数据库
        var db;

        var openDB = function () {
            // 如果支持indexDB
            if (indexDB) {
                var request = indexDB.open('tasks', 1),
                    upgradeNeeded = ('onupgradeneeded' in request);
                //第一次打开数据库会调用onupgradeneeded函数。
                request.onsuccess = function (e) {//数据库成功打开调用的函数
                    db = e.target.result;
                    if (!upgradeNeeded && db.version != '1') {
                        //如果数据库不是首次打开
                        var setVersionRequest = db.setVersion('1');//把数据库版本号设为1
                        setVersionRequest.onsuccess = function (e) {
                            var objectStore = db.createObjectStore('tasks', { Keypath: 'id' });
                            objectStore.createIndex('desc', 'descUpper', { unique: false });
                            loadTasks();//在后面构造
                        };
                    } else {
                        loadTasks();
                    }
                };
                if (upgradeNeeded) {
                    //如果是第一次打开数据库
                    request.onupgradeneeded = function (e) {
                        db = e.target.result;
                        var objectStore = db.createObjectStore('tasks', { Keypath: 'id' });
                        objectStore.createIndex('desc', 'descUpper', { unique: false });
                    };
                }
                //如果浏览器不支持indexedDB 可以采用webSQL的回退方案
            } else if (webSQLSupport) {
                db = openDatabase('tasks', '1.0', 'Tasks database', (5 * 1024 * 1024));
                db = transaction(function (tx) {
                    var sql = 'CREATE TABLE IF NOT EXISTS tasks(' +
                        'id INTEGER PRIMARY KEY ASC,' +
                        'desc TEXT,' +
                        'due DATATIME' +
                        'complete BOOLEAN' + ')';
                    tx.executeSql(sql, [], loadTasks);
                });

            }
        };
        open();


    };
    window.addEventListener('load', function () {
        new Tasks();
    }, false);
})();

