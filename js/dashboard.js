class Dashboard {
    constructor() {
        this.periodoSelecionado = null;
        this.init();
    }

    async init() {
        await this.carregarPeriodos();
        this.configurarEventos();
        await this.carregarResumo();
    }

    async carregarPeriodos() {
        try {
            mostrarLoader();
            const periodos = await database.getPeriodos();
            this.preencherFiltroPeriodos(periodos);
            
            // Selecionar o período mais recente por padrão
            if (periodos.length > 0) {
                this.periodoSelecionado = periodos[0].id;
                await this.carregarResumo();
            }
        } catch (error) {
            mostrarMensagem('Erro ao carregar períodos', 'erro');
        } finally {
            esconderLoader();
        }
    }

    preencherFiltroPeriodos(periodos) {
        const select = document.getElementById('periodoFiltro');
        select.innerHTML = '';
        
        periodos.forEach(periodo => {
            const option = document.createElement('option');
            option.value = periodo.id;
            option.textContent = periodo.nome_periodo;
            select.appendChild(option);
        });
    }

    configurarEventos() {
        // Filtro de período
        document.getElementById('periodoFiltro').addEventListener('change', (e) => {
            this.periodoSelecionado = e.target.value;
            this.carregarResumo();
        });

        // Botão Transações
        document.getElementById('btnTransacoes').addEventListener('click', () => {
            window.location.href = 'transacoes.html';
        });
    }

    async carregarResumo() {
        if (!this.periodoSelecionado) return;

        try {
            mostrarLoader();
            const resumo = await database.getResumoPeriodo(this.periodoSelecionado);
            this.atualizarResumo(resumo);
        } catch (error) {
            mostrarMensagem('Erro ao carregar resumo', 'erro');
        } finally {
            esconderLoader();
        }
    }

    atualizarResumo(resumo) {
        // Entradas
        const elemEntradas = document.getElementById('valorEntradas');
        elemEntradas.textContent = formatarMoeda(resumo.entradas);

        // Saídas
        const elemSaidas = document.getElementById('valorSaidas');
        elemSaidas.textContent = formatarMoeda(resumo.saidas);

        // Saldo
        const elemSaldo = document.getElementById('valorSaldo');
        elemSaldo.textContent = formatarMoeda(resumo.saldo);
        
        // Aplicar estilo para saldo negativo
        const caixaSaldo = document.querySelector('.caixa.saldo');
        if (resumo.saldo < 0) {
            caixaSaldo.classList.add('negativo');
        } else {
            caixaSaldo.classList.remove('negativo');
        }
    }
}

// Inicializar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});