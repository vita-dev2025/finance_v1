class ModalTransacao {
    constructor(transacaoId) {
        this.transacaoId = transacaoId;
        this.transacao = null;
        this.editando = false;
        this.tiposTransacao = {};
        this.init();
    }

    async init() {
        await this.carregarTransacao();
        await this.carregarTiposTransacao();
        this.renderizar();
        this.configurarEventos();
    }

    async carregarTransacao() {
        try {
            this.transacao = await database.getTransacao(this.transacaoId);
        } catch (error) {
            mostrarMensagem('Erro ao carregar transação', 'erro');
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
        const form = document.getElementById('formTransacao');
        
        form.innerHTML = `
            <div class="form-group">
                <label>Período:</label>
                <input type="text" value="${this.transacao.nome_periodo}" readonly>
            </div>
            
            <div class="form-group">
                <label>Tipo da Transação:</label>
                <select id="tpTransacao" ${this.editando ? '' : 'readonly'}>
                    <option value="ENTRADA" ${this.transacao.tp_trans === 'ENTRADA' ? 'selected' : ''}>ENTRADA</option>
                    <option value="SAÍDA" ${this.transacao.tp_trans === 'SAÍDA' ? 'selected' : ''}>SAÍDA</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Nome da Transação:</label>
                <select id="nomeTransacao" ${this.editando ? '' : 'readonly'}>
                    ${this.renderizarOpcoesNomeTransacao()}
                </select>
            </div>
            
            <div class="form-group">
                <label>Categoria da Transação:</label>
                <input type="text" id="categoriaTransacao" value="${this.transacao.cat_trans}" readonly>
            </div>
            
            <div class="form-group">
                <label>Recorrência da Transação:</label>
                <select id="recorrenciaTransacao" ${this.editando ? '' : 'readonly'}>
                    <option value="Fixo" ${this.transacao.recorrencia_trans === 'Fixo' ? 'selected' : ''}>Fixo</option>
                    <option value="Variável" ${this.transacao.recorrencia_trans === 'Variável' ? 'selected' : ''}>Variável</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Valor da Transação:</label>
                <input type="text" id="valorTransacao" value="${formatarMoeda(this.transacao.valor_trans)}" ${this.editando ? '' : 'readonly'}>
            </div>
            
            <div class="form-group">
                <label>Data da Transação:</label>
                <input type="date" id="dataTransacao" value="${this.formatarDataParaInput(this.transacao.dt_trans)}" ${this.editando ? '' : 'readonly'}>
            </div>
            
            <div class="form-group">
                <label>Status da Transação:</label>
                <select id="statusTransacao" ${this.editando ? '' : 'readonly'}>
                    <option value="OK" ${this.transacao.status_trans === 'OK' ? 'selected' : ''}>OK</option>
                    <option value="PREVISTO" ${this.transacao.status_trans === 'PREVISTO' ? 'selected' : ''}>PREVISTO</option>
                    <option value="CANCELADO" ${this.transacao.status_trans === 'CANCELADO' ? 'selected' : ''}>CANCELADO</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Descrição da Transação:</label>
                <textarea id="descricaoTransacao" ${this.editando ? '' : 'readonly'}>${this.transacao.desc_trans || ''}</textarea>
            </div>
        `;

        // Mostrar modal
        const modal = document.getElementById('modalTransacao');
        modal.classList.remove('hidden');
        this.resetarScroll();
    }

    renderizarOpcoesNomeTransacao() {
        const tipo = this.transacao.tp_trans;
        const opcoes = this.tiposTransacao[tipo] || [];
        
        return opcoes.map(tipo => `
            <option value="${tipo.id}" ${this.transacao.id_nome_trans === tipo.id ? 'selected' : ''}>
                ${tipo.nm_trans}
            </option>
        `).join('');
    }

    formatarDataParaInput(dataString) {
        const data = new Date(dataString);
        return data.toISOString().split('T')[0];
    }

    configurarEventos() {
        document.getElementById('btnEditarTransacao').onclick = () => this.iniciarEdicao();
        document.getElementById('btnFecharTransacao').onclick = () => this.fechar();
        document.getElementById('btnSalvarTransacao').onclick = () => this.salvar();
        
        // Eventos para atualização em tempo real
        document.getElementById('tpTransacao').addEventListener('change', (e) => this.atualizarNomesTransacao(e.target.value));
        document.getElementById('nomeTransacao').addEventListener('change', (e) => this.atualizarCategoria(e.target.value));
    }

    async iniciarEdicao() {
        // Verificar se o período está aberto
        const periodo = await database.getPeriodo(this.transacao.id_periodo);
        const statusPeriodo = this.obterStatusPeriodo(periodo);
        
        if (statusPeriodo === 'ENCERRADO') {
            mostrarMensagem('Não é possível editar transações em períodos encerrados', 'erro');
            return;
        }

        this.editando = true;
        this.renderizar();
        document.getElementById('btnSalvarTransacao').classList.remove('hidden');
    }

    async atualizarNomesTransacao(tipo) {
        try {
            const opcoes = await database.getTiposTransacao(tipo.toLowerCase());
            const select = document.getElementById('nomeTransacao');
            
            select.innerHTML = opcoes.map(opcao => `
                <option value="${opcao.id}">${opcao.nm_trans}</option>
            `).join('');
            
            // Atualizar categoria baseada na primeira opção
            if (opcoes.length > 0) {
                this.atualizarCategoria(opcoes[0].id);
            }
        } catch (error) {
            console.error('Erro ao atualizar nomes de transação:', error);
        }
    }

    async atualizarCategoria(idNomeTransacao) {
        try {
            const opcoes = [...this.tiposTransacao.ENTRADA, ...this.tiposTransacao.SAÍDA];
            const tipoSelecionado = opcoes.find(t => t.id == idNomeTransacao);
            
            if (tipoSelecionado) {
                document.getElementById('categoriaTransacao').value = tipoSelecionado.cat_trans;
            }
        } catch (error) {
            console.error('Erro ao atualizar categoria:', error);
        }
    }

    async salvar() {
        if (!this.validarFormulario()) return;

        try {
            mostrarLoader();
            
            const dados = {
                tp_trans: document.getElementById('tpTransacao').value,
                id_nome_trans: parseInt(document.getElementById('nomeTransacao').value),
                recorrencia_trans: document.getElementById('recorrenciaTransacao').value,
                valor_trans: this.parseValor(document.getElementById('valorTransacao').value),
                desc_trans: document.getElementById('descricaoTransacao').value,
                dt_trans: document.getElementById('dataTransacao').value,
                status_trans: document.getElementById('statusTransacao').value
            };

            await database.atualizarTransacao(this.transacaoId, dados);
            mostrarMensagem('Transação atualizada com sucesso!');
            this.fechar();
        } catch (error) {
            mostrarMensagem('Erro ao salvar transação', 'erro');
        } finally {
            esconderLoader();
        }
    }

    validarFormulario() {
        const valor = this.parseValor(document.getElementById('valorTransacao').value);
        
        if (!valor || valor <= 0) {
            mostrarMensagem('O valor da transação deve ser maior que zero', 'erro');
            return false;
        }

        // Validar campos obrigatórios
        const camposObrigatorios = ['tpTransacao', 'nomeTransacao', 'recorrenciaTransacao', 'dataTransacao', 'statusTransacao'];
        for (const campoId of camposObrigatorios) {
            const campo = document.getElementById(campoId);
            if (!campo.value) {
                mostrarMensagem(`O campo ${campo.previousElementSibling.textContent} é obrigatório`, 'erro');
                return false;
            }
        }

        return true;
    }

    parseValor(valorStr) {
        // Converter formato de moeda para número
        return parseFloat(valorStr.replace(/[^\d,]/g, '').replace(',', '.'));
    }

    obterStatusPeriodo(periodo) {
        const hoje = new Date();
        const dtFechamento = new Date(periodo.dt_fechamento);
        return dtFechamento < hoje ? 'ENCERRADO' : 'ABERTO';
    }

    fechar() {
        if (this.editando) {
            if (!confirm('Tem certeza que deseja fechar? Nenhuma alteração será salva.')) {
                return;
            }
        }

        const modal = document.getElementById('modalTransacao');
        modal.classList.add('hidden');
        this.resetarScroll();
        this.limparFormulario();
    }

    resetarScroll() {
        const modalBody = document.querySelector('#modalTransacao .modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    }

    limparFormulario() {
        const form = document.getElementById('formTransacao');
        if (form) form.reset();
    }

    abrir() {
        const modal = document.getElementById('modalTransacao');
        modal.classList.remove('hidden');
        this.resetarScroll();
    }
}