document.addEventListener('DOMContentLoaded', () => {
    const bookForm = document.getElementById('form-novo-livro');
    const bookGrid = document.getElementById('book-grid');
    const modalEmprestimo = document.getElementById('modal-emprestimo');
    const btnGerenciar = document.getElementById('nav-gerenciar');

    // STORAGE
    const STORAGE_KEY = 'library_books';
    const SORT_KEY = 'library_sort';
    const PAGE_SIZE = 10;

    function loadBooksFromStorage() {
        const raw = localStorage.getItem(STORAGE_KEY);
        try {
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Erro ao parsear books do localStorage', e);
            return [];
        }
    }

    function saveBooksToStorage(books) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    }

    function loadSort() {
        const raw = localStorage.getItem(SORT_KEY);
        return raw ? JSON.parse(raw) : { field: 'titulo', dir: 'asc' };
    }

    function saveSort(sort) {
        localStorage.setItem(SORT_KEY, JSON.stringify(sort));
    }

    // UI: adiciona controle de ordenacao e area de paginação dinamicamente
    function ensureCatalogControls() {
        const sec = document.getElementById('sec-catalogo');
        if (!sec) return;
        let controls = sec.querySelector('.catalog-controls');
        if (!controls) {
            controls = document.createElement('div');
            controls.className = 'catalog-controls';

            const sortSelect = document.createElement('select');
            sortSelect.id = 'sort-select';
            sortSelect.innerHTML = `
                <option value="titulo:asc">Título ↑</option>
                <option value="titulo:desc">Título ↓</option>
                <option value="ano:asc">Ano ↑</option>
                <option value="ano:desc">Ano ↓</option>
            `;
            controls.appendChild(sortSelect);

            const pagination = document.createElement('div');
            pagination.className = 'catalog-pagination';
            pagination.id = 'catalog-pagination';
            controls.appendChild(pagination);

            sec.insertBefore(controls, sec.querySelector('.book-grid'));

            // set current sort
            const current = loadSort();
            document.getElementById('sort-select').value = `${current.field}:${current.dir}`;

            sortSelect.addEventListener('change', () => {
                const [field, dir] = sortSelect.value.split(':');
                saveSort({ field, dir });
                applyFiltersAndRender(1);
            });
        }
    }

    // Aplicar filtros, busca, ordenação e paginação
    function applyFiltersAndRender(page = 1) {
        const all = loadBooksFromStorage();
        const search = (document.getElementById('search-bar')?.value || '').toLowerCase().trim();
        const genre = document.getElementById('filter-genre')?.value || '';
        const year = document.getElementById('filter-year')?.value || '';
        const status = document.getElementById('filter-status')?.value || '';

        let filtered = all.filter(b => {
            let ok = true;
            if (search) {
                const hay = `${b.titulo} ${b.autor}`.toLowerCase();
                ok = ok && hay.includes(search);
            }
            if (genre) ok = ok && (b.genero === genre);
            if (year) ok = ok && (String(b.ano) === String(year));
            if (status) ok = ok && (String(b.status).toLowerCase() === String(status).toLowerCase());
            return ok;
        });

        // ordenacao
        const sort = loadSort();
        filtered.sort((a, b) => {
            const fa = (a[sort.field] ?? '').toString().toLowerCase();
            const fb = (b[sort.field] ?? '').toString().toLowerCase();
            if (fa < fb) return sort.dir === 'asc' ? -1 : 1;
            if (fa > fb) return sort.dir === 'asc' ? 1 : -1;
            return 0;
        });

        renderPage(filtered, page);
        populateEmprestimoSelect(loadBooksFromStorage()); // always show all books in select
    }

    // STATE para controlar o card ativo e botão de excluir visível
    let activeDelBtn = null;

    function renderPage(items, page) {
        bookGrid.innerHTML = '';
        if (!items.length) {
            bookGrid.innerHTML = `
                <div class="empty-state">
                    <p>Nenhum livro encontrado. Adicione um novo livro ou ajuste os filtros.</p>
                </div>`;
            renderPagination(0, page);
            window.livros = [];
            return;
        }

        const totalPages = Math.ceil(items.length / PAGE_SIZE);
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        const start = (page - 1) * PAGE_SIZE;
        const pageItems = items.slice(start, start + PAGE_SIZE);

        pageItems.forEach(book => {
            const card = document.createElement('div');
            card.classList.add('book-card');
            card.dataset.bookId = book.id || book.isbn || book.titulo || '';
            const statusClass = (book.status && String(book.status).toLowerCase().includes('emprest')) ? 'status-emprestado' : 'status-disponivel';
            card.innerHTML = `
                <img src="${book.capa || 'https://via.placeholder.com/150x220?text=Livro'}" alt="Capa do livro" class="book-cover">
                <h3 class="book-title">${book.titulo}</h3>
                <p class="book-author">${book.autor || 'Autor não informado'}</p>
                <p class="book-year">${book.ano || ''}</p>
                <span class="book-status ${statusClass}">${book.status || 'desconhecido'}</span>
            `;

            // Botão Excluir (inicialmente oculto)
            const delBtn = document.createElement('button');
            delBtn.className = 'button button-delete';
            delBtn.textContent = 'Excluir';
            delBtn.style.marginTop = '8px';
            delBtn.style.display = 'none';
            delBtn.dataset.forId = card.dataset.bookId;
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!confirm('Tem certeza que deseja excluir este livro?')) return;
                const books = loadBooksFromStorage();
                const idx = books.findIndex(b => (
                    (b.id && delBtn.dataset.forId && b.id === delBtn.dataset.forId) ||
                    (b.isbn && delBtn.dataset.forId && b.isbn === delBtn.dataset.forId) ||
                    (b.titulo && delBtn.dataset.forId && b.titulo === delBtn.dataset.forId)
                ));
                if (idx === -1) {
                    alert('Livro não encontrado no armazenamento.');
                    return;
                }
                books.splice(idx, 1);
                saveBooksToStorage(books);
                // Re-renderiza mantendo a mesma página solicitada
                applyFiltersAndRender(page);
            });

            // clicar no card abre modal e exibe opções (mostrar o botão Excluir)
            card.addEventListener('click', () => {
                // esconder botão anterior
                if (activeDelBtn && activeDelBtn !== delBtn) {
                    activeDelBtn.style.display = 'none';
                }
                // mostrar o botão deste card
                delBtn.style.display = 'inline-block';
                activeDelBtn = delBtn;

                // abrir modal com detalhes
                abrirModalDetalhes(book);
            });

            card.appendChild(delBtn);
            bookGrid.appendChild(card);
        });

        renderPagination(Math.ceil(items.length / PAGE_SIZE), page);
        window.livros = items;
    }

    function renderPagination(totalPages, currentPage) {
        const container = document.getElementById('catalog-pagination');
        if (!container) return;
        container.innerHTML = '';
        if (totalPages <= 1) return;

        const prev = document.createElement('button');
        prev.className = 'button';
        prev.textContent = 'Anterior';
        prev.disabled = currentPage <= 1;
        prev.addEventListener('click', () => applyFiltersAndRender(currentPage - 1));
        container.appendChild(prev);

        const span = document.createElement('span');
        span.style.margin = '0 8px';
        span.textContent = `${currentPage} / ${totalPages}`;
        container.appendChild(span);

        const next = document.createElement('button');
        next.className = 'button';
        next.textContent = 'Próxima';
        next.disabled = currentPage >= totalPages;
        next.addEventListener('click', () => applyFiltersAndRender(currentPage + 1));
        container.appendChild(next);
    }

    // Atualiza select de empréstimo
    function populateEmprestimoSelect(books) {
        const sel = document.getElementById('livro-emprestimo');
        if (!sel) return;
        sel.innerHTML = '<option value="">Selecione um livro</option>';
        books.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id || b.isbn || b.titulo;
            opt.textContent = `${b.titulo} — ${b.autor || ''} (${b.status || 'desconhecido'})`;
            sel.appendChild(opt);
        });
    }

    // Modal detalhes
    function abrirModalDetalhes(book) {
        document.getElementById('modal-capa').src = book.capa || 'https://via.placeholder.com/150x220?text=Livro';
        document.getElementById('modal-titulo').textContent = book.titulo;
        document.getElementById('modal-autor').textContent = book.autor;
        document.getElementById('modal-paginas').textContent = book.paginas || "Não informado";
        document.getElementById('modal-ano').textContent = book.ano;
        document.getElementById('modal-isbn').textContent = book.isbn || "N/A";
        document.getElementById('modal-genero').textContent = book.genero;
        document.getElementById('modal-status').textContent = book.status;
        document.getElementById('modal-descricao').textContent = book.descricao || '';

        // guarda referência do livro exibido para ações (editar/excluir)
        const modal = document.getElementById('modal-detalhes');
        if (modal) modal.dataset.currentId = book.id || book.isbn || book.titulo || '';

        // mostra o modal
        document.getElementById('modal-detalhes').style.display = 'block';
    }

    // Fechar/abrir modal
    function fecharModal(modalElement) {
        if (!modalElement) return;
        modalElement.style.display = 'none';
        // retornar foco para o botão que abriu o modal
        const addBtn = document.getElementById('add-book-btn');
        if (addBtn) addBtn.focus();
    }

    function abrirModal(modalElement) {
        if (!modalElement) return;
        modalElement.style.display = 'block';
        // foco no primeiro input do modal
        const firstInput = modalElement.querySelector('input, select, textarea, button');
        if (firstInput) firstInput.focus();
    }

    // Delegação segura: fechar modal ao clicar em qualquer botão com classe '.close-modal' ou fora
    document.addEventListener('click', (e) => {
        if (e.target.classList && e.target.classList.contains('close-modal')) {
            const modal = e.target.closest('.modal');
            fecharModal(modal);
            return;
        }
        if (e.target.classList && e.target.classList.contains('modal')) {
            fecharModal(e.target);
        }
    });

    // Fechar modal detalhes (handler separado guardado)
    document.querySelectorAll('#modal-detalhes .close-modal').forEach(btn => {
        btn.addEventListener('click', () => fecharModal(document.getElementById('modal-detalhes')));
    });

    // Handler para excluir a partir do modal de detalhes
    document.getElementById('excluir-livro')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!confirm('Tem certeza que deseja excluir este livro?')) return;
        const modal = document.getElementById('modal-detalhes');
        const id = modal?.dataset.currentId;
        const books = loadBooksFromStorage();
        const idx = books.findIndex(b => (b.id === id) || (b.isbn === id) || (b.titulo === id));
        if (idx === -1) {
            alert('Livro não encontrado');
            return;
        }
        books.splice(idx, 1);
        saveBooksToStorage(books);
        fecharModal(modal);
        // atualizar lista (mantém página 1 para simplicidade)
        applyFiltersAndRender(1);
    });

    // Handler para editar a partir do modal de detalhes
    document.getElementById('editar-livro')?.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = document.getElementById('modal-detalhes');
        const id = modal?.dataset.currentId;
        const books = loadBooksFromStorage();
        const book = books.find(b => (b.id === id) || (b.isbn === id) || (b.titulo === id));
        if (!book) { alert('Livro não encontrado'); return; }

        // preencher o formulário de edição
        document.getElementById('livro-id').value = book.id || '';
        document.getElementById('titulo').value = book.titulo || '';
        document.getElementById('autor').value = book.autor || '';
        document.getElementById('ano').value = book.ano || '';
        document.getElementById('paginas').value = book.paginas || '';
        document.getElementById('genero').value = book.genero || '';
        document.getElementById('isbn').value = book.isbn || '';
        document.getElementById('capa').value = book.capa || '';
        document.getElementById('descricao').value = book.descricao || '';
        document.getElementById('status').value = book.status || 'disponível';

        // fechar modal detalhes e abrir modal de edição
        fecharModal(modal);
        abrirModal(document.getElementById('modal-novo-livro'));
    });

    // Cadastro de novo livro com validação (título duplicado) - atualizado para suportar edição
    bookForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(bookForm);
        const titulo = (formData.get('titulo') || '').trim();
        const autor = (formData.get('autor') || '').trim();
        const ano = formData.get('ano');

        // validações front-end
        if (!titulo || titulo.length < 3 || titulo.length > 90) {
            alert('Título inválido (3-90 caracteres)');
            return;
        }
        if (!autor) {
            alert('Autor é obrigatório');
            return;
        }
        const anoNum = Number(ano);
        const currentYear = new Date().getFullYear();
        if (!ano || isNaN(anoNum) || anoNum < 1900 || anoNum > currentYear) {
            alert('Ano inválido');
            return;
        }

        const books = loadBooksFromStorage();
        const editingId = document.getElementById('livro-id')?.value || '';

        // impedir título duplicado (exceto quando for o mesmo registro sendo editado)
        const exists = books.some(b => b.titulo && b.titulo.toLowerCase() === titulo.toLowerCase() && b.id !== editingId);
        if (exists) {
            alert('Já existe um livro com este título');
            return;
        }

        if (editingId) {
            // edição: localizar e atualizar
            const idx = books.findIndex(b => b.id === editingId || b.isbn === editingId || b.titulo === editingId);
            if (idx === -1) {
                alert('Livro para edição não encontrado');
                return;
            }
            const bookData = books[idx];
            bookData.titulo = titulo;
            bookData.autor = autor;
            bookData.ano = anoNum;
            bookData.paginas = formData.get('paginas');
            bookData.genero = formData.get('genero');
            bookData.isbn = formData.get('isbn');
            bookData.capa = formData.get('capa');
            bookData.descricao = formData.get('descricao') || '';
            bookData.status = formData.get('status') || 'disponível';

            saveBooksToStorage(books);

            // resetar estado de edição
            document.getElementById('livro-id').value = '';
            bookForm.reset();
            fecharModal(document.getElementById('modal-novo-livro'));
            applyFiltersAndRender(1);
            return;
        }

        // criação normal
        const bookData = {
            id: Date.now().toString(),
            titulo,
            autor,
            ano: anoNum,
            paginas: formData.get('paginas'),
            genero: formData.get('genero'),
            isbn: formData.get('isbn'),
            capa: formData.get('capa'),
            descricao: formData.get('descricao') || '',
            status: formData.get('status') || 'disponível',
            data_emprestimo: null,
            history: [] // histórico de empréstimos
        };

        try {
            books.unshift(bookData);
            saveBooksToStorage(books);

            bookForm.reset();
            const modalNovoLivro = document.getElementById('modal-novo-livro');
            if (modalNovoLivro) fecharModal(modalNovoLivro);
            applyFiltersAndRender(1);
        } catch (err) {
            console.error('Erro ao salvar em localStorage', err);
            alert('Erro ao salvar livro no armazenamento local.');
        }
    });

    // Empréstimo / devolução logic
    const confirmarEmprestimoBtn = document.getElementById('confirmar-emprestimo');
    const confirmarDevolucaoBtn = document.getElementById('confirmar-devolucao');

    if (confirmarEmprestimoBtn) {
        confirmarEmprestimoBtn.addEventListener('click', () => {
            const sel = document.getElementById('livro-emprestimo');
            const id = sel?.value;
            const nome = (document.getElementById('nome-pessoa')?.value || '').trim();
            const dataEmp = document.getElementById('data-emprestimo')?.value || new Date().toISOString();
            const dataPrevDevol = document.getElementById('data-devolucao')?.value || null;
            if (!id) { alert('Selecione um livro'); return; }
            if (!nome) { alert('Informe o nome da pessoa'); return; }
            const books = loadBooksFromStorage();
            const book = books.find(b => (b.id === id) || (b.isbn === id) || (b.titulo === id));
            if (!book) { alert('Livro não encontrado'); return; }
            if (String(book.status).toLowerCase().includes('emprest')) { alert('Livro já está emprestado'); return; }

            // criar entrada de histórico
            if (!Array.isArray(book.history)) book.history = [];
            const entry = {
                nome: nome,
                data_emprestimo: new Date(dataEmp).toISOString(),
                data_prev_devolucao: dataPrevDevol ? new Date(dataPrevDevol).toISOString() : null,
                data_devolucao: null // data real de devolução
            };
            book.history.push(entry);
            book.status = 'emprestado';
            book.data_emprestimo = entry.data_emprestimo;
            saveBooksToStorage(books);
            applyFiltersAndRender(1);
            updateReports();
            alert('Empréstimo registrado');
        });
    }

    if (confirmarDevolucaoBtn) {
        confirmarDevolucaoBtn.addEventListener('click', () => {
            const sel = document.getElementById('livro-emprestimo');
            const id = sel?.value;
            const dataDev = document.getElementById('data-devolucao')?.value || new Date().toISOString();
            if (!id) { alert('Selecione um livro'); return; }
            const books = loadBooksFromStorage();
            const book = books.find(b => (b.id === id) || (b.isbn === id) || (b.titulo === id));
            if (!book) { alert('Livro não encontrado'); return; }
            if (!String(book.status).toLowerCase().includes('emprest')) { alert('Livro não está emprestado'); return; }

            // localizar a última entrada de history sem data_devolucao
            if (!Array.isArray(book.history)) book.history = [];
            const idx = book.history.map(h => h.data_devolucao).lastIndexOf(null);
            let entry = null;
            if (idx !== -1) {
                entry = book.history[idx];
            } else {
                // fallback: pegar última entrada
                entry = book.history[book.history.length - 1] || null;
            }
            if (!entry) { alert('Nenhum empréstimo ativo encontrado para este livro'); return; }
            entry.data_devolucao = new Date(dataDev).toISOString();

            // atualizar status do livro
            book.status = 'disponível';
            book.data_emprestimo = null;
            saveBooksToStorage(books);
            applyFiltersAndRender(1);
            updateReports();
            alert('Devolução registrada');
        });
    }

    // Alterna visibilidade das seções
    function mostrarSecao(secaoId) {
        document.getElementById('sec-catalogo').hidden = true;
        document.getElementById('sec-gerenciar').hidden = true;
        document.getElementById('sec-relatorios').hidden = true;
        document.getElementById(secaoId).hidden = false;
    }

    // Inicial → abre Catálogo (não Gerenciar!)
    // Ao carregar, mantenha todas as seções fechadas e só abra ao clicar em abas
    document.getElementById('sec-catalogo').hidden = true;
    document.getElementById('sec-gerenciar').hidden = true;
    document.getElementById('sec-relatorios').hidden = true;

    // Abrir catálogo por padrão ao final da inicialização
    mostrarSecao('sec-catalogo');

    document.getElementById('nav-catalogo').onclick = () => {
        mostrarSecao('sec-catalogo');
        applyFiltersAndRender(1);
    };
    document.getElementById('nav-gerenciar').onclick = () => {
        mostrarSecao('sec-gerenciar');
    };
    document.getElementById('nav-relatorios').onclick = () => {
        mostrarSecao('sec-relatorios');
        // atualizar estatísticas básicas
        updateReports();
    };

    // Adiciona handlers para filtros e busca
    document.getElementById('aplicar-filtros')?.addEventListener('click', () => applyFiltersAndRender(1));
    document.getElementById('limpar-filtros')?.addEventListener('click', () => {
        document.getElementById('filter-genre').value = '';
        document.getElementById('filter-year').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('search-bar').value = '';
        applyFiltersAndRender(1);
    });
    document.getElementById('search-bar')?.addEventListener('input', () => applyFiltersAndRender(1));

    // Abrir modal Novo Livro pelo botão
    // (duplicata removida — referências já inicializadas anteriormente)

    // Abrir modal de empréstimo pelo botão na UI (se presente)
    // (duplicata removida — referência já inicializada anteriormente)

    // Ferramenta de relatórios (export CSV/JSON)
    document.getElementById('export-csv')?.addEventListener('click', () => {
        const items = window.livros || loadBooksFromStorage();
        const csv = toCSV(items);
        downloadBlob(csv, 'books.csv', 'text/csv');
    });
    document.getElementById('export-json')?.addEventListener('click', () => {
        const items = window.livros || loadBooksFromStorage();
        const json = JSON.stringify(items, null, 2);
        downloadBlob(json, 'books.json', 'application/json');
    });

    function toCSV(items) {
        if (!items || !items.length) return '';
        const keys = ['id','titulo','autor','ano','paginas','genero','isbn','status','data_emprestimo'];
        const rows = [keys.join(',')];
        items.forEach(it => {
            rows.push(keys.map(k => `"${String(it[k] ?? '')}"`).join(','));
        });
        return rows.join('\n');
    }

    function downloadBlob(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // Estatísticas simples para Relatórios
    function updateReports() {
        const all = loadBooksFromStorage();
        document.getElementById('total-livros').textContent = all.length;
        document.getElementById('livros-disponiveis').textContent = all.filter(b => String(b.status).toLowerCase().includes('disp')).length;
        document.getElementById('livros-emprestados').textContent = all.filter(b => String(b.status).toLowerCase().includes('emprest')).length;
        const byGenre = all.reduce((acc, b) => {
            const g = b.genero || 'Outro';
            acc[g] = (acc[g] || 0) + 1;
            return acc;
        }, {});
        const ul = document.getElementById('livros-por-genero');
        ul.innerHTML = '';
        Object.keys(byGenre).forEach(k => {
            const li = document.createElement('li');
            li.textContent = `${k}: ${byGenre[k]}`;
            ul.appendChild(li);
        });

        // Relatório detalhado de empréstimos: listar todos os livros que já foram emprestados (history.length > 0)
        let container = document.getElementById('rel-emprestados');
        if (!container) {
            container = document.createElement('div');
            container.id = 'rel-emprestados';
            container.style.marginTop = '16px';
            const reportSection = document.getElementById('report-output');
            reportSection.appendChild(container);
        }
        container.innerHTML = '<h3>Livros com histórico de Empréstimos</h3>';

        const emprestados = all.filter(b => Array.isArray(b.history) && b.history.length > 0);
        if (!emprestados.length) {
            container.innerHTML += '<p>Nenhum empréstimo registrado ainda.</p>';
            return;
        }

        const formatDate = (iso) => {
            if (!iso) return '-';
            try { const d = new Date(iso); return d.toLocaleDateString(); } catch (e) { return iso; }
        };

        emprestados.forEach(book => {
            const card = document.createElement('div');
            card.className = 'report-book-card';
            card.style.display = 'flex';
            card.style.marginBottom = '12px';
            card.style.border = '1px solid #ddd';
            card.style.padding = '10px';
            card.style.borderRadius = '6px';

            const capa = document.createElement('img');
            capa.src = book.capa || 'https://via.placeholder.com/80x120?text=Livro';
            capa.alt = book.titulo;
            capa.style.width = '80px';
            capa.style.height = '120px';
            capa.style.objectFit = 'cover';
            capa.style.marginRight = '12px';
            card.appendChild(capa);

            const right = document.createElement('div');
            right.style.flex = '1';

            const title = document.createElement('h4');
            title.textContent = `${book.titulo} — ${book.autor || ''}`;
            right.appendChild(title);

            // tabela de histórico
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Nome do usuário</th>
                        <th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Data de empréstimo</th>
                        <th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Data prevista de devolução</th>
                        <th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Data de devolução</th>
                        <th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Status</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');

            book.history.slice().reverse().forEach(entry => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding:6px; border-bottom:1px solid #eee;">${entry.nome || '-'}</td>
                    <td style="padding:6px; border-bottom:1px solid #eee;">${formatDate(entry.data_emprestimo)}</td>
                    <td style="padding:6px; border-bottom:1px solid #eee;">${formatDate(entry.data_prev_devolucao)}</td>
                    <td style="padding:6px; border-bottom:1px solid #eee;">${formatDate(entry.data_devolucao)}</td>
                    <td style="padding:6px; border-bottom:1px solid #eee; font-weight:600;"></td>
                `;
                const statusCell = tr.querySelector('td:last-child');
                // determina se atrasado
                let atrasado = false;
                const now = new Date();
                if (!entry.data_devolucao) {
                    // não devolvido ainda
                    if (entry.data_prev_devolucao) {
                        const due = new Date(entry.data_prev_devolucao);
                        if (now > due) atrasado = true;
                    }
                    statusCell.textContent = atrasado ? 'Atrasado' : 'No prazo';
                    statusCell.style.color = atrasado ? '#c00' : '#090';
                } else {
                    // já devolvido: comparar data_devolucao (real) com data_prev_devolucao
                    if (entry.data_prev_devolucao) {
                        const due = new Date(entry.data_prev_devolucao);
                        const real = new Date(entry.data_devolucao);
                        atrasado = real > due;
                    }
                    statusCell.textContent = atrasado ? 'Atrasado' : 'Devolvido no prazo';
                    statusCell.style.color = atrasado ? '#c00' : '#090';
                }

                tbody.appendChild(tr);
            });

            right.appendChild(table);
            card.appendChild(right);
            container.appendChild(card);
        });
    }

    // UI effects: brilho no botão e folhas caindo
    function shineButton(btn) {
        if (!btn) return;
        btn.classList.add('btn-shine');
        btn.classList.add('animate');
        setTimeout(() => btn.classList.remove('animate'), 800);
    }

    function startLeafFall(durationMs = 3000) {
        // criar overlay
        let overlay = document.getElementById('leaf-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'leaf-overlay';
            document.body.appendChild(overlay);
        }
        // criar várias folhas com variações
        const count = 18;
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        for (let i = 0; i < count; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'leaf ' + (i % 2 === 0 ? 'f1' : 'f2');
            const left = Math.random() * vw;
            const delay = Math.random() * 0.8 * (durationMs / 1000); // segundos
            const dur = 2 + Math.random() * 2.5; // 2..4.5s
            leaf.style.left = `${left}px`;
            leaf.style.top = `-10vh`;
            leaf.style.opacity = `${0.9 + Math.random() * 0.1}`;
            leaf.style.animation = `leafFall ${dur}s linear ${delay}s forwards`;
            overlay.appendChild(leaf);
        }
        // limpar após duração + margem
        setTimeout(() => {
            if (overlay) overlay.innerHTML = '';
        }, durationMs + 1200);
    }

    // integrando efeitos nos fluxos existentes
    // Ao criar novo livro (no submit handler), após salvar
    bookForm.addEventListener('submit', (e) => {
        // efeito no botão salvar
        const btn = document.getElementById('salvar-livro');
        if (btn) shineButton(btn);
        // se criação, disparar folhas após breve atraso (depois do save)
        setTimeout(() => startLeafFall(3000), 400);
    });

    // Ao registrar empréstimo e devolução (already handlers call updateReports etc.)
    const confirmarEmpBtn = document.getElementById('confirmar-emprestimo');
    if (confirmarEmpBtn) {
        confirmarEmpBtn.addEventListener('click', () => {
            shineButton(confirmarEmpBtn);
            setTimeout(() => startLeafFall(3000), 400);
        });
    }
    const confirmarDevBtn = document.getElementById('confirmar-devolucao');
    if (confirmarDevBtn) {
        confirmarDevBtn.addEventListener('click', () => {
            shineButton(confirmarDevBtn);
            setTimeout(() => startLeafFall(3000), 400);
        });
    }

    // --- API sync (opcional) ---
    window.apiEnabled = false;

    async function detectApi() {
        try {
            const resp = await fetch('/books/', { method: 'GET' });
            if (resp.ok) {
                window.apiEnabled = true;
                console.info('API disponível: sincronização ativada');
            }
        } catch (e) {
            window.apiEnabled = false;
        }
    }

    // tenta localizar um id do servidor correspondendo ao livro local (por isbn ou título)
    async function findServerId(book) {
        if (!window.apiEnabled) return null;
        try {
            const resp = await fetch('/books/');
            if (!resp.ok) return null;
            const list = await resp.json();
            const found = list.find(s => (book.isbn && s.isbn && String(s.isbn) === String(book.isbn)) || (s.titulo && book.titulo && s.titulo.toLowerCase() === book.titulo.toLowerCase()));
            return found ? found.id : null;
        } catch (e) {
            console.warn('Erro ao buscar id no servidor', e);
            return null;
        }
    }

    async function apiCreateBook(book) {
        if (!window.apiEnabled) return;
        try {
            await fetch('/books/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo: book.titulo, autor: book.autor, ano: book.ano, genero: book.genero, isbn: book.isbn, capa: book.capa, status: book.status })
            });
        } catch (e) { console.warn('Falha ao criar livro no servidor', e); }
    }

    async function apiUpdateBook(book) {
        if (!window.apiEnabled) return;
        try {
            const sid = await findServerId(book);
            if (!sid) return;
            await fetch(`/books/${sid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo: book.titulo, autor: book.autor, ano: book.ano, genero: book.genero, isbn: book.isbn, capa: book.capa, status: book.status })
            });
        } catch (e) { console.warn('Falha ao atualizar livro no servidor', e); }
    }

    async function apiDeleteBook(book) {
        if (!window.apiEnabled) return;
        try {
            const sid = await findServerId(book);
            if (!sid) return;
            await fetch(`/books/${sid}`, { method: 'DELETE' });
        } catch (e) { console.warn('Falha ao deletar livro no servidor', e); }
    }

    async function apiBorrowBook(book) {
        if (!window.apiEnabled) return;
        try {
            const sid = await findServerId(book);
            if (!sid) return;
            await fetch(`/books/${sid}/borrow`, { method: 'POST' });
        } catch (e) { console.warn('Falha ao registrar empréstimo no servidor', e); }
    }

    async function apiReturnBook(book) {
        if (!window.apiEnabled) return;
        try {
            const sid = await findServerId(book);
            if (!sid) return;
            await fetch(`/books/${sid}/return`, { method: 'POST' });
        } catch (e) { console.warn('Falha ao registrar devolução no servidor', e); }
    }

    // detectar API sem bloquear a inicialização
    detectApi();

    // Atualizar chamadas existentes para também tentar sincronizar com a API
    // Nota: as chamadas locais já existem; aqui adicionamos tentativas de sync
    // criação (no submit): chamada apiCreateBook ou apiUpdateBook já é feita logo após salvar em localStorage
    // excluir a partir do modal
    const origModalExcluir = document.getElementById('excluir-livro');
    if (origModalExcluir) {
        origModalExcluir.addEventListener('click', async (e) => {
            // handler já existente lida com exclusão local; aqui apenas sincronizamos
            // delay pequeno para garantir que o localStorage já foi atualizado pelo handler original
            await new Promise(r => setTimeout(r, 200));
            const modal = document.getElementById('modal-detalhes');
            const id = modal?.dataset.currentId;
            const books = loadBooksFromStorage();
            const book = books.find(b => (b.id === id) || (b.isbn === id) || (b.titulo === id));
            if (book) await apiDeleteBook(book);
        });
    }

    // interceptar criação/atualização para sincronizar
    // substitui chamadas locais existentes: vamos envolver saveBooksToStorage para sincronizar
    const _saveBooksToStorage = saveBooksToStorage;
    saveBooksToStorage = function (books) {
        _saveBooksToStorage(books);
        // não tentamos sincronizar tudo aqui (pode ser pesado)
    };

    // Para pontos específicos onde gravamos (criação, edição, empréstimo, devolução)
    // já existem chamadas a saveBooksToStorage em código anterior; vamos chamar API nas localizações apropriadas

    // -> adaptamos o handler de submit para chamar a API (após salvar) adicionando listeners
    // (observe que o submit handler já foi sobrescrito anteriormente; aqui anexamos um listener para sincronizar)
    bookForm.addEventListener('submit', async (e) => {
        // delay para aguardar que o handler principal processe e salve em localStorage
        await new Promise(r => setTimeout(r, 100));
        const editingId = document.getElementById('livro-id')?.value || '';
        const books = loadBooksFromStorage();
        if (editingId) {
            const book = books.find(b => b.id === editingId || b.isbn === editingId || b.titulo === editingId);
            if (book) await apiUpdateBook(book);
        } else {
            // assume que o último inserido é o novo
            const book = books[0];
            if (book) await apiCreateBook(book);
        }
    });

    // sincronizar exclusão no card (adicionada anteriormente) - delegação global
    document.addEventListener('click', async (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('button-delete')) {
            // after local deletion occurs in handler, wait a bit and sync
            await new Promise(r => setTimeout(r, 150));
            // try to find book in dataset of button
            const forId = e.target.dataset.forId;
            const books = loadBooksFromStorage();
            // if not found, maybe it was deleted -> try to inform server using the forId by building a dummy
            const book = books.find(b => (b.id === forId) || (b.isbn === forId) || (b.titulo === forId));
            if (book) {
                await apiDeleteBook(book);
            } else {
                // book not found locally; attempt to inform server by using title/isbn from dataset
                // best effort: try to fetch all and delete matching
                if (window.apiEnabled && forId) {
                    try {
                        const resp = await fetch('/books/');
                        if (resp.ok) {
                            const list = await resp.json();
                            const found = list.find(s => String(s.id) === String(forId) || (s.titulo && forId && s.titulo.toLowerCase() === forId.toLowerCase()));
                            if (found) await fetch(`/books/${found.id}`, { method: 'DELETE' });
                        }
                    } catch (err) { }
                }
            }
        }
    });

    // sincronizar empréstimo/devolução: adicionamos chamadas logo após os pontos onde book.status é alterado
    // já nos handlers confirmarEmprestimoBtn/confirmarDevolucaoBtn, vamos chamar apiBorrowBook/apiReturnBook
    if (confirmarEmprestimoBtn) {
        confirmarEmprestimoBtn.addEventListener('click', async () => {
            // after local processing, wait shortly and sync
            await new Promise(r => setTimeout(r, 150));
            const sel = document.getElementById('livro-emprestimo');
            const id = sel?.value;
            const books = loadBooksFromStorage();
            const book = books.find(b => (b.id === id) || (b.isbn === id) || (b.titulo === id));
            if (book) await apiBorrowBook(book);
        });
    }

    if (confirmarDevolucaoBtn) {
        confirmarDevolucaoBtn.addEventListener('click', async () => {
            await new Promise(r => setTimeout(r, 150));
            const sel = document.getElementById('livro-emprestimo');
            const id = sel?.value;
            const books = loadBooksFromStorage();
            const book = books.find(b => (b.id === id) || (b.isbn === id) || (b.titulo === id));
            if (book) await apiReturnBook(book);
        });
    }

    // --- fim API sync ---

    // Inicial → abre Catálogo (não Gerenciar!)
    // Ao carregar, mantenha todas as seções fechadas e só abra ao clicar em abas
    document.getElementById('sec-catalogo').hidden = true;
    document.getElementById('sec-gerenciar').hidden = true;
    document.getElementById('sec-relatorios').hidden = true;

    // Abrir catálogo por padrão ao final da inicialização
    mostrarSecao('sec-catalogo');

    document.getElementById('nav-catalogo').onclick = () => {
        mostrarSecao('sec-catalogo');
        applyFiltersAndRender(1);
    };
    document.getElementById('nav-gerenciar').onclick = () => {
        mostrarSecao('sec-gerenciar');
    };
    document.getElementById('nav-relatorios').onclick = () => {
        mostrarSecao('sec-relatorios');
        // atualizar estatísticas básicas
        updateReports();
    };

    // Adiciona handlers para filtros e busca
    document.getElementById('aplicar-filtros')?.addEventListener('click', () => applyFiltersAndRender(1));
    document.getElementById('limpar-filtros')?.addEventListener('click', () => {
        document.getElementById('filter-genre').value = '';
        document.getElementById('filter-year').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('search-bar').value = '';
        applyFiltersAndRender(1);
    });
    document.getElementById('search-bar')?.addEventListener('input', () => applyFiltersAndRender(1));

    // Abrir modal Novo Livro pelo botão
    // (duplicata removida — referências já inicializadas anteriormente)

    // Abrir modal de empréstimo pelo botão na UI (se presente)
    // (duplicata removida — referência já inicializada anteriormente)

    // Ferramenta de relatórios (export CSV/JSON)
    document.getElementById('export-csv')?.addEventListener('click', () => {
        const items = window.livros || loadBooksFromStorage();
        const csv = toCSV(items);
        downloadBlob(csv, 'books.csv', 'text/csv');
    });
    document.getElementById('export-json')?.addEventListener('click', () => {
        const items = window.livros || loadBooksFromStorage();
        const json = JSON.stringify(items, null, 2);
        downloadBlob(json, 'books.json', 'application/json');
    });

    function toCSV(items) {
        if (!items || !items.length) return '';
        const keys = ['id','titulo','autor','ano','paginas','genero','isbn','status','data_emprestimo'];
        const rows = [keys.join(',')];
        items.forEach(it => {
            rows.push(keys.map(k => `"${String(it[k] ?? '')}"`).join(','));
        });
        return rows.join('\n');
    }

    function downloadBlob(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // Estatísticas simples para Relatórios
    function updateReports() {
        const all = loadBooksFromStorage();
        document.getElementById('total-livros').textContent = all.length;
        document.getElementById('livros-disponiveis').textContent = all.filter(b => String(b.status).toLowerCase().includes('disp')).length;
        document.getElementById('livros-emprestados').textContent = all.filter(b => String(b.status).toLowerCase().includes('emprest')).length;
        const byGenre = all.reduce((acc, b) => {
            const g = b.genero || 'Outro';
            acc[g] = (acc[g] || 0) + 1;
            return acc;
        }, {});
        const ul = document.getElementById('livros-por-genero');
        ul.innerHTML = '';
        Object.keys(byGenre).forEach(k => {
            const li = document.createElement('li');
            li.textContent = `${k}: ${byGenre[k]}`;
            ul.appendChild(li);
        });

        // Relatório detalhado de empréstimos: listar todos os livros que já foram emprestados (history.length > 0)
        let container = document.getElementById('rel-emprestados');
        if (!container) {
            container = document.createElement('div');
            container.id = 'rel-emprestados';
            container.style.marginTop = '16px';
            const reportSection = document.getElementById('report-output');
            reportSection.appendChild(container);
        }
        container.innerHTML = '<h3>Livros com histórico de Empréstimos</h3>';

        const emprestados = all.filter(b => Array.isArray(b.history) && b.history.length > 0);
        if (!emprestados.length) {
            container.innerHTML += '<p>Nenhum empréstimo registrado ainda.</p>';
            return;
        }

        const formatDate = (iso) => {
            if (!iso) return '-';
            try { const d = new Date(iso); return d.toLocaleDateString(); } catch (e) { return iso; }
        };

        emprestados.forEach(book => {
            const card = document.createElement('div');
            card.className = 'report-book-card';
            card.style.display = 'flex';
            card.style.marginBottom = '12px';
            card.style.border = '1px solid #ddd';
            card.style.padding = '10px';
            card.style.borderRadius = '6px';

            const capa = document.createElement('img');
            capa.src = book.capa || 'https://via.placeholder.com/80x120?text=Livro';
            capa.alt = book.titulo;
            capa.style.width = '80px';
            capa.style.height = '120px';
            capa.style.objectFit = 'cover';
            capa.style.marginRight = '12px';
            card.appendChild(capa);

            const right = document.createElement('div');
            right.style.flex = '1';

            const title = document.createElement('h4');
            title.textContent = `${book.titulo} — ${book.autor || ''}`;
            right.appendChild(title);

            // tabela de histórico
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Nome do usuário</th>
                        <th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Data de empréstimo</th>
                        <th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Data prevista de devolução</th>
                        <th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Data de devolução</th>
                        <th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Status</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');

            book.history.slice().reverse().forEach(entry => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding:6px; border-bottom:1px solid #eee;">${entry.nome || '-'}</td>
                    <td style="padding:6px; border-bottom:1px solid #eee;">${formatDate(entry.data_emprestimo)}</td>
                    <td style="padding:6px; border-bottom:1px solid #eee;">${formatDate(entry.data_prev_devolucao)}</td>
                    <td style="padding:6px; border-bottom:1px solid #eee;">${formatDate(entry.data_devolucao)}</td>
                    <td style="padding:6px; border-bottom:1px solid #eee; font-weight:600;"></td>
                `;
                const statusCell = tr.querySelector('td:last-child');
                // determina se atrasado
                let atrasado = false;
                const now = new Date();
                if (!entry.data_devolucao) {
                    // não devolvido ainda
                    if (entry.data_prev_devolucao) {
                        const due = new Date(entry.data_prev_devolucao);
                        if (now > due) atrasado = true;
                    }
                    statusCell.textContent = atrasado ? 'Atrasado' : 'No prazo';
                    statusCell.style.color = atrasado ? '#c00' : '#090';
                } else {
                    // já devolvido: comparar data_devolucao (real) com data_prev_devolucao
                    if (entry.data_prev_devolucao) {
                        const due = new Date(entry.data_prev_devolucao);
                        const real = new Date(entry.data_devolucao);
                        atrasado = real > due;
                    }
                    statusCell.textContent = atrasado ? 'Atrasado' : 'Devolvido no prazo';
                    statusCell.style.color = atrasado ? '#c00' : '#090';
                }

                tbody.appendChild(tr);
            });

            right.appendChild(table);
            card.appendChild(right);
            container.appendChild(card);
        });
    }

    // Inicialização
    ensureCatalogControls();
    applyFiltersAndRender(1);

});
