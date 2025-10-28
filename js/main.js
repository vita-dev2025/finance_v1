// Arquivo principal - Funções utilitárias globais

// Função para navegar entre páginas
function navegarPara(pagina) {
    window.location.href = pagina;
}

// Função para mostrar/ocultar loader
function mostrarLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.remove('hidden');
}

function esconderLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
}

// Função para mostrar mensagens
function mostrarMensagem(mensagem, tipo = 'sucesso') {
    // Criar elemento de mensagem se não existir
    let mensagemDiv = document.getElementById('mensagem-global');
    if (!mensagemDiv) {
        mensagemDiv = document.createElement('div');
        mensagemDiv.id = 'mensagem-global';
        mensagemDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(mensagemDiv);
    }

    // Definir cores baseadas no tipo
    const cores = {
        sucesso: '#4CAF50',
        erro: '#f44336',
        alerta: '#ff9800'
    };

    mensagemDiv.style.backgroundColor = cores[tipo] || cores.sucesso;
    mensagemDiv.textContent = mensagem;

    // Mostrar mensagem
    mensagemDiv.style.display = 'block';

    // Auto-remover após 5 segundos
    setTimeout(() => {
        mensagemDiv.style.display = 'none';
    }, 5000);
}

// Utilitários de formatação
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor || 0);
}

function formatarData(data) {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR');
}

// Função para parse de valor monetário
function parseValorMoeda(valorStr) {
    if (!valorStr) return 0;
    return parseFloat(valorStr.replace(/[^\d,]/g, '').replace(',', '.'));
}

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    console.log('💰 Finance - Sistema carregado');
});