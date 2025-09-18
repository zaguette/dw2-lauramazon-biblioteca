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

            // clicar no card abre uma abinha (popover) com detalhes rápidos e ações
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                abrirPopoverDetalhes(book, card);
            });

            bookGrid.appendChild(card);
        });

        renderPagination(Math.ceil(items.length / PAGE_SIZE), page);
        window.livros = items;
    }

    // --- Popover: abre uma abinha posicionada acima do card clicado ---
    let currentPopover = null;

    function abrirPopoverDetalhes(book, anchorCard) {
        closePopover();
        const pop = document.createElement('div');
        pop.className = 'popover-details';
        pop.style.position = 'absolute';
        pop.style.zIndex = 2500;
        pop.style.opacity = '0';
        pop.style.transform = 'translateY(6px)';
        pop.style.transition = 'opacity 160ms ease, transform 160ms ease';

        // alinhar largura com o card (mantendo limites para legibilidade)
        const rect = anchorCard.getBoundingClientRect();
        const desiredWidth = Math.min(Math.max(Math.round(rect.width), 240), 420);
        pop.style.width = desiredWidth + 'px';

        pop.innerHTML = `
            <div style="display:flex;gap:12px;align-items:flex-start;">
                <img src="${book.capa || 'https://via.placeholder.com/100x150?text=Livro'}" alt="Capa" style="width:88px;height:132px;object-fit:cover;border-radius:6px;flex-shrink:0;">
                <div style="flex:1;min-width:0;">
                    <h4 class="popover-title" style="margin:0 0 6px;font-size:16px;">${book.titulo}</h4>
                    <div style="font-size:13px;color:#333;margin-bottom:6px;">${book.autor || 'Autor não informado'}</div>
                    <div style="font-size:12px;color:#666;margin-bottom:6px;">Ano: ${book.ano || '-'}</div>
                    <div style="font-size:12px;color:#666;margin-bottom:8px;">Status: ${book.status || '-'}</div>
                    <div class="popover-descricao" style="margin-bottom:8px;">${(book.descricao || 'Sem descrição disponível')}</div>
                    <div style="display:flex;gap:8px;margin-top:6px;">
                        <button class="button pop-editar">Editar</button>
                        <button class="button pop-emprestar">Emprestar</button>
                        <button class="button pop-excluir" style="background:#c33;">Excluir</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(pop);

        // medir e posicionar acima do card; tentar abrir sempre acima quando houver espaço
        let popRect = pop.getBoundingClientRect();
        let left = rect.left + window.scrollX + (rect.width / 2) - (popRect.width / 2);
        left = Math.max(12 + window.scrollX, Math.min(left, window.scrollX + document.documentElement.clientWidth - popRect.width - 12));
        let top = rect.top + window.scrollY - popRect.height - 12;

        // se não houver espaço suficiente acima, tentar ajustar scroll para abrir acima
        if (top < window.scrollY + 12) {
            const need = (popRect.height + 36) - rect.top;
            if (need > 0) window.scrollBy({ top: -need, behavior: 'smooth' });
        }

        // Recalcular após qualquer rolagem/layout usando RAF
        requestAnimationFrame(() => {
            popRect = pop.getBoundingClientRect();
            let finalTop = rect.top + window.scrollY - popRect.height - 12;
            if (finalTop < window.scrollY + 12) finalTop = rect.bottom + window.scrollY + 12; // fallback abaixo
            let finalLeft = rect.left + window.scrollX + (rect.width / 2) - (popRect.width / 2);
            finalLeft = Math.max(12 + window.scrollX, Math.min(finalLeft, window.scrollX + document.documentElement.clientWidth - popRect.width - 12));

            pop.style.left = finalLeft + 'px';
            pop.style.top = finalTop + 'px';

            // calcular posição da seta relativamente ao popover
            const arrowLeft = Math.min(Math.max((rect.left + window.scrollX + rect.width / 2) - finalLeft - 7, 12), popRect.width - 24);
            pop.style.setProperty('--arrow-left', arrowLeft + 'px');

            // animação de entrada
            requestAnimationFrame(() => { pop.style.opacity = '1'; pop.style.transform = 'translateY(0)'; });
        });

        // excluir via popover
        pop.querySelector('.pop-excluir')?.addEventListener('click', (ev) => {
            ev.stopPropagation();
            if (!confirm('Tem certeza que deseja excluir este livro?')) return;
            const books = loadBooksFromStorage();
            const id = book.id || book.isbn || book.titulo;
            const idx = books.findIndex(b => (b.id === id) || (b.isbn === id) || (b.titulo === id));
            if (idx === -1) { alert('Livro não encontrado'); closePopover(); return; }
            books.splice(idx, 1);
            saveBooksToStorage(books);
            closePopover();
            applyFiltersAndRender(1);
        });

        // editar via popover
        pop.querySelector('.pop-editar')?.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const books = loadBooksFromStorage();
            const id = book.id || book.isbn || book.titulo;
            const bk = books.find(b => (b.id === id) || (b.isbn === id) || (b.titulo === id));
            if (!bk) { alert('Livro não encontrado'); closePopover(); return; }
            document.getElementById('livro-id').value = bk.id || '';
            document.getElementById('titulo').value = bk.titulo || '';
            document.getElementById('autor').value = bk.autor || '';
            document.getElementById('ano').value = bk.ano || '';
            document.getElementById('paginas').value = bk.paginas || '';
            document.getElementById('genero').value = bk.genero || '';
            document.getElementById('isbn').value = bk.isbn || '';
            document.getElementById('capa').value = bk.capa || '';
            document.getElementById('descricao').value = bk.descricao || '';
            document.getElementById('status').value = bk.status || 'disponível';
            closePopover();
            abrirModal(document.getElementById('modal-novo-livro'), anchorCard);
        });

        // emprestar via popover
        pop.querySelector('.pop-emprestar')?.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const books = loadBooksFromStorage();
            const id = book.id || book.isbn || book.titulo;
            const bk = books.find(b => (b.id === id) || (b.isbn === id) || (b.titulo === id));
            if (!bk) { alert('Livro não encontrado'); closePopover(); return; }

            populateEmprestimoSelect(loadBooksFromStorage());
            const sel = document.getElementById('livro-emprestimo');
            if (sel) sel.value = bk.id || bk.isbn || bk.titulo || '';
            populateHistoricoEmprestimos(sel?.value);
            document.getElementById('nome-pessoa').value = '';
            document.getElementById('data-emprestimo').value = new Date().toISOString().slice(0,10);
            document.getElementById('data-devolucao').value = '';

            closePopover();
            abrirModal(modalEmprestimo, anchorCard);
        });

        currentPopover = pop;
    }

    function closePopover() {
        if (currentPopover && currentPopover.parentNode) currentPopover.parentNode.removeChild(currentPopover);
        currentPopover = null;
    }

    // fecha popover ao clicar fora
    document.addEventListener('click', (ev) => {
        if (ev.target.closest && (ev.target.closest('.popover-details') || ev.target.closest('.book-card'))) return;
        closePopover();
    });

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

    // Popular histórico de empréstimos no modal de empréstimo
    function populateHistoricoEmprestimos(bookId) {
        const ul = document.getElementById('lista-emprestimos');
        if (!ul) return;
        ul.innerHTML = '';
        const books = loadBooksFromStorage();
        const book = books.find(b => (b.id === bookId) || (b.isbn === bookId) || (b.titulo === bookId));
        if (!book || !Array.isArray(book.history) || !book.history.length) {
            ul.innerHTML = '<li>Nenhum histórico encontrado para este livro.</li>';
            return;
        }
        book.history.slice().reverse().forEach(h => {
            const li = document.createElement('li');
            li.textContent = `${h.nome || '-'} — ${new Date(h.data_emprestimo).toLocaleDateString()} -> ${h.data_devolucao ? new Date(h.data_devolucao).toLocaleDateString() : 'Ainda não devolvido'}`;
            ul.appendChild(li);
        });
    }

    // Abrir modal de empréstimo com população de select e histórico
    document.getElementById('open-emprestimo-btn')?.addEventListener('click', () => {
        const all = loadBooksFromStorage();
        populateEmprestimoSelect(all);
        // limpar campos do modal
        document.getElementById('nome-pessoa').value = '';
        document.getElementById('data-emprestimo').value = new Date().toISOString().slice(0,10);
        document.getElementById('data-devolucao').value = '';
        // limpar histórico
        const sel = document.getElementById('livro-emprestimo');
        populateHistoricoEmprestimos(sel?.value);
        abrirModal(modalEmprestimo);
    });

    // Atualiza histórico quando muda a seleção
    document.getElementById('livro-emprestimo')?.addEventListener('change', (e) => {
        populateHistoricoEmprestimos(e.target.value);
    });

    // Ajustes: ao confirmar empréstimo/devolução garantir que select esteja correto e atualizar a UI
    // Os handlers originais já fazem a lógica local; aqui apenas reforçamos a atualização de histórico/UI
    document.getElementById('confirmar-emprestimo')?.addEventListener('click', () => {
        const sel = document.getElementById('livro-emprestimo');
        const id = sel?.value;
        if (id) populateHistoricoEmprestimos(id);
        // re-popular o select para refletir novo status
        populateEmprestimoSelect(loadBooksFromStorage());
    });
    document.getElementById('confirmar-devolucao')?.addEventListener('click', () => {
        const sel = document.getElementById('livro-emprestimo');
        const id = sel?.value;
        if (id) populateHistoricoEmprestimos(id);
        populateEmprestimoSelect(loadBooksFromStorage());
    });

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

        // mostra o modal corretamente: remover atributo hidden e usar display flex
        if (modal) {
            modal.hidden = false;
            modal.style.display = 'flex';
            // dar foco para o botão editar dentro do modal
            const editarBtn = modal.querySelector('#editar-livro');
            if (editarBtn) editarBtn.focus();
        }
    }

    // Fechar/abrir modal
    function fecharModal(modalElement) {
        if (!modalElement) return;
        // ocultar de forma consistente
        modalElement.hidden = true;
        modalElement.style.display = 'none';
        // retornar foco para o botão que abriu o modal
        const addBtn = document.getElementById('add-book-btn');
        if (addBtn) addBtn.focus();
    }

    function abrirModal(modalElement, anchor) {
        if (!modalElement) return;
        // se foi fornecido um anchor, exibimos o modal como um popover posicionado acima do elemento
        if (anchor && anchor.getBoundingClientRect) {
            // limpar qualquer estado anterior
            modalElement.hidden = false;
            modalElement.style.position = 'absolute';
            modalElement.style.display = 'block';
            modalElement.style.zIndex = 2600;
            modalElement.style.maxWidth = '420px';
            modalElement.style.width = 'auto';
            modalElement.style.margin = '0';
            // centralizar a caixa em relação ao anchor e posicionar acima
            const rect = anchor.getBoundingClientRect();
            // temporariamente garantir que modal está no documento para medir
            // medir altura aproximada após forçar visibilidade
            // calcular top desejado para ficar acima do anchor
            // ajustar scroll se necessário para abrir acima
            // primeiro deixar o modal fora da tela para medir
            modalElement.style.left = '0px';
            modalElement.style.top = '0px';

            // pequena espera de layout
            requestAnimationFrame(() => {
                const mRect = modalElement.getBoundingClientRect();
                const popH = mRect.height || 220;
                let top = rect.top + window.scrollY - popH - 12;
                // se não houver espaço suficiente, rolar suavemente para abrir acima
                if (top < window.scrollY + 8) {
                    const need = (popH + 32) - rect.top;
                    window.scrollBy({ top: -need, behavior: 'smooth' });
                    // aguardar a rolagem terminar minimamente antes de posicionar
                }
                // medir de novo após possível scroll
                requestAnimationFrame(() => {
                    const mRect2 = modalElement.getBoundingClientRect();
                    const popH2 = mRect2.height || popH;
                    let finalTop = rect.top + window.scrollY - popH2 - 12;
                    if (finalTop < window.scrollY + 8) finalTop = rect.bottom + window.scrollY + 12; // fallback abaixo
                    let left = rect.left + window.scrollX + (rect.width / 2) - (mRect2.width / 2);
                    left = Math.max(8 + window.scrollX, Math.min(left, window.scrollX + document.documentElement.clientWidth - mRect2.width - 8));
                    modalElement.style.left = left + 'px';
                    modalElement.style.top = finalTop + 'px';
                });
            });

            // foco no primeiro input do modal
            const firstInput = modalElement.querySelector('input, select, textarea, button');
            if (firstInput) firstInput.focus();
            // marcar que modal foi aberto como popover
            modalElement.dataset._popover = '1';
            return;
        }

        // comportamento padrão (centralizado)
        modalElement.hidden = false;
        // se for modal overlay, usar flex para centralizar
        modalElement.style.display = 'flex';
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

    // Inicialização
    ensureCatalogControls();
    applyFiltersAndRender(1);

});
