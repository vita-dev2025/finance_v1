class ModalPeriodo {
    constructor(periodoId) {
        this.periodoId = periodoId;
        this.periodo = null;
        this.transacoes = [];
        this.init();
    }

    async init() {
        await this.carregarPeriodo();
        await this.carregarTransacoes();
        this.renderizar();
        this.configurarEventos();
    }

    async carregarPeriodo() {
        try {
            this.periodo = await database.getPeriodo(this.periodoId);
        } catch (error) {
            mostrarMensagem('Erro ao carregar período', 'erro');
        }
    }

    async carregarTransacoes() {
        try {
            this.transacoes = await database.getTransacoesPorPeriodo(this.periodoId);
        } catch (error) {
            mostrarMensagem('Erro ao carregar transações', 'erro');
        }
    }

    renderizar() {
        const modal = document.getElementById('modalPeriodo');
        const status = this.obterStatusPeriodo(this.periodo);
        
        // Atualizar título
        document.getElementById('modalPeriodoTitulo').textContent = 
            `Transações do Período ${this.periodo.nome_periodo} - ${status}`;

        // Renderizar transações
        this.renderizarTransacoes();

        // Mostrar modal
        modal.classList.remove('hidden');
        this.resetarScroll();
    }

    renderizarTransacoes() {
        const container = document.getElementById('listaTransacoes');
        
        if (this.transacoes.length === 0) {
            container.innerHTML = '<p class="mensagem alerta">Nenhuma transação encontrada para este período.</p>';
            return;
        }

        container.innerHTML = this.transacoes.map(transacao => {
            const valorClass = transacao.tp_trans === 'ENTRADA' ? 'entrada' : 'saida';
            
            return `
                <div class="transacao-item">
                    <button class="btn-abrir" onclick="modalPeriodoAtual.abrirTransacao(${transacao.id})" title="Abrir transação">
                        📋
                    </button>
                    <div class="transacao-info">
                        <strong>${transacao.nm_trans}</strong>
                        <small>${transacao.cat_trans}</small>
                    </div>
                    <div class="valor-transacao ${valorClass}">
                        ${formatarMoeda(transacao.valor_trans)}
                    </div>
                    <div class="status">
                        ${transacao.status_trans}
                    </div>
                </div>
            `;
        }).join('');
    }

    obterStatusPeriodo(periodo) {
        const hoje = new Date();
        const dtFechamento = new Date(periodo.dt_fechamento);
        
        return dtFechamento < hoje ? 'ENCERRADO' : 'ABERTO';
    }

    configurarEventos() {
        document.getElementById('btnNovaTransacao').onclick = () => this.novaTransacao();
        document.getElementById('btnFecharPeriodo').onclick = () => this.fechar();
    }

    abrirTransacao(transacaoId) {
        this.fechar();
        const modalTransacao = new ModalTransacao(transacaoId);
        modalTransacao.abrir();
    }

    novaTransacao() {
        const status = this.obterStatusPeriodo(this.periodo);
        if (status === 'ENCERRADO') {
            mostrarMensagem('Não é possível criar transações em períodos encerrados', 'erro');
            return;
        }

        this.fechar();
        const modalRegistro = new ModalRegistro(this.periodoId);
        modalRegistro.abrir();
    }

    fechar() {
        const modal = document.getElementById('modalPeriodo');
        modal.classList.add('hidden');
        this.resetarScroll();
    }

    resetarScroll() {
        const modalBody = document.querySelector('#modalPeriodo .modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    }
}

// Variável global para acessar a instância atual
let modalPeriodoAtual = null;

// Atualizar a função global para abrir modal de período
function abrirModalPeriodo(periodoId) {
    modalPeriodoAtual = new ModalPeriodo(periodoId);
}