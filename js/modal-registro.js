class ModalRegistro {
    constructor(periodoId) {
        this.periodoId = periodoId;
        this.periodo = null;
        this.tiposTransacao = {};
        this.init();
    }

    async init() {
        await this.carregarPeriodo();
        await this.carregarTiposTransacao();
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

    async carregarTiposTransacao() {
        try {
            const [entradas, saidas] = await Promise.all([
                database.getTiposTransacao('entrada'),
                database.getTiposTransacao('saida')
            ]);
            
            this.tiposTransacao = {
                ENTRADA: entradas,
                SAÍDA: saidas
            };
        } catch (error) {
            console.error('Erro ao carregar tipos de transação:', error);
        }
    }

    renderizar() {
        const form = document.getElementById('formRegistro');
        
        form.innerHTML = `
            <div class="form-group">
                <label>Período:</label>
                <input type="text" value="${this.periodo.nome_periodo}" readonly>
            </div>
            
            <div class="form-group">
                <label>Tipo da Transação:</label>
                <select id="tpTransacaoRegistro">
                    <option value="">Selecione o tipo</option>
                    <option value="ENTRADA">ENTRADA</option>
                    <option value="SAÍDA">SAÍDA</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Nome da Transação:</label>
                <select id="nomeTransacaoRegistro">
                    <option value="">Selecione o tipo primeiro</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Categoria da Transação:</label>
                <input type="text" id="categoriaTransacaoRegistro" readonly>
            </div>
            
            <div class="form-group">
                <label>Recorrência da Transação:</label>
                <select id="recorrenciaTransacaoRegistro">
                    <option value="">Selecione</option>
                    <option value="Fixo">Fixo</option>
                    <option value="Variável">Variável</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Valor da Transação:</label>
                <input type="text" id="valorTransacaoRegistro" placeholder="R$ 0,00">
            </div>
            
            <div class="form-group">
                <label>Data da Transação:</label>
                <input type="date" id="dataTransacaoRegistro">
            </div>
            
            <div class="form-group">
                <label>Status da Transação:</label>
                <select id="statusTransacaoRegistro">
                    <option value="PREVISTO">PREVISTO</option>
                    <option value="OK">OK</option>
                    <option value="CANCELADO">CANCELADO</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Descrição da Transação:</label>
                <textarea id="descricaoTransacaoRegistro" placeholder="Descrição opcional"></textarea>
            </div>
        `;

        // Definir data atual como padrão
        document.getElementById('dataTransacaoRegistro').value = new Date().toISOString().split('T')[0];

        // Mostrar modal
        const modal = document.getElementById('modalRegistro');
        modal.classList.remove('hidden');
        this.resetarScroll();
    }

    configurarEventos() {
        document.getElementById('btnSalvarRegistro').onclick = () => this.salvar();
        document.getElementById('btnFecharRegistro').onclick = () => this.fechar();
        
        // Eventos para atualização em tempo real
        document.getElementById('tpTransacaoRegistro').addEventListener('change', (e) => this.atualizarNomesTransacao(e.target.value));
        document.getElementById('nomeTransacaoRegistro').addEventListener('change', (e) => this.atualizarCategoria(e.target.value));
        
        // Formatação de moeda
        document.getElementById('valorTransacaoRegistro').addEventListener('input', (e) => this.formatarMoeda(e.target));
    }

    async atualizarNomesTransacao(tipo) {
        if (!tipo) {
            document.getElementById('nomeTransacaoRegistro').innerHTML = '<option value="">Selecione o tipo primeiro</option>';
            return;
        }

        try {
            const opcoes = this.tiposTransacao[tipo] || [];
            const select = document.getElementById('nomeTransacaoRegistro');
            
            select.innerHTML = '<option value="">Selecione uma opção</option>' + 
                opcoes.map(opcao => `
                    <option value="${opcao.id}">${opcao.nm_trans}</option>
                `).join('');
        } catch (error) {
            console.error('Erro ao atualizar nomes de transação:', error);
        }
    }

    async atualizarCategoria(idNomeTransacao) {
        if (!idNomeTransacao) {
            document.getElementById('categoriaTransacaoRegistro').value = '';
            return;
        }

        try {
            const opcoes = [...this.tiposTransacao.ENTRADA, ...this.tiposTransacao.SAÍDA];
            const tipoSelecionado = opcoes.find(t => t.id == idNomeTransacao);
            
            if (tipoSelecionado) {
                document.getElementById('categoriaTransacaoRegistro').value = tipoSelecionado.cat_trans;
            }
        } catch (error) {
            console.error('Erro ao atualizar categoria:', error);
        }
    }

    formatarMoeda(input) {
        let valor = input.value.replace(/\D/g, '');
        valor = (valor / 100).toFixed(2) + '';
        valor = valor.replace(".", ",");
        valor = valor.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,");
        valor = valor.replace(/(\d)(\d{3}),/g, "$1.$2,");
        input.value = 'R$ ' + valor;
    }

    async salvar() {
        if (!this.validarFormulario()) return;

        try {
            mostrarLoader();
            
            const dados = {
                id_periodo: this.periodoId,
                tp_trans: document.getElementById('tpTransacaoRegistro').value,
                id_nome_trans: parseInt(document.getElementById('nomeTransacaoRegistro').value),
                recorrencia_trans: document.getElementById('recorrenciaTransacaoRegistro').value,
                valor_trans: this.parseValor(document.getElementById('valorTransacaoRegistro').value),
                desc_trans: document.getElementById('descricaoTransacaoRegistro').value,
                dt_trans: document.getElementById('dataTransacaoRegistro').value,
                status_trans: document.getElementById('statusTransacaoRegistro').value
            };

            await database.criarTransacao(dados);
            mostrarMensagem('Transação criada com sucesso!');
            this.fechar();
        } catch (error) {
            mostrarMensagem('Erro ao criar transação', 'erro');
        } finally {
            esconderLoader();
        }
    }

    validarFormulario() {
        const camposObrigatorios = [
            'tpTransacaoRegistro', 'nomeTransacaoRegistro', 'recorrenciaTransacaoRegistro',
            'valorTransacaoRegistro', 'dataTransacaoRegistro', 'statusTransacaoRegistro'
        ];

        for (const campoId of camposObrigatorios) {
            const campo = document.getElementById(campoId);
            if (!campo.value) {
                mostrarMensagem(`O campo ${campo.previousElementSibling.textContent} é obrigatório`, 'erro');
                campo.focus();
                return false;
            }
        }

        const valor = this.parseValor(document.getElementById('valorTransacaoRegistro').value);
        if (!valor || valor <= 0) {
            mostrarMensagem('O valor da transação deve ser maior que zero', 'erro');
            return false;
        }

        return true;
    }

    parseValor(valorStr) {
        return parseFloat(valorStr.replace(/[^\d,]/g, '').replace(',', '.'));
    }

    fechar() {
        const modal = document.getElementById('modalRegistro');
        modal.classList.add('hidden');
        this.resetarScroll();
        this.limparFormulario();
    }

    resetarScroll() {
        const modalBody = document.querySelector('#modalRegistro .modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    }

    limparFormulario() {
        const form = document.getElementById('formRegistro');
        if (form) form.reset();
        
        // Restaurar data atual
        document.getElementById('dataTransacaoRegistro').value = new Date().toISOString().split('T')[0];
    }

    abrir() {
        const modal = document.getElementById('modalRegistro');
        modal.classList.remove('hidden');
        this.resetarScroll();
    }
}