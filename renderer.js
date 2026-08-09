document.addEventListener('DOMContentLoaded', function() {
    // ----- إدارة تسجيل الدخول -----
    const loginScreen = document.getElementById('login-screen');
    const mainContent = document.getElementById('main-content');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const userDisplay = document.getElementById('user-display');

    const VALID_USER = 'شعبة القوى البشرية';
    const VALID_PASS = '010203';

    function checkLogin() {
        const logged = sessionStorage.getItem('loggedIn');
        if (logged === 'true') {
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
        const username = sessionStorage.getItem('username') || 'شعبة القوى البشرية';
        userDisplay.textContent = '👤 ' + username;
        initApp();
    }

    function handleLogin() {
        const user = loginUsername.value.trim();
        const pass = loginPassword.value.trim();
        if (user === VALID_USER && pass === VALID_PASS) {
            sessionStorage.setItem('loggedIn', 'true');
            sessionStorage.setItem('username', user);
            loginError.style.display = 'none';
            showMainContent();
        } else {
            loginError.style.display = 'block';
            loginPassword.value = '';
            loginPassword.focus();
        }
    }

    function handleLogout() {
        sessionStorage.removeItem('loggedIn');
        sessionStorage.removeItem('username');
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

    // ----- منطق التطبيق -----
    function initApp() {
        const personnelTbody = document.querySelector('#personnel-table tbody');
        const exportBtn = document.getElementById('export-btn');
        const addBtn = document.getElementById('add-person-btn');
        const addVacantBtn = document.getElementById('add-vacant-btn');
        const resetBtn = document.getElementById('reset-btn');

        // مودال الإضافة العادي
        const modal = document.getElementById('add-modal');
        const newName = document.getElementById('new-name');
        const newPoint = document.getElementById('new-point');
        const newJob = document.getElementById('new-job');
        const modalCancel = document.getElementById('modal-cancel');
        const modalSave = document.getElementById('modal-save');

        // مودال إضافة الشاغر
        const vacantModal = document.getElementById('add-vacant-modal');
        const vacantPoint = document.getElementById('vacant-point');
        const vacantJob = document.getElementById('vacant-job');
        const vacantCancel = document.getElementById('vacant-modal-cancel');
        const vacantSave = document.getElementById('vacant-modal-save');

        const defaultData = [
            { name: 'سالم صلاح سالم', point: 'قيادة الفرقة', job: 'ضابط امن سيبراني', status: 'حاضر' },
            { name: 'سالم صلاح سالم', point: 'اللواء 34', job: 'ضابط امن سيبراني', status: 'حاضر' },
            { name: 'سالم صلاح سالم', point: 'اللواء 33', job: 'ضابط امن سيبراني', status: 'دورة' }
        ];
        let personnelData = [];

        // ----- إدارة الملاك (Quota) -----
        function loadQuotas() {
            const saved = localStorage.getItem('saryaQuotas');
            if (saved) {
                try {
                    const quotas = JSON.parse(saved);
                    document.querySelectorAll('.quota-input').forEach(input => {
                        const row = input.dataset.row;
                        if (quotas[row] !== undefined) input.value = quotas[row];
                    });
                } catch (e) {}
            }
        }

        function saveQuotas() {
            const quotas = {};
            document.querySelectorAll('.quota-input').forEach(input => {
                quotas[input.dataset.row] = input.value;
            });
            localStorage.setItem('saryaQuotas', JSON.stringify(quotas));
        }

        // ربط تغيير الملاك بالحفظ
        document.querySelectorAll('.quota-input').forEach(input => {
            input.addEventListener('change', saveQuotas);
            input.addEventListener('input', saveQuotas);
        });

        // ----- تحميل وحفظ بيانات الموظفين -----
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

        // ----- عرض الجدول -----
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
                            <option value="مستأذن" ${item.status==='مستأذن'?'selected':''}>مستأذن</option>
                            <option value="غياب" ${item.status==='غياب'?'selected':''}>غياب</option>
                            <option value="سجن" ${item.status==='سجن'?'selected':''}>سجن</option>
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
                    if(confirm('حذف الموظف؟')) { 
                        personnelData.splice(idx,1); 
                        renderTable(); 
                        updateStats(); 
                        saveData(); 
                    }
                };
            });
        }

        // ----- إضافة موظف عادي -----
        function openModal() { 
            newName.value=''; newPoint.value=''; newJob.value=''; 
            modal.style.display='flex'; 
            setTimeout(()=>newName.focus(), 100); 
        }
        function closeModal() { modal.style.display='none'; }
        
        addBtn.onclick = openModal;
        modalCancel.onclick = closeModal;
        modal.onclick = (e) => { if(e.target === modal) closeModal(); };
        
        modalSave.onclick = () => {
            const name = newName.value.trim();
            if(!name) { alert('أدخل الاسم'); return; }
            personnelData.push({ 
                name: name, 
                point: newPoint.value.trim(), 
                job: newJob.value.trim(), 
                status: 'حاضر' 
            });
            closeModal(); 
            renderTable(); 
            updateStats(); 
            saveData();
        };

        // ----- إضافة شاغر (مودال خاص) -----
        function openVacantModal() {
            vacantPoint.value = '';
            vacantJob.value = '';
            vacantModal.style.display = 'flex';
            setTimeout(() => vacantPoint.focus(), 100);
        }
        function closeVacantModal() {
            vacantModal.style.display = 'none';
        }

        addVacantBtn.onclick = openVacantModal;
        vacantCancel.onclick = closeVacantModal;
        vacantModal.onclick = (e) => { if(e.target === vacantModal) closeVacantModal(); };

        vacantSave.onclick = () => {
            const point = vacantPoint.value.trim();
            const job = vacantJob.value.trim();
            // يمكن إضافة تحقق إذا أردت
            personnelData.push({ 
                name: '',        // الاسم فارغ تماماً
                point: point,
                job: job,
                status: 'شاغر'
            });
            closeVacantModal();
            renderTable();
            updateStats();
            saveData();
        };

        // ----- تحديث إحصائيات الضباط -----
        function updateStats() {
            try {
                const stats = {'حاضر':0,'إجازة':0,'مستشفى':0,'مهمة':0,'مكلف':0,'مستأذن':0,'دورة':0,'مرافق':0,'متأخر':0,'غياب':0,'سجن':0,'اسرى':0,'شهداء':0,'جرحى':0,'اعاقة':0,'هروب':0};
                personnelData.forEach(p => {
                    // تجاهل الشواغر تماماً
                    if (p.status && p.status !== 'شاغر' && stats[p.status] !== undefined) {
                        stats[p.status]++;
                    }
                });
                const map = ['حاضر',0,'إجازة','مستشفى','مهمة','مكلف','مستأذن','دورة','مرافق','متأخر','غياب','سجن','اسرى','شهداء','جرحى','اعاقة','هروب'];
                const rowOfficers = document.getElementById('row-officers');
                if(rowOfficers) {
                    const spans = rowOfficers.querySelectorAll('.stat-val');
                    spans.forEach((span, i) => {
                        let key = map[i]; 
                        span.innerText = key === 0 ? '0' : (stats[key] || 0);
                    });
                }
            } catch (e) {}
        }

        // ----- التحقق من صحة البيانات -----
        function validate() {
            let errors = [];
            try {
                const officerStats = {'حاضر':0,'إجازة':0,'مستشفى':0,'مهمة':0,'مكلف':0,'مستأذن':0,'دورة':0,'مرافق':0,'متأخر':0,'غياب':0,'سجن':0,'اسرى':0,'شهداء':0,'جرحى':0,'اعاقة':0,'هروب':0};
                personnelData.forEach(p => {
                    if (p.status && p.status !== 'شاغر' && officerStats[p.status] !== undefined) {
                        officerStats[p.status]++;
                    }
                });
                let officerSum = 0; Object.values(officerStats).forEach(v => officerSum += v);
                
                document.querySelectorAll('#row-officers, #row-soldiers, #row-employees').forEach(row => {
                    const title = row.querySelector('.rank-title') ? row.querySelector('.rank-title').innerText : row.querySelector('.row-title')?.innerText || '';
                    const quota = parseInt(row.querySelector('.quota-input').value) || 0;
                    let sum = 0;
                    if(title.includes('ضباط')) { 
                        sum = officerSum; 
                    } else { 
                        row.querySelectorAll('.stat-input').forEach(inp => sum += parseInt(inp.value)||0); 
                    }
                    if(sum !== quota) errors.push(`صف "${title}" غير متطابق! الملاك: ${quota}، المدخل: ${sum}`);
                });
            } catch (e) { errors.push('خطأ في التحقق'); }

            if(errors.length > 0) { alert('⛔ منع التصدير:\n' + errors.join('\n')); return false; }
            return true;
        }

        // ----- تصدير Excel -----
        async function exportExcel() {
            if(!validate()) return;
            try {
                const officerStats = {'حاضر':0,'إجازة':0,'مستشفى':0,'مهمة':0,'مكلف':0,'مستأذن':0,'دورة':0,'مرافق':0,'متأخر':0,'غياب':0,'سجن':0,'اسرى':0,'شهداء':0,'جرحى':0,'اعاقة':0,'هروب':0};
                personnelData.forEach(p => {
                    if (p.status && p.status !== 'شاغر' && officerStats[p.status] !== undefined) {
                        officerStats[p.status]++;
                    }
                });
                const officerRow = [officerStats['حاضر']||0,0,officerStats['إجازة']||0,officerStats['مستشفى']||0,officerStats['مهمة']||0,officerStats['مكلف']||0,officerStats['مستأذن']||0,officerStats['دورة']||0,officerStats['مرافق']||0,officerStats['متأخر']||0,officerStats['غياب']||0,officerStats['سجن']||0,officerStats['اسرى']||0,officerStats['شهداء']||0,officerStats['جرحى']||0,officerStats['اعاقة']||0,officerStats['هروب']||0];
                const soldiers = Array.from(document.querySelectorAll('#row-soldiers .stat-input')).map(i => parseInt(i.value)||0);
                const employees = Array.from(document.querySelectorAll('#row-employees .stat-input')).map(i => parseInt(i.value)||0);
                const quotas = Array.from(document.querySelectorAll('#row-officers, #row-soldiers, #row-employees')).map(r => parseInt(r.querySelector('.quota-input').value)||0);

                const wb = new ExcelJS.Workbook(); 
                const ws = wb.addWorksheet('سرية القناصة');
                const headers = ['الرتبة','الملاك','في المعسكر','موقع','إجازة','مستشفى','مهمة','مكلف','مستأذن','دورة','مرافقين','متأخر','غياب','سجن','اسرى','شهداء','جرحى','إعاقة','الهروب','المجموع'];
                ws.addRow(headers).font = { bold: true };
                
                const titles = ['ضباط','أفراد مقاتلين','موظف'];
                titles.forEach((t,i) => {
                    const r = ws.addRow([t, quotas[i], ...(i===0?officerRow:(i===1?soldiers:employees))]);
                    r.getCell(20).value = { formula: `SUM(C${r.number}:S${r.number})` };
                });
                
                const total = ws.addRow(['الإجمالي']);
                for(let c=2;c<=19;c++) total.getCell(c).value = { formula: `SUM(${ws.getCell(2,c).address}:${ws.getCell(4,c).address})` };
                total.getCell(20).value = { formula: `SUM(C${total.number}:S${total.number})` };
                
                ws.addRow([]); ws.addRow(['م','الاسم','النقطة','الوظيفة','الحالة']);
                personnelData.forEach((p,i) => ws.addRow([i+1, p.name, p.point, p.job, p.status]));

                const buf = await wb.xlsx.writeBuffer();
                const blob = new Blob([buf], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
                const link = document.createElement('a'); 
                link.href = URL.createObjectURL(blob); 
                link.download = 'تقرير_السرية.xlsx';
                document.body.appendChild(link); 
                link.click(); 
                document.body.removeChild(link); 
                URL.revokeObjectURL(link.href);
                alert('✅ تم تصدير وتنزيل الإكسيل بنجاح!');
            } catch (e) { alert('حدث خطأ أثناء التصدير: ' + e.message); }
        }

        exportBtn.onclick = exportExcel;
        resetBtn.onclick = () => { 
            if(confirm('مسح البيانات والعودة للافتراضي؟')) { 
                localStorage.removeItem('saryaData');
                localStorage.removeItem('saryaQuotas');
                location.reload(); 
            } 
        };
        
        loadQuotas();
        loadData();
    }

    checkLogin();
});