
import { Asset, MarketSnapshot, AssetCategory } from '../types';

// --- CONFIGURAÇÃO DE CHAVES E ENDPOINTS ---

const API_KEYS = {
  // HG Brasil removida por instabilidade de CORS
  FINNHUB: process.env.FINNHUB_KEY || 'd4nmhc1r01qk2nuco5agd4nmhc1r01qk2nuco5b0',
  // Alpha Vantage mantida apenas como referência
  ALPHA_VANTAGE: process.env.ALPHA_VANTAGE_KEY || '0JRJYMXVH576HO02'
};

const hasKey = (key: string) => key && key.length > 5;

// Mapeamento de ativos
const ASSET_META: Record<string, { name: string, category: AssetCategory }> = {
  // BRASIL
  'PETR4.SA': { name: 'Petrobras PN', category: 'Brasil Blue-Chips' },
  'VALE3.SA': { name: 'Vale ON', category: 'Brasil Blue-Chips' },
  'ITUB4.SA': { name: 'Itaú PN', category: 'Brasil Blue-Chips' },
  'BBDC4.SA': { name: 'Bradesco PN', category: 'Brasil Blue-Chips' },
  'ABEV3.SA': { name: 'Ambev ON', category: 'Brasil Blue-Chips' },
  'SUZB3.SA': { name: 'Suzano ON', category: 'Brasil Blue-Chips' },
  'EWZ': { name: 'Brazil ETF (MSCI)', category: 'Brasil Blue-Chips' },
  '^BVSP': { name: 'Ibovespa', category: 'Brasil Blue-Chips' }, 
  'IBOV': { name: 'Ibovespa', category: 'Brasil Blue-Chips' },

  // ÍNDICES GLOBAIS
  'SPY': { name: 'S&P 500 (EUA)', category: 'Índices Globais' },
  'QQQ': { name: 'Nasdaq 100 (EUA)', category: 'Índices Globais' },
  'DIA': { name: 'Dow Jones (EUA)', category: 'Índices Globais' },
  'EWG': { name: 'DAX Proxy (Alemanha)', category: 'Índices Globais' },
  'EWU': { name: 'FTSE Proxy (UK)', category: 'Índices Globais' },
  'EWQ': { name: 'CAC Proxy (França)', category: 'Índices Globais' },
  'EWJ': { name: 'Nikkei Proxy (Japão)', category: 'Índices Globais' },
  'MCHI': { name: 'China (Shanghai/Tech)', category: 'Índices Globais' },
  'EWW': { name: 'México (LATAM)', category: 'Índices Globais' },
  'VIXY': { name: 'VIX Short-Term (Vol)', category: 'Índices Globais' },

  // COMMODITIES
  'USO': { name: 'Petróleo WTI', category: 'Commodities' },
  'BNO': { name: 'Petróleo Brent', category: 'Commodities' },
  'GLD': { name: 'Ouro (Gold)', category: 'Commodities' },
  'SLV': { name: 'Prata (Silver)', category: 'Commodities' },
  'CPER': { name: 'Cobre (Copper)', category: 'Commodities' },
  'RIO': { name: 'Rio Tinto (Minério)', category: 'Commodities' },
  'SOYB': { name: 'Soja (Soybean)', category: 'Commodities' },
  'CORN': { name: 'Milho (Corn)', category: 'Commodities' },
  'LIT': { name: 'Lítio & Baterias', category: 'Commodities' },
  'SLX': { name: 'Aço (Steel ETF)', category: 'Commodities' },

  // TREASURIES & JUROS
  'TLT': { name: 'Treasury 20y+ (Yield inv)', category: 'Treasuries & Juros' },
  'IEF': { name: 'Treasury 7-10y (Yield inv)', category: 'Treasuries & Juros' },
  'SHY': { name: 'Treasury 1-3y (Yield inv)', category: 'Treasuries & Juros' },
  'TIP': { name: 'TIPS (Inflação EUA)', category: 'Treasuries & Juros' },
  'CDI': { name: 'Taxa CDI', category: 'Treasuries & Juros' },

  // MOEDAS
  'USD': { name: 'Dólar (USD/BRL)', category: 'Moedas' },
  'EUR': { name: 'Euro (EUR/BRL)', category: 'Moedas' },
  'BTC': { name: 'Bitcoin (USD)', category: 'Moedas' },
  'CNY': { name: 'Yuan Chinês (CNY/BRL)', category: 'Moedas' },
  'GBP': { name: 'Libra (GBP/BRL)', category: 'Moedas' },
  'AUD': { name: 'Dólar Australiano', category: 'Moedas' },
  'ARS': { name: 'Peso Argentino', category: 'Moedas' },
  'UUP': { name: 'DXY Proxy (Dólar Global)', category: 'Moedas' }
};

// --- DADOS DE BACKUP (SEGURANÇA CONTRA FALHA DE API NA INICIALIZAÇÃO) ---
const FALLBACK_ASSETS: Asset[] = [
  { symbol: 'EWZ', name: 'Brazil ETF', price: 32.50, changePercent: -0.5, category: 'Brasil Blue-Chips' },
  { symbol: 'SPY', name: 'S&P 500', price: 510.00, changePercent: 0.2, category: 'Índices Globais' },
  { symbol: '^BVSP', name: 'Ibovespa', price: 128000, changePercent: -0.3, category: 'Brasil Blue-Chips' },
  { symbol: 'PETR4', name: 'Petrobras PN', price: 40.50, changePercent: 0.5, category: 'Brasil Blue-Chips' },
  { symbol: 'VALE3', name: 'Vale ON', price: 60.20, changePercent: -1.2, category: 'Brasil Blue-Chips' },
  { symbol: 'ITUB4', name: 'Itaú PN', price: 33.00, changePercent: 0.1, category: 'Brasil Blue-Chips' },
  { symbol: 'BBDC4', name: 'Bradesco PN', price: 14.50, changePercent: 0.0, category: 'Brasil Blue-Chips' },
  { symbol: 'USO', name: 'Petróleo WTI', price: 78.50, changePercent: 0.8, category: 'Commodities' },
  { symbol: 'RIO', name: 'Rio Tinto', price: 65.00, changePercent: -1.5, category: 'Commodities' },
  { symbol: 'GLD', name: 'Ouro', price: 215.00, changePercent: 0.4, category: 'Commodities' },
  { symbol: 'TLT', name: 'Treasury 20y+', price: 92.00, changePercent: -0.5, category: 'Treasuries & Juros' },
  { symbol: 'UUP', name: 'DXY Proxy', price: 28.50, changePercent: 0.1, category: 'Moedas' },
  { symbol: 'MCHI', name: 'China ETF', price: 42.00, changePercent: -0.8, category: 'Índices Globais' },
  { symbol: 'EWG', name: 'Alemanha ETF', price: 30.00, changePercent: 0.3, category: 'Índices Globais' },
  { symbol: 'EWJ', name: 'Japão ETF', price: 68.00, changePercent: 0.5, category: 'Índices Globais' },
  { symbol: 'VIXY', name: 'VIX Short', price: 12.00, changePercent: -2.0, category: 'Índices Globais' },
  // Adicionados para garantir funcionamento total do fallback de moedas
  { symbol: 'USD', name: 'Dólar (USD/BRL)', price: 5.00, changePercent: 0.1, category: 'Moedas' },
  { symbol: 'EUR', name: 'Euro (EUR/BRL)', price: 5.40, changePercent: -0.2, category: 'Moedas' },
  { symbol: 'BTC', name: 'Bitcoin (USD)', price: 65000.00, changePercent: 1.2, category: 'Moedas' },
];

// --- VARIÁVEIS DE CACHE ---
let cachedFinnhubData: Asset[] = [];
let lastFinnhubFetch = 0;
const FINNHUB_CACHE_DURATION = 15000; // 15s cache

// 1. AwesomeAPI (Moedas) - Sem Cache longo, sempre real-time (5s no frontend)
async function fetchCurrencies(): Promise<Asset[]> {
  try {
    const pairs = 'USD-BRL,EUR-BRL,GBP-BRL,BTC-USD,CNY-BRL,ARS-BRL,AUD-BRL';
    const response = await fetch(`https://json.awesomeapi.com.br/last/${pairs}`);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const assets: Asset[] = [];

    const mapCurrency = (key: string, symbol: string) => {
      if (data[key]) {
        assets.push({
          symbol,
          name: ASSET_META[symbol]?.name || symbol,
          price: parseFloat(data[key].bid),
          changePercent: parseFloat(data[key].pctChange),
          category: 'Moedas'
        });
      }
    };

    mapCurrency('USDBRL', 'USD');
    mapCurrency('EURBRL', 'EUR');
    mapCurrency('GBPBRL', 'GBP');
    mapCurrency('CNYBRL', 'CNY');
    mapCurrency('ARSBRL', 'ARS');
    mapCurrency('AUDBRL', 'AUD');
    mapCurrency('BTCUSD', 'BTC');

    return assets;
  } catch (error) {
    return [];
  }
}

// 2. Finnhub (Ações, ETFs, Índices, EWZ e Ibovespa)
async function fetchFinnhubQuote(symbol: string): Promise<Asset | null> {
  if (!hasKey(API_KEYS.FINNHUB)) return null;

  try {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEYS.FINNHUB}`);
    
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || typeof data.c !== 'number') return null;

    // Normalização de nomes
    let cleanSymbol = symbol.replace('.SA', '');
    if (symbol === '^BVSP') cleanSymbol = 'IBOV';

    const meta = ASSET_META[symbol] || ASSET_META[cleanSymbol] || { name: cleanSymbol, category: 'Risk-On' };

    return {
      symbol: cleanSymbol,
      name: meta.name,
      price: data.c, // Current price (inclui Pre-Market na Finnhub)
      changePercent: typeof data.dp === 'number' ? parseFloat(data.dp.toFixed(2)) : 0,
      category: meta.category
    };
  } catch (error) {
    return null;
  }
}

async function fetchFinnhubBatch(): Promise<Asset[]> {
  const now = Date.now();
  // Retorna cache se a requisição for muito recente
  if (cachedFinnhubData.length > 0 && (now - lastFinnhubFetch < FINNHUB_CACHE_DURATION)) {
    return cachedFinnhubData;
  }

  if (!hasKey(API_KEYS.FINNHUB)) return cachedFinnhubData; 

  const symbols = [
    // BRASIL
    '^BVSP', 'EWZ', 'PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'BBDC4.SA', 'ABEV3.SA', 'SUZB3.SA',
    // GLOBAIS
    'SPY', 'QQQ', 'DIA', 'EWG', 'EWU', 'EWJ', 'EWQ', 'MCHI', 'EWW', 'VIXY',
    // COMMODITIES
    'USO', 'BNO', 'GLD', 'SLV', 'CPER', 'RIO', 'SOYB', 'CORN', 'SLX', 'LIT',
    // TREASURIES
    'TLT', 'IEF', 'SHY', 'TIP', 'UUP'
  ];
  
  try {
    const promises = symbols.map(s => fetchFinnhubQuote(s));
    const results = await Promise.all(promises);
    const assets = results.filter((r): r is Asset => r !== null);
    
    // Se conseguimos dados novos, atualiza o cache
    if (assets.length > 0) {
      cachedFinnhubData = assets;
      lastFinnhubFetch = now;
      return assets;
    } else {
      // API falhou, mas temos cache?
      if (cachedFinnhubData.length > 0) return cachedFinnhubData;
      // API falhou e NÃO temos cache? Retorna Fallback para não quebrar a UI
      console.warn("Finnhub falhou e cache vazio. Usando Fallback Data.");
      return FALLBACK_ASSETS;
    }
  } catch (e) {
    console.error("Erro Finnhub, usando cache/fallback:", e);
    return cachedFinnhubData.length > 0 ? cachedFinnhubData : FALLBACK_ASSETS;
  }
}

// --- FUNÇÃO PRINCIPAL ---

export const getMarketData = async (): Promise<MarketSnapshot> => {
  // CDI Fixo
  const cdiAsset: Asset = {
    symbol: 'CDI',
    name: 'Taxa CDI (Ref)',
    price: 10.65, 
    changePercent: 0,
    category: 'Treasuries & Juros'
  };

  const [finnhubData, currencyData] = await Promise.all([
    fetchFinnhubBatch(),
    fetchCurrencies().catch(() => [])
  ]);

  const allAssets: Asset[] = [
    ...finnhubData,
    ...currencyData,
    cdiAsset
  ];

  // Remove duplicatas e garante consistência
  const uniqueAssets = Array.from(new Map(allAssets.map(item => [item.symbol, item])).values());

  return {
    timestamp: new Date().toISOString(),
    assets: uniqueAssets
  };
};
