class TransacoesPage {
    constructor() {
        this.periodos = [];
        this.init();
    }

    async init() {
        await this.carregarPeriodos();
        this.configurarEventos();
    }

    async carregarPeriodos() {
        try {
            mostrarLoader();
            this.periodos = await database.getPeriodos();
            this.renderizarPeriodos();
        } catch (error) {
            mostrarMensagem('Erro ao carregar períodos', 'erro');
        } finally {
            esconderLoader();
        }
    }

    renderizarPeriodos() {
        const container = document.getElementById('listaPeriodos');
        
        if (this.periodos.length === 0) {
            container.innerHTML = '<p class="mensagem alerta">Nenhum período encontrado.</p>';
            return;
        }

        container.innerHTML = this.periodos.map(periodo => {
            const status = this.obterStatusPeriodo(periodo);
            const statusClass = status === 'ABERTO' ? 'aberto' : 'encerrado';
            
            return `
                <div class="lista-item ${statusClass}">
                    <button class="btn-abrir" onclick="transacoesPage.abrirPeriodo(${periodo.id})" title="Abrir período">
                        📋
                    </button>
                    <div class="periodo-info">
                        <strong>${periodo.nome_periodo}</strong>
                    </div>
                    <div class="status ${statusClass}">${status}</div>
                </div>
            `;
        }).join('');
    }

    obterStatusPeriodo(periodo) {
        const hoje = new Date();
        const dtAbertura = new Date(periodo.dt_abertura);
        const dtFechamento = new Date(periodo.dt_fechamento);

        if (dtFechamento < hoje) {
            return 'ENCERRADO';
        } else if (dtAbertura <= hoje && dtFechamento >= hoje) {
            return 'ABERTO';
        } else {
            return 'NÃO INICIADO';
        }
    }

    abrirPeriodo(periodoId) {
        abrirModalPeriodo(periodoId); // Usando a função global corrigida
    }

    configurarEventos() {
        // Eventos específicos da página de transações
    }
}

// Instância global da página de transações
const transacoesPage = new TransacoesPage();