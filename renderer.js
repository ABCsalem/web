// ================================================================
// renderer.js - نسخة تعتمد على ملف users.json من رابط مباشر (GitHub)
// مع إضافة جميع حالات الموظفين في القائمة المنسدلة
// ================================================================
document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // 0. إلغاء Service Worker و Manifest (لكننا لن نلغيها لأننا نريد PWA)
    // ============================================================
    // تم إزالة جزء إلغاء Service Worker لأننا نريده يعمل
    // لكننا نترك التعليق فقط

    // ============================================================
    // 1. رابط ملف users.json (رابطك المباشر)
    // ============================================================
    const USERS_JSON_URL = 'https://raw.githubusercontent.com/ABCsalem/web/main/users.json';

    // ============================================================
    // 2. جلب المستخدمين من الرابط المباشر
    // ============================================================
    let cachedUsers = null;

    async function getUsers() {
        if (cachedUsers) return cachedUsers;
        try {
            console.log('📡 جاري جلب المستخدمين من:', USERS_JSON_URL);
            const res = await fetch(USERS_JSON_URL);
            if (!res.ok) {
                throw new Error('فشل تحميل الملف: ' + res.status);
            }
            const data = await res.json();
            cachedUsers = data;
            console.log('✅ تم جلب المستخدمين:', data);
            return data;
        } catch (e) {
            console.error('❌ خطأ في جلب المستخدمين:', e);
            // في حال فشل التحميل، نستخدم بيانات افتراضية للتجربة
            const fallback = {
                admin: { password: 'admin123', isAdmin: true, quotas: { officers: 20, soldiers: 50, employees: 10 } },
                الاتصالات: { password: '1234566', isAdmin: false, quotas: { officers: 10, soldiers: 25, employees: 5 } },
                الطيران: { password: '123654', isAdmin: false, quotas: { officers: 8, soldiers: 20, employees: 4 } }
            };
            cachedUsers = fallback;
            return fallback;
        }
    }

    // ============================================================
    // 3. عناصر الواجهة الأساسية
    // ============================================================
    const loginScreen = document.getElementById('login-screen');
    const mainContent = document.getElementById('main-content');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const userDisplay = document.getElementById('user-display');

    // زر إدارة المستخدمين لن يظهر (لأننا لا نستطيع تعديل users.json عبر المتصفح)
    const manageUsersBtn = document.getElementById('manage-users-btn');
    if (manageUsersBtn) manageUsersBtn.style.display = 'none';

    let currentUser = null;
    let currentQuotas = null;
    let isAdmin = false;

    // ============================================================
    // 4. تسجيل الدخول (يعتمد على getUsers)
    // ============================================================
    async function handleLogin() {
        const username = loginUsername.value.trim();
        const password = loginPassword.value.trim();
        if (!username || !password) {
            loginError.textContent = 'الرجاء إدخال اسم المستخدم وكلمة المرور';
            loginError.style.display = 'block';
            return;
        }

        try {
            const users = await getUsers();
            const user = users[username];
            if (user && user.password === password) {
                currentUser = username;
                currentQuotas = user.quotas || { officers: 0, soldiers: 0, employees: 0 };
                isAdmin = user.isAdmin || false;
                sessionStorage.setItem('loggedIn', 'true');
                sessionStorage.setItem('username', username);
                sessionStorage.setItem('isAdmin', JSON.stringify(isAdmin));
                sessionStorage.setItem('quotas', JSON.stringify(currentQuotas));
                loginError.style.display = 'none';
                showMainContent();
            } else {
                loginError.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
                loginError.style.display = 'block';
                loginPassword.value = '';
                loginPassword.focus();
            }
        } catch (e) {
            loginError.textContent = 'خطأ في الاتصال بالخادم: ' + e.message;
            loginError.style.display = 'block';
            console.error(e);
        }
    }

    function checkLogin() {
        const logged = sessionStorage.getItem('loggedIn');
        if (logged === 'true') {
            currentUser = sessionStorage.getItem('username');
            isAdmin = JSON.parse(sessionStorage.getItem('isAdmin') || 'false');
            currentQuotas = JSON.parse(sessionStorage.getItem('quotas') || '{"officers":0,"soldiers":0,"employees":0}');
            showMainContent();
        } else {
            showLoginScreen();
        }
    }

    function showLoginScreen() {
        loginScreen.style.display = 'flex';
        mainContent.style.display = 'none';
        loginError.style.display = 'none';
        loginUsername.value = '';
        loginPassword.value = '';
        loginUsername.focus();
    }

    function showMainContent() {
        loginScreen.style.display = 'none';
        mainContent.style.display = 'block';
        userDisplay.textContent = 'مرحباً بك في نظام ' + currentUser;
        initApp();
    }

    function handleLogout() {
        sessionStorage.removeItem('loggedIn');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('isAdmin');
        sessionStorage.removeItem('quotas');
        currentUser = null;
        currentQuotas = null;
        isAdmin = false;
        location.reload();
    }

    loginBtn.addEventListener('click', handleLogin);
    loginPassword.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    loginUsername.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') loginPassword.focus();
    });
    logoutBtn.addEventListener('click', handleLogout);

    // ============================================================
    // 5. تطبيق الملاكات على حقول الملاك
    // ============================================================
    function applyQuotas(quotas) {
        const officersInput = document.querySelector('#row-officers .quota-input');
        const soldiersInput = document.querySelector('#row-soldiers .quota-input');
        const employeesInput = document.querySelector('#row-employees .quota-input');
        if (officersInput) officersInput.value = quotas.officers || 0;
        if (soldiersInput) soldiersInput.value = quotas.soldiers || 0;
        if (employeesInput) employeesInput.value = quotas.employees || 0;
        [officersInput, soldiersInput, employeesInput].forEach(input => {
            if (input) { input.readOnly = true; input.style.backgroundColor = '#f0f0f0'; input.style.cursor = 'not-allowed'; }
        });
    }

    // ============================================================
    // 6. منطق التطبيق الأساسي (الجداول، الإحصائيات، التصدير) - كامل
    // ============================================================
    function initApp() {
        const personnelTbody = document.querySelector('#personnel-table tbody');
        const exportBtn = document.getElementById('export-btn');
        const addBtn = document.getElementById('add-person-btn');
        const addVacantBtn = document.getElementById('add-vacant-btn');
        const unitSelect = document.getElementById('unit-select');
        const personnelSection = document.getElementById('personnel-section');
        const officerStats = document.querySelectorAll('.officer-stat');

        const modal = document.getElementById('add-modal');
        const newName = document.getElementById('new-name');
        const newPoint = document.getElementById('new-point');
        const newJob = document.getElementById('new-job');
        const modalCancel = document.getElementById('modal-cancel');
        const modalSave = document.getElementById('modal-save');

        const vacantModal = document.getElementById('add-vacant-modal');
        const vacantPoint = document.getElementById('vacant-point');
        const vacantJob = document.getElementById('vacant-job');
        const vacantCancel = document.getElementById('vacant-modal-cancel');
        const vacantSave = document.getElementById('vacant-modal-save');

        const exportModal = document.getElementById('export-modal');
        const exportFilename = document.getElementById('export-filename');
        const exportDate = document.getElementById('export-date');
        const exportModalCancel = document.getElementById('export-modal-cancel');
        const exportModalConfirm = document.getElementById('export-modal-confirm');

        const today = new Date().toISOString().split('T')[0];
        exportDate.value = today;

        const defaultData = [
            { name: 'سالم صلاح سالم', point: 'قيادة الفرقة', job: 'ضابط امن سيبراني', status: 'حاضر' },
            { name: 'سالم صلاح سالم', point: 'اللواء 34', job: 'ضابط امن سيبراني', status: 'حاضر' },
            { name: 'سالم صلاح سالم', point: 'اللواء 33', job: 'ضابط امن سيبراني', status: 'دورة' }
        ];
        let personnelData = [];
        let currentUnit = 'عام';

        // تطبيق الملاكات من الجلسة
        if (currentQuotas) applyQuotas(currentQuotas);

        // ---- تبديل الوحدة ----
        function toggleUnitMode(unit) {
            currentUnit = unit;
            const isGeneral = unit === 'عام';
            personnelSection.style.display = isGeneral ? 'block' : 'none';
            officerStats.forEach(span => {
                const parent = span.parentElement;
                const input = parent.querySelector('.officer-input');
                if (isGeneral) {
                    if (input) input.remove();
                    span.style.display = 'inline';
                } else {
                    span.style.display = 'none';
                    let inp = parent.querySelector('.officer-input');
                    if (!inp) {
                        inp = document.createElement('input');
                        inp.type = 'number';
                        inp.className = 'stat-input officer-input';
                        inp.value = span.textContent || '0';
                        inp.min = '0';
                        parent.appendChild(inp);
                    }
                }
            });
            updateStats();
        }
        unitSelect.addEventListener('change', function() { toggleUnitMode(this.value); });

        // ---- حفظ وتحميل بيانات الموظفين (في localStorage) ----
        function saveData() {
            try { localStorage.setItem('saryaData', JSON.stringify(personnelData)); } catch (e) {}
        }
        function loadData() {
            const saved = localStorage.getItem('saryaData');
            if (saved) {
                try {
                    personnelData = JSON.parse(saved);
                    if (!Array.isArray(personnelData) || personnelData.length === 0) throw new Error();
                } catch (e) {
                    personnelData = JSON.parse(JSON.stringify(defaultData));
                    localStorage.removeItem('saryaData');
                }
            } else {
                personnelData = JSON.parse(JSON.stringify(defaultData));
            }
            renderTable();
            updateStats();
        }

        // ---- عرض الجدول (تمت إضافة جميع الحالات إلى القائمة) ----
        function renderTable() {
            personnelTbody.innerHTML = '';
            personnelData.forEach((item, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${idx + 1}</td>
                    <td><input type="text" class="p-input" value="${item.name}"></td>
                    <td><input type="text" class="p-input" value="${item.point}"></td>
                    <td><input type="text" class="p-input" value="${item.job}"></td>
                    <td>
                        <select>
                            <option value="حاضر" ${item.status==='حاضر'?'selected':''}>حاضر</option>
                            <option value="إجازة" ${item.status==='إجازة'?'selected':''}>إجازة</option>
                            <option value="مهمة" ${item.status==='مهمة'?'selected':''}>مهمة</option>
                            <option value="دورة" ${item.status==='دورة'?'selected':''}>دورة</option>
                            <option value="مرافق" ${item.status==='مرافق'?'selected':''}>مرافق</option>
                            <option value="مستشفى" ${item.status==='مستشفى'?'selected':''}>مستشفى</option>
                            <option value="مكلف" ${item.status==='مكلف'?'selected':''}>مكلف</option>
                            <option value="مستاذن" ${item.status==='مستاذن'?'selected':''}>مستاذن</option>
                            <option value="غياب" ${item.status==='غياب'?'selected':''}>غياب</option>
                            <option value="سجن" ${item.status==='سجن'?'selected':''}>سجن</option>
                            <option value="متأخر" ${item.status==='متأخر'?'selected':''}>متأخر</option>
                            <option value="الاسرى" ${item.status==='الاسرى'?'selected':''}>الاسرى</option>
                            <option value="شهداء" ${item.status==='شهداء'?'selected':''}>شهداء</option>
                            <option value="جرحى" ${item.status==='جرحى'?'selected':''}>جرحى</option>
                            <option value="الإعاقة الدائمة" ${item.status==='الإعاقة الدائمة'?'selected':''}>الإعاقة الدائمة</option>
                            <option value="هروب" ${item.status==='هروب'?'selected':''}>هروب</option>
                            <option value="شاغر" ${item.status==='شاغر'?'selected':''}>شاغر</option>
                        </select>
                    </td>
                    <td><button class="btn-del" data-idx="${idx}">حذف</button></td>
                `;
                personnelTbody.appendChild(tr);

                const inputs = tr.querySelectorAll('.p-input');
                const status = tr.querySelector('select');
                const delBtn = tr.querySelector('.btn-del');

                inputs[0].oninput = (e) => { personnelData[idx].name = e.target.value; saveData(); };
                inputs[1].oninput = (e) => { personnelData[idx].point = e.target.value; saveData(); };
                inputs[2].oninput = (e) => { personnelData[idx].job = e.target.value; saveData(); };
                status.onchange = (e) => {
                    personnelData[idx].status = e.target.value;
                    saveData();
                    updateStats();
                };
                delBtn.onclick = () => {
                    if (confirm('حذف الموظف؟')) {
                        personnelData.splice(idx, 1);
                        renderTable();
                        updateStats();
                        saveData();
                    }
                };
            });
        }

        // ---- إضافة موظف ----
        function openModal() { newName.value = ''; newPoint.value = ''; newJob.value = ''; modal.style.display = 'flex'; setTimeout(() => newName.focus(), 100); }
        function closeModal() { modal.style.display = 'none'; }
        addBtn.onclick = openModal;
        modalCancel.onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        modalSave.onclick = () => {
            const name = newName.value.trim();
            if (!name) { alert('أدخل الاسم'); return; }
            personnelData.push({ name, point: newPoint.value.trim(), job: newJob.value.trim(), status: 'حاضر' });
            closeModal();
            renderTable();
            updateStats();
            saveData();
        };

        // ---- إضافة شاغر ----
        function openVacantModal() { vacantPoint.value = ''; vacantJob.value = ''; vacantModal.style.display = 'flex'; setTimeout(() => vacantPoint.focus(), 100); }
        function closeVacantModal() { vacantModal.style.display = 'none'; }
        addVacantBtn.onclick = openVacantModal;
        vacantCancel.onclick = closeVacantModal;
        vacantModal.onclick = (e) => { if (e.target === vacantModal) closeVacantModal(); };
        vacantSave.onclick = () => {
            personnelData.push({ name: '', point: vacantPoint.value.trim(), job: vacantJob.value.trim(), status: 'شاغر' });
            closeVacantModal();
            renderTable();
            updateStats();
            saveData();
        };

        // ---- تحديث الإحصائيات (تستثني حالة "شاغر" تلقائياً) ----
        function updateStats() {
            try {
                const isGeneral = currentUnit === 'عام';
                if (isGeneral) {
                    const stats = {
                        'حاضر': 0, 'إجازة': 0, 'مستشفى': 0, 'مهمة': 0, 'مكلف': 0, 'مستاذن': 0,
                        'دورة': 0, 'مرافق': 0, 'متأخر': 0, 'غياب': 0, 'سجن': 0, 'الاسرى': 0,
                        'شهداء': 0, 'جرحى': 0, 'الإعاقة الدائمة': 0, 'هروب': 0
                    };
                    personnelData.forEach(p => {
                        if (p.status && p.status !== 'شاغر' && stats[p.status] !== undefined) {
                            stats[p.status]++;
                        }
                    });
                    const map = ['حاضر', 0, 'إجازة', 'مستشفى', 'مهمة', 'مكلف', 'مستاذن', 'دورة', 'مرافق', 'متأخر', 'غياب', 'سجن', 'الاسرى', 'شهداء', 'جرحى', 'الإعاقة الدائمة', 'هروب'];
                    const rowOfficers = document.getElementById('row-officers');
                    if (rowOfficers) {
                        const spans = rowOfficers.querySelectorAll('.stat-val:not(.officer-input)');
                        spans.forEach((span, i) => {
                            let key = map[i];
                            span.textContent = key === 0 ? '0' : (stats[key] || 0);
                        });
                    }
                }
            } catch (e) { console.warn('خطأ في الإحصائيات:', e); }
        }

        // ---- التحقق من صحة البيانات قبل التصدير ----
        function validate() {
            let errors = [];
            try {
                const isGeneral = currentUnit === 'عام';
                let officerSum = 0, soldierSum = 0, employeeSum = 0;
                if (isGeneral) {
                    const officerStats = { 'حاضر': 0, 'إجازة': 0, 'مستشفى': 0, 'مهمة': 0, 'مكلف': 0, 'مستاذن': 0, 'دورة': 0, 'مرافق': 0, 'متأخر': 0, 'غياب': 0, 'سجن': 0, 'الاسرى': 0, 'شهداء': 0, 'جرحى': 0, 'الإعاقة الدائمة': 0, 'هروب': 0 };
                    personnelData.forEach(p => { if (p.status && p.status !== 'شاغر' && officerStats[p.status] !== undefined) officerStats[p.status]++; });
                    Object.values(officerStats).forEach(v => officerSum += v);
                    document.querySelectorAll('#row-soldiers .stat-input').forEach(inp => { soldierSum += parseInt(inp.value) || 0; });
                    document.querySelectorAll('#row-employees .stat-input').forEach(inp => { employeeSum += parseInt(inp.value) || 0; });
                } else {
                    document.querySelectorAll('.officer-input').forEach(inp => officerSum += parseInt(inp.value) || 0);
                    document.querySelectorAll('.soldier-stat').forEach(inp => soldierSum += parseInt(inp.value) || 0);
                    document.querySelectorAll('.employee-stat').forEach(inp => employeeSum += parseInt(inp.value) || 0);
                }
                document.querySelectorAll('#row-officers, #row-soldiers, #row-employees').forEach(row => {
                    const title = row.querySelector('.rank-title') ? row.querySelector('.rank-title').textContent : '';
                    const quota = parseInt(row.querySelector('.quota-input').value) || 0;
                    let sum = 0;
                    if (title.includes('ضباط')) sum = officerSum;
                    else if (title.includes('أفراد')) sum = soldierSum;
                    else if (title.includes('موظف')) sum = employeeSum;
                    if (sum !== quota) errors.push(`صف "${title}" غير متطابق! الملاك: ${quota}، المدخل: ${sum}`);
                });
            } catch (e) { errors.push('خطأ في التحقق'); }
            if (errors.length > 0) {
                alert('منع التصدير:\n' + errors.join('\n'));
                return false;
            }
            return true;
        }

        // ---- إنشاء ملف Excel ----
        async function generateExcelBlob() {
            const isGeneral = currentUnit === 'عام';
            let officerRow = [], soldiers = [], employees = [];
            const quotas = Array.from(document.querySelectorAll('#row-officers, #row-soldiers, #row-employees')).map(r => parseInt(r.querySelector('.quota-input').value) || 0);

            if (isGeneral) {
                const officerStats = { 'حاضر': 0, 'إجازة': 0, 'مستشفى': 0, 'مهمة': 0, 'مكلف': 0, 'مستاذن': 0, 'دورة': 0, 'مرافق': 0, 'متأخر': 0, 'غياب': 0, 'سجن': 0, 'الاسرى': 0, 'شهداء': 0, 'جرحى': 0, 'الإعاقة الدائمة': 0, 'هروب': 0 };
                personnelData.forEach(p => { if (p.status && p.status !== 'شاغر' && officerStats[p.status] !== undefined) officerStats[p.status]++; });
                officerRow = [officerStats['حاضر'] || 0, 0, officerStats['إجازة'] || 0, officerStats['مستشفى'] || 0, officerStats['مهمة'] || 0, officerStats['مكلف'] || 0, officerStats['مستاذن'] || 0, officerStats['دورة'] || 0, officerStats['مرافق'] || 0, officerStats['متأخر'] || 0, officerStats['غياب'] || 0, officerStats['سجن'] || 0, officerStats['الاسرى'] || 0, officerStats['شهداء'] || 0, officerStats['جرحى'] || 0, officerStats['الإعاقة الدائمة'] || 0, officerStats['هروب'] || 0];
                soldiers = Array.from(document.querySelectorAll('#row-soldiers .stat-input')).map(i => parseInt(i.value) || 0);
                employees = Array.from(document.querySelectorAll('#row-employees .stat-input')).map(i => parseInt(i.value) || 0);
            } else {
                officerRow = Array.from(document.querySelectorAll('.officer-input')).map(i => parseInt(i.value) || 0);
                soldiers = Array.from(document.querySelectorAll('.soldier-stat')).map(i => parseInt(i.value) || 0);
                employees = Array.from(document.querySelectorAll('.employee-stat')).map(i => parseInt(i.value) || 0);
            }

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('سرية القناصة');
            const headers = ['الرتبة', 'الملاك', 'في المعسكر', 'موقع دفاعي', 'إجازة', 'مستشفى', 'مهمة', 'مكلف', 'مستاذن', 'دورة', 'مرافقين', 'متأخر', 'غياب', 'سجن', 'الاسرى', 'شهداء', 'جرحى', 'الإعاقة الدائمة', 'الهروب', 'المجموع'];
            ws.addRow(headers).font = { bold: true };
            const titles = ['ضباط', 'أفراد مقاتلين', 'موظف'];
            titles.forEach((t, i) => {
                const r = ws.addRow([t, quotas[i], ...(i === 0 ? officerRow : (i === 1 ? soldiers : employees))]);
                r.getCell(20).value = { formula: `SUM(C${r.number}:S${r.number})` };
            });
            const total = ws.addRow(['الإجمالي']);
            for (let c = 2; c <= 19; c++) total.getCell(c).value = { formula: `SUM(${ws.getCell(2, c).address}:${ws.getCell(4, c).address})` };
            total.getCell(20).value = { formula: `SUM(C${total.number}:S${total.number})` };

            if (isGeneral) {
                ws.addRow(['م', 'الاسم', 'النقطة', 'الوظيفة', 'الحالة']);
                personnelData.forEach((p, i) => ws.addRow([i + 1, p.name, p.point, p.job, p.status]));
                const vacantData = personnelData.filter(p => p.status === 'شاغر');
                if (vacantData.length > 0) {
                    const wsVacant = wb.addWorksheet('الشواغر');
                    const titleRow = wsVacant.addRow(['قائمة الشواغر']);
                    wsVacant.mergeCells(`A${titleRow.number}:D${titleRow.number}`);
                    titleRow.font = { bold: true, size: 14 };
                    titleRow.alignment = { horizontal: 'center' };
                    const vacantHeaders = ['م', 'النقطة', 'الوظيفة', 'الحالة'];
                    const headerRow = wsVacant.addRow(vacantHeaders);
                    headerRow.font = { bold: true };
                    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
                    headerRow.alignment = { horizontal: 'center' };
                    vacantData.forEach((p, i) => {
                        const row = wsVacant.addRow([i + 1, p.point, p.job, p.status]);
                        row.alignment = { horizontal: 'center' };
                    });
                    wsVacant.getColumn(1).width = 8;
                    wsVacant.getColumn(2).width = 25;
                    wsVacant.getColumn(3).width = 25;
                    wsVacant.getColumn(4).width = 15;
                }
            }
            const buf = await wb.xlsx.writeBuffer();
            return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        }

        function downloadBlob(blob, filename) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }

        async function exportExcel(fileName, dateValue) {
            try {
                const blob = await generateExcelBlob();
                let finalName = fileName || 'تقرير_السرية';
                if (dateValue) finalName += '_' + dateValue;
                downloadBlob(blob, finalName + '.xlsx');
                alert('تم التصدير بنجاح!');
            } catch (e) {
                alert('خطأ في التصدير: ' + e.message);
            }
        }

        function openExportModal() {
            if (!validate()) return;
            exportDate.value = new Date().toISOString().split('T')[0];
            exportFilename.value = 'تقرير_السرية';
            exportModal.style.display = 'flex';
        }
        exportBtn.onclick = openExportModal;
        exportModalConfirm.onclick = () => {
            const fileName = exportFilename.value.trim() || 'تقرير_السرية';
            const dateValue = exportDate.value;
            exportModal.style.display = 'none';
            exportExcel(fileName, dateValue);
        };
        function closeExportModal() { exportModal.style.display = 'none'; }
        exportModalCancel.onclick = closeExportModal;
        exportModal.onclick = (e) => { if (e.target === exportModal) closeExportModal(); };

        // ---- اختصار مسح الكاش ----
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'r' || e.key === 'R')) {
                e.preventDefault();
                if (confirm('تحديث الكاش؟')) {
                    if ('caches' in window) {
                        caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))).then(() => {
                            alert('تم التحديث، سيتم إعادة التحميل');
                            location.reload(true);
                        });
                    } else { location.reload(true); }
                }
            }
        });

        // ---- بدء التطبيق ----
        toggleUnitMode('عام');
        loadData();
    }

    // ============================================================
    // 7. بدء التشغيل
    // ============================================================
    checkLogin();
});