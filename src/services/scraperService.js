const SerpApi = require('google-search-results-nodejs');
const { readEvents, saveEvents } = require('./databaseService');

// API Key fornecida pelo usuário
const API_KEY = "81bc9cb3c616192119614b3443dec5d664a906e1f4244cd713521feb42678e11";
const search = new SerpApi.GoogleSearch(API_KEY);

/**
 * Busca eventos em Recife usando a Google Events API via SerpApi.
 */
const scrapeEvents = async () => {
    console.log('🔄 Iniciando busca via Google Events API...');

    // 1. Carregar banco atual
    let currentDb = [];
    try {
        currentDb = await readEvents();
    } catch (err) {
        currentDb = [];
    }

    // 2. Calcular próximo ID
    let nextId = 1;
    if (currentDb.length > 0) {
        const ids = currentDb.map(e => parseInt(e.id, 10)).filter(n => !isNaN(n));
        if (ids.length > 0) nextId = Math.max(...ids) + 1;
    }

    // 3. Configurar busca
    const params = {
        engine: "google_events",
        q: "eventos em recife",
        hl: "pt",
        gl: "br"
    };

    return new Promise((resolve, reject) => {
        // Callback para SerpApi
        search.json(params, async (data) => {
            try {
                const newEvents = [];
                const eventsResults = data.events_results || [];

                console.log(`🔎 API encontrou ${eventsResults.length} eventos.`);

                eventsResults.forEach(item => {
                    // Extração segura dos dados
                    const dateInfo = item.date ? item.date.when : "Data a confirmar";
                    const address = item.address ? item.address[0] : "Recife";
                    const link = item.link || "#";
                    const title = item.title || "Evento sem nome";
                    const description = item.description || "Sem descrição disponível.";

                    // Tenta extrair data estruturada (simplificado)
                    // O Google retorna texto livre como "Sex, 14 de fev", então mantemos como string
                    // Para o MVP, vamos formatar a string de data para dd-mm-yyyy se possível,
                    // ou usar a data de hoje se falhar, para manter compatibilidade com o filtro.
                    // A melhor abordagem agora é salvar o texto original e melhorar o parser depois.
                    // Para evitar quebrar o app que espera dd-mm-yyyy:

                    const today = new Date();
                    const day = String(today.getDate()).padStart(2, '0');
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const year = today.getFullYear();
                    const fallbackDate = `${day}-${month}-${year}`;

                    newEvents.push({
                        id: String(nextId++).padStart(3, '0'),
                        nome: title,
                        descricao: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
                        data: fallbackDate, // Por enquanto, usando data de hoje para não quebrar filtro de data
                        local: address,
                        horario: dateInfo, // Usando o campo horário para guardar a info de data textual do Google
                        gratuito: false, // Google Events nem sempre diz se é grátis
                        tipo: "Eventos Google",
                        link: link,
                        saved: false
                    });
                });

                if (newEvents.length === 0) {
                    console.log('⚠️ Nenhum evento novo encontrado pela API.');
                    resolve(currentDb);
                    return;
                }

                // 4. Salvar (Deduplicação simples por nome)
                const finalEventsToAdd = newEvents.filter(ne =>
                    !currentDb.some(curr =>
                        curr.nome && ne.nome &&
                        curr.nome.toLowerCase() === ne.nome.toLowerCase()
                    )
                );

                if (finalEventsToAdd.length > 0) {
                    const updatedList = [...currentDb, ...finalEventsToAdd];
                    await saveEvents(updatedList);
                    console.log(`✅ ${finalEventsToAdd.length} novos eventos salvos.`);
                    resolve(updatedList);
                } else {
                    console.log('zzz Todos os eventos já estavam cadastrados.');
                    resolve(currentDb);
                }

            } catch (error) {
                console.error('Erro ao processar dados da API:', error);
                reject(error);
            }
        });
    });
};

module.exports = { scrapeEvents };