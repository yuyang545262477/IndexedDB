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
        var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB || false,
            IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.mozIDBKeyRange || window.msIDBKeyRange || false,
            webSQLSupport = ('openDatabase' in window);

        //初始化数据库
        var db;

        var openDB = function () {
            // 如果支持indexedDB
            if (indexedDB) {
                var request = indexedDB.open('tasks', 1),
                    upgradeNeeded = ('onupgradeneeded' in request);
                //第一次打开数据库会调用onupgradeneeded函数。
                request.onsuccess = function (e) {//数据库成功打开调用的函数
                    db = e.target.result;
                    if (!upgradeNeeded && db.version != '1') {
                        //如果是旧版本的IndexedDB
                        //有一些旧的浏览器，支持IndexedDB 但是支持的是旧版本的IndexedDB
                        //在旧版本中，并不支持onupgradeneeded更新数据库版本信息
                        var setVersionRequest = db.setVersion('1');
                        //使用旧的aip:setversion 把数据库版本号设为1
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
                    //如果浏览器的IndexedDB版本支持onupgradeneeded。
                    //如果请求时输入的数据库版本号，高于浏览器当中的版本号，触发upgradeNeeded
                    //在upgrade need 事件期间，你有机会通过添加或移除{store,键,索引}来操作object store
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
        openDB();
        //创建动态列表 5-11
        var createEmptyItem = function (query, taskList) {
            var emptyItem = document.createElement('li');
            if (query.length > 0) {
                emptyItem.innerHTML = '<div class = "item_title">' + 'No tasks match your query <strong>' + query + '</strong>' + '</div>';
            } else {
                emptyItem.innerHTML = '<div class = "item_title">' + 'No tasks to display.<a href="#add">Add one</a>?' + '</div>';
            }
            taskList.appendChild(emptyItem);
        };
        var showTask = function (task, list) {
            var newItem = document.createElement('li'),
                checked = (task.complete == 1) ? 'checked ="checked"' : '';

            newItem.innerHTML =
            //div.item_complete
            '<div class="item_complete">' +
            '<input type="checkbox" name="item_complete"' +
            'id = "chk_' + task.id +
            ' " ' + checked + '>' + '</div>' +
            //div.item_delete
            '<div class = "item_delete">' + '<a href+"#" id = "del_' + task.id + '">Delete</a>' + '</div>' +
            //div.item_title
            '<div class = "item_title">' + task.desc + '</div>' +
            //div.item_due
            '<div class = "item_due">' + task.due + '<div>';
            list.appendChild(newItem);

            var markAsComplete = function (e) {
                e.preventDefault();
                var updatedTask = {
                    id: task.id,
                    desc: task.desc,
                    descUpper: task.desc.toUpperCase(),
                    due: task.due,
                    complete: e.traget.checked
                };
                updateTask(updatedTask);//之后讲到updateTask方法。
            };

            var remove = function (e) {
                e.preventDefault();
                if (confirm('Deleting task. Are you sure?', 'Delete')) {
                    deleteTask(task.id);
                }
            };

            document.getElementById('chk_' + task.id).onchange = markAsComplete;
            document.getElementById('del_' + task.id).onclick = remove;
        };

        //实现数据库的搜索
        var loadTasks = function (q) {
            var taskList = document.getElementById('task_list'),
                query = q || '';
            taskList.innerHTML = '';

            if (indexedDB) {
                //建立数据事务
                var tx = db.transaction(['tasks'], 'readonly'),
                    objectStore = tx.objectStore('tasks'),
                    cursor,
                    i = 0;

                if (query.length > 0) {
                    var index = objectStore.index('desc'),
                        upperQ = query.toUpperCase(),
                        keyRange = IDBKeyRange.bound(upperQ, upperQ + 'z');
                    cursor = index.openCursor(keyRange);
                } else {
                    cursor = objectStore.openCursor();
                }

                cursor.onsuccess = function (e) {
                    var result = e.target.result;
                    if (result === null) return;
                    i++;
                    showTask(result.value, taskList);
                    result['continue']();
                };

                tx.concomplete = function (e) {
                    if (i === 0) { createEmptyItem(query, taskList); }
                };
            } else {
                alert("your brower is not support IndexedDB");
            }
        };
        //新建searchTasks
        var searchTasks = function (e) {
            e.preventDefault();
            var query = document.forms.search.query.value;
            if (query.length > 0) {
                loadTasks(query);
            } else {
                loadTasks();
            }
        };
        //添加提交后的searchTasks事件绑定.
        document.forms.search.addEventListener('submit', searchTasks, false);

        //新建 insertTasks
        var insertTasks = function (e) {
            e.preventDefault();
            var desc = document.forms.add.desc.value,
                dueDate = document.forms.add.due_date.value;
            if (desc.length > 0 && dueDate.length > 0) {
                var task = {
                    id: new Date().getTime(),
                    desc: desc,
                    descUpper: desc.toUpperCase,
                    due: dueDate,
                    complete: false
                };

                if (indexedDB) {
                    var tx = db.transaction(['task'], 'readwrite');
                    var objectStore = tx.objectStore('tasks');
                    var request = objectStore.add(task);
                    tx.concomplete = updateView;
                } else {
                    alert('insertTasks not support');
                }

            } else {
                alert('please fill out all fields', 'Add task error');
            }
        };
        function updateView() {
            loadTasks();
            alert('Task added successfully', 'Task added');
            document.forms.add.desc.value = '';
            document.forms.add.due_date.value = '';
            location.hash = '#list';
        }
        document.forms.add.addEventListener('submit', insertTasks, false);
        //新建updateTasks
        var updatedTask = function (task) {
            //从这里开始忽略indexedDB是否支持的判断
            var tx = db.transaction(['tasks'], 'readwrite'),
                objectStore = tx.objectStore('tasks'),
                request = objectStore.put(task);
            //怀疑此处少代码.

        };
        //新建deleteTask
        var deleteTask = function (id) {
            var tx = db.transaction(['tasks'], 'readwrite'),
                objectStore = tx.objectStore('tasks'),
                request = objectStore['delete'](id);
            tx.concomplete = loadTasks;
        };
        //新建dropDatabase
        var dropDatabase = function () {
            var delDBRequest = indexedDB.deleteDatabase('tasks');
            delDBRequest.onsuccess = window.location.reload();
        };

    };
    window.addEventListener('load', function () {
        new Tasks();
    }, false);
})();

