class FinanceApp {
    constructor() {
        this.currentPeriodo = null;
        this.currentTransacao = null;
        this.periodos = [];
        this.tiposTransacao = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Dashboard
        if (document.getElementById('btnTransacoes')) {
            document.getElementById('btnTransacoes').addEventListener('click', () => {
                window.location.href = '/transacoes';
            });
            
            document.getElementById('selectPeriodo').addEventListener('change', (e) => {
                this.updateDashboard(e.target.value);
            });
        }

        // Transações
        if (document.getElementById('btnFecharPeriodo')) {
            document.getElementById('btnFecharPeriodo').addEventListener('click', () => {
                this.closeModal('modalPeriodo');
            });
            
            document.getElementById('btnNovaTransacao').addEventListener('click', () => {
                this.openNovaTransacao();
            });
            
            document.getElementById('btnFecharTransacao').addEventListener('click', () => {
                this.confirmCloseTransacao();
            });
            
            document.getElementById('btnEditarTransacao').addEventListener('click', () => {
                this.enableEditTransacao();
            });
            
            document.getElementById('btnSalvarTransacao').addEventListener('click', () => {
                this.salvarTransacao();
            });
            
            document.getElementById('btnFecharRegistro').addEventListener('click', () => {
                this.closeModal('modalRegistro');
            });
            
            document.getElementById('btnSalvarNovaTransacao').addEventListener('click', () => {
                this.salvarNovaTransacao();
            });

            // Event listeners para campos vinculados
            document.getElementById('transacaoTipo').addEventListener('change', (e) => {
                this.carregarNomesTransacao(e.target.value, 'transacaoNome', 'transacaoCategoria');
            });
            
            document.getElementById('transacaoNome').addEventListener('change', (e) => {
                this.atualizarCategoria(e.target.value, 'transacaoCategoria');
            });
            
            document.getElementById('novoTipo').addEventListener('change', (e) => {
                this.carregarNomesTransacao(e.target.value, 'novoNome', 'novoCategoria');
            });
            
            document.getElementById('novoNome').addEventListener('change', (e) => {
                this.atualizarCategoria(e.target.value, 'novoCategoria');
            });

            // Formatação de valor
            document.getElementById('transacaoValor').addEventListener('blur', (e) => {
                e.target.value = this.formatarValor(e.target.value);
            });
            
            document.getElementById('novoValor').addEventListener('blur', (e) => {
                e.target.value = this.formatarValor(e.target.value);
            });
        }
    }

    async loadInitialData() {
        if (window.location.pathname === '/transacoes') {
            await this.carregarPeriodos();
        } else {
            await this.carregarPeriodosDashboard();
        }
    }

    async carregarPeriodos() {
        this.showLoader();
        try {
            const response = await fetch('/api/periodos');
            this.periodos = await response.json();
            this.renderPeriodos();
        } catch (error) {
            console.error('Erro ao carregar períodos:', error);
            alert('Erro ao carregar períodos');
        } finally {
            this.hideLoader();
        }
    }

    async carregarPeriodosDashboard() {
        try {
            const response = await fetch('/api/periodos-todos');
            const periodos = await response.json();
            this.renderPeriodosSelect(periodos);
            
            if (periodos.length > 0) {
                const periodoAberto = periodos.find(p => this.getPeriodoStatus(p) === 'ABERTO') || periodos[0];
                
                // CORREÇÃO: AGUARDAR O SELECT SER RENDERIZADO ANTES DE ATUALIZAR O DASHBOARD
                setTimeout(() => {
                    document.getElementById('selectPeriodo').value = periodoAberto.id;
                    this.updateDashboard(periodoAberto.id);
                }, 100);
            }
        } catch (error) {
            console.error('Erro ao carregar períodos:', error);
        }
    }

    renderPeriodos() {
        const tbody = document.getElementById('tabelaPeriodos');
        tbody.innerHTML = '';

        this.periodos.forEach(periodo => {
            const status = this.getPeriodoStatus(periodo);
            const tr = document.createElement('tr');
            if (status === 'ABERTO') {
                tr.classList.add('periodo-aberto');
            }
            
            tr.innerHTML = `
                <td>
                    <button class="btn-abrir" onclick="app.abrirPeriodo(${periodo.id})">
                        📋
                    </button>
                </td>
                <td>${periodo.nome_periodo}</td>
                <td class="status-${status.toLowerCase()}">${status}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderPeriodosSelect(periodos) {
        const select = document.getElementById('selectPeriodo');
        select.innerHTML = '';
        
        periodos.forEach(periodo => {
            const option = document.createElement('option');
            option.value = periodo.id;
            option.textContent = periodo.nome_periodo;
            if (this.getPeriodoStatus(periodo) === 'ABERTO') {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    getPeriodoStatus(periodo) {
        const hoje = new Date();
        const dtAbertura = new Date(periodo.dt_abertura);
        const dtFechamento = new Date(periodo.dt_fechamento);
        
        if (dtAbertura > hoje) return 'FUTURO';
        if (dtFechamento < hoje) return 'ENCERRADO';
        if (dtAbertura <= hoje && dtFechamento >= hoje) return 'ABERTO';
        return 'ENCERRADO';
    }

    async abrirPeriodo(periodoId) {
        this.showLoader();
        try {
            const periodo = this.periodos.find(p => p.id === periodoId);
            this.currentPeriodo = periodo;
            
            await this.carregarTransacoes(periodoId);
            
            document.getElementById('modalPeriodoTitulo').textContent = 
                `Transações do Período ${periodo.nome_periodo}`;
            
            this.openModal('modalPeriodo');
        } catch (error) {
            console.error('Erro ao abrir período:', error);
            alert('Erro ao carregar transações');
        } finally {
            this.hideLoader();
        }
    }

    async carregarTransacoes(periodoId) {
        const response = await fetch(`/api/transacoes/${periodoId}`);
        const transacoes = await response.json();
        this.renderTransacoes(transacoes);
    }

    renderTransacoes(transacoes) {
        const tbody = document.getElementById('tabelaTransacoes');
        tbody.innerHTML = '';

        transacoes.forEach(transacao => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <button class="btn-abrir" onclick="app.abrirTransacao(${transacao.id})">
                        📋
                    </button>
                </td>
                <td>${transacao.nm_trans}</td>
                <td class="valor-${transacao.tp_trans.toLowerCase()}">
                    ${this.formatarMoeda(transacao.valor_trans)}
                </td>
                <td>${transacao.status_trans}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    async abrirTransacao(transacaoId) {
        this.showLoader();
        try {
            // Buscar transação específica (simulação - na prática buscaríamos da lista já carregada)
            const transacoesResponse = await fetch(`/api/transacoes/${this.currentPeriodo.id}`);
            const transacoes = await transacoesResponse.json();
            this.currentTransacao = transacoes.find(t => t.id === transacaoId);
            
            this.preencherFormTransacao();
            this.openModal('modalTransacao');
        } catch (error) {
            console.error('Erro ao abrir transação:', error);
            alert('Erro ao carregar transação');
        } finally {
            this.hideLoader();
        }
    }

    preencherFormTransacao() {
        const transacao = this.currentTransacao;
        document.getElementById('transacaoPeriodo').value = this.currentPeriodo.nome_periodo;
        document.getElementById('transacaoTipo').value = transacao.tp_trans;
        document.getElementById('transacaoRecorrencia').value = transacao.recorrencia_trans;
        document.getElementById('transacaoValor').value = this.formatarMoeda(transacao.valor_trans);
        const dataTransacao = new Date(transacao.dt_trans);
        document.getElementById('transacaoData').value = dataTransacao.toISOString().split('T')[0];
        document.getElementById('transacaoStatus').value = transacao.status_trans;
        document.getElementById('transacaoDescricao').value = transacao.desc_trans || '';
        
        // Carregar nomes de transação e selecionar o atual
        this.carregarNomesTransacao(transacao.tp_trans, 'transacaoNome', 'transacaoCategoria', transacao.id_nome_trans);

        // GARANTIR QUE TODOS OS CAMPOS ESTEJAM DESABILITADOS INICIALMENTE
        this.desabilitarEdicaoTransacao();
    }

    desabilitarEdicaoTransacao() {
        const campos = ['transacaoTipo', 'transacaoNome', 'transacaoRecorrencia', 'transacaoValor', 'transacaoData', 'transacaoStatus', 'transacaoDescricao'];
        campos.forEach(campo => {
            document.getElementById(campo).disabled = true;
        });
        document.getElementById('btnSalvarTransacao').style.display = 'none';
    }


    async carregarNomesTransacao(tipo, selectId, categoriaId, selectedId = null) {
        const select = document.getElementById(selectId);
        const categoria = document.getElementById(categoriaId);
        
        if (!tipo) {
            select.innerHTML = '<option value="">Selecione o tipo primeiro</option>';
            select.disabled = true;
            categoria.value = '';
            return;
        }

        this.showLoader();
        try {
            const response = await fetch(`/api/tipos-transacao/${tipo}`);
            const tipos = await response.json();
            
            select.innerHTML = '<option value="">Selecione uma opção</option>';
            tipos.forEach(tipoItem => {
                const option = document.createElement('option');
                option.value = tipoItem.id;
                option.textContent = tipoItem.nm_trans;
                option.dataset.categoria = tipoItem.cat_trans;
                if (selectedId === tipoItem.id) {
                    option.selected = true;
                    // CORREÇÃO: ATUALIZAR CATEGORIA IMEDIATAMENTE
                    categoria.value = tipoItem.cat_trans;
                }
                select.appendChild(option);
            });
            
            // CORREÇÃO: MANTER O CAMPO DESABILITADO SE FOR O MODAL DE TRANSAÇÃO (NÃO DE REGISTRO)
            if (selectId === 'transacaoNome') {
                select.disabled = true; // Sempre desabilitado no modal de transação até editar
            } else {
                select.disabled = false; // Habilitado no modal de registro
            }
            
            // CORREÇÃO: SE NÃO HÁ SELECTEDID, ATUALIZAR CATEGORIA COM A PRIMEIRA OPÇÃO QUANDO MUDAR
            if (!selectedId && tipos.length > 0) {
                // Adicionar event listener para atualizar categoria quando selecionar
                select.addEventListener('change', () => {
                    const selectedOption = select.options[select.selectedIndex];
                    if (selectedOption && selectedOption.dataset.categoria) {
                        categoria.value = selectedOption.dataset.categoria;
                    }
                });
                
                // Atualizar com a primeira opção se disponível
                if (select.options.length > 1) {
                    categoria.value = select.options[1].dataset.categoria;
                }
            }
        } catch (error) {
            console.error('Erro ao carregar tipos:', error);
            select.innerHTML = '<option value="">Erro ao carregar opções</option>';
        } finally {
            this.hideLoader();
        }
    }

    atualizarCategoria(selectedId, categoriaId) {
        const select = document.getElementById('transacaoNome') || document.getElementById('novoNome');
        const categoria = document.getElementById(categoriaId);
        
        if (select && selectedId) {
            const option = select.querySelector(`option[value="${selectedId}"]`);
            if (option && option.dataset.categoria) {
                categoria.value = option.dataset.categoria;
            }
        } else {
            categoria.value = '';
        }
    }

    enableEditTransacao() {
        if (this.getPeriodoStatus(this.currentPeriodo) === 'ENCERRADO') {
            alert('Não é possível editar transações de períodos encerrados');
            return;
        }

        const campos = ['transacaoTipo', 'transacaoNome', 'transacaoRecorrencia', 'transacaoValor', 'transacaoData', 'transacaoStatus', 'transacaoDescricao'];
        campos.forEach(campo => {
            document.getElementById(campo).disabled = false;
        });
        
        document.getElementById('btnSalvarTransacao').style.display = 'block';
    }

    async salvarTransacao() {
        const formData = {
            tp_trans: document.getElementById('transacaoTipo').value,
            id_nome_trans: document.getElementById('transacaoNome').value,
            recorrencia_trans: document.getElementById('transacaoRecorrencia').value,
            valor_trans: this.parseValor(document.getElementById('transacaoValor').value),
            dt_trans: document.getElementById('transacaoData').value,
            status_trans: document.getElementById('transacaoStatus').value,
            desc_trans: document.getElementById('transacaoDescricao').value
        };

        // Validações
        if (!this.validarTransacao(formData)) {
            return;
        }

        this.showLoader();
        try {
            const response = await fetch(`/api/transacoes/${this.currentTransacao.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('Transação atualizada com sucesso');
                this.closeModal('modalTransacao');
                await this.carregarTransacoes(this.currentPeriodo.id);
            } else {
                throw new Error('Erro ao salvar transação');
            }
        } catch (error) {
            console.error('Erro ao salvar transação:', error);
            alert('Erro ao salvar transação');
        } finally {
            this.hideLoader();
        }
    }

    openNovaTransacao() {
        if (this.getPeriodoStatus(this.currentPeriodo) === 'ENCERRADO') {
            alert('Não é possível criar transações em períodos encerrados');
            return;
        }

        // Limpar e preencher o formulário
        document.getElementById('formNovaTransacao').reset();
        document.getElementById('novoPeriodo').value = this.currentPeriodo.nome_periodo;
        document.getElementById('novoNome').disabled = true;
        document.getElementById('novoCategoria').value = '';
        
        // Definir data atual como padrão
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('novoData').value = hoje;
        
        // Definir status padrão como PREVISTO
        document.getElementById('novoStatus').value = 'PREVISTO';
        
        this.openModal('modalRegistro');
    }

    async salvarNovaTransacao() {
        const formData = {
            id_periodo: this.currentPeriodo.id,
            tp_trans: document.getElementById('novoTipo').value,
            id_nome_trans: document.getElementById('novoNome').value,
            recorrencia_trans: document.getElementById('novoRecorrencia').value,
            valor_trans: this.parseValor(document.getElementById('novoValor').value),
            dt_trans: document.getElementById('novoData').value,
            status_trans: document.getElementById('novoStatus').value,
            desc_trans: document.getElementById('novoDescricao').value
        };

        // Validações
        if (!this.validarTransacao(formData)) {
            return;
        }

        this.showLoader();
        try {
            const response = await fetch('/api/transacoes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('Transação criada com sucesso');
                this.closeModal('modalRegistro');
                await this.carregarTransacoes(this.currentPeriodo.id);
            } else {
                throw new Error('Erro ao criar transação');
            }
        } catch (error) {
            console.error('Erro ao criar transação:', error);
            alert('Erro ao criar transação');
        } finally {
            this.hideLoader();
        }
    }

    validarTransacao(formData) {
        if (!formData.tp_trans || !formData.id_nome_trans || !formData.recorrencia_trans || 
            !formData.valor_trans || !formData.dt_trans || !formData.status_trans) {
            alert('Todos os campos obrigatórios devem ser preenchidos');
            return false;
        }

        if (formData.valor_trans <= 0) {
            alert('O valor deve ser maior que zero');
            return false;
        }

        return true;
    }

    confirmCloseTransacao() {
        if (confirm('Deseja fechar? Nenhuma alteração será salva.')) {
            this.closeModal('modalTransacao');
        }
    }

    async updateDashboard(periodoId) {
        this.showLoader();
        try {
            const response = await fetch(`/api/dashboard/${periodoId}`);
            const data = await response.json();
            
            document.getElementById('valorEntradas').textContent = this.formatarMoeda(data.entradas);
            document.getElementById('valorSaidas').textContent = this.formatarMoeda(data.saidas);
            
            const saldoElement = document.getElementById('valorSaldo');
            saldoElement.textContent = this.formatarMoeda(data.saldo);
            
            const saldoCard = document.querySelector('.card-saldo');
            saldoCard.classList.remove('positivo', 'negativo');
            saldoCard.classList.add(data.saldo >= 0 ? 'positivo' : 'negativo');
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
        } finally {
            this.hideLoader();
        }
    }

    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    formatarValor(valor) {
        // Remove tudo que não é número, ponto ou vírgula
        let cleaned = valor.replace(/[^\d,.]/g, '');
        
        // Substitui vírgula por ponto para cálculo
        let numericValue = cleaned.replace(',', '.');
        
        // Converte para número e formata como moeda
        let number = parseFloat(numericValue);
        if (isNaN(number)) return 'R$ 0,00';
        
        return this.formatarMoeda(number);
    }

    parseValor(valorFormatado) {
        // Remove "R$" e espaços, substitui vírgula por ponto
        let cleaned = valorFormatado.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        return parseFloat(cleaned);
    }

    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        document.getElementById(modalId).scrollTop = 0;
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'none';
        modal.scrollTop = 0;
        
        // Resetar formulários quando fechar
        if (modalId === 'modalTransacao') {
            document.getElementById('btnSalvarTransacao').style.display = 'none';
            const campos = ['transacaoTipo', 'transacaoNome', 'transacaoRecorrencia', 'transacaoValor', 'transacaoData', 'transacaoStatus', 'transacaoDescricao'];
            campos.forEach(campo => {
                document.getElementById(campo).disabled = true;
            });
        }
    }

    showLoader() {
        document.getElementById('loader').style.display = 'flex';
    }

    hideLoader() {
        document.getElementById('loader').style.display = 'none';
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinanceApp();
});