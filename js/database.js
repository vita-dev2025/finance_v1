class DatabaseService {
    constructor() {
        this.baseURL = window.location.origin;
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    }

    // Períodos
    async getPeriodos() {
        return await this.request('/api/periodos');
    }

    async getPeriodo(id) {
        return await this.request(`/api/periodos/${id}`);
    }

    // Transações
    async getTransacoesPorPeriodo(periodoId) {
        return await this.request(`/api/transacoes/periodo/${periodoId}`);
    }

    async getTransacao(id) {
        return await this.request(`/api/transacoes/${id}`);
    }

    async criarTransacao(dados) {
        return await this.request('/api/transacoes', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }

    async atualizarTransacao(id, dados) {
        return await this.request(`/api/transacoes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });
    }

    // Tipos de Transação
    async getTiposTransacao(tipo) {
        return await this.request(`/api/tipos-transacoes/${tipo}`);
    }

    // Dashboard
    async getResumoPeriodo(periodoId) {
        const transacoes = await this.getTransacoesPorPeriodo(periodoId);
        
        const entradas = transacoes
            .filter(t => t.tp_trans === 'ENTRADA')
            .reduce((sum, t) => sum + parseFloat(t.valor_trans), 0);
            
        const saidas = transacoes
            .filter(t => t.tp_trans === 'SAÍDA')
            .reduce((sum, t) => sum + parseFloat(t.valor_trans), 0);
            
        const saldo = entradas - saidas;
        
        return {
            entradas,
            saidas,
            saldo
        };
    }
}

// Instância global do serviço de banco de dados
const database = new DatabaseService();

// Utilitários
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

function mostrarLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.remove('hidden');
}

function esconderLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
}

function mostrarMensagem(mensagem, tipo = 'sucesso') {
    // Implementar sistema de mensagens toast
    console.log(`${tipo.toUpperCase()}: ${mensagem}`);
    alert(mensagem); // Temporário
}