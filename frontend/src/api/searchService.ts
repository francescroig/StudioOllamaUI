/**
 * StudioOllamaUI  Copyright (C) 2026  francescroig
 * This program comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to redistribute it
 * under certain conditions; see the LICENSE file for details.
 */
import axios from 'axios';

export type SearchEngine = 'duckduckgo' | 'google' | 'bing' | 'tavily';

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

let SEARCH_API_KEYS = {
  tavily: '',
  google: '',
  bing: ''
};

export const searchService = {
  // Configurar API keys
  setApiKeys(keys: { tavily?: string; google?: string; bing?: string }) {
    SEARCH_API_KEYS = { ...SEARCH_API_KEYS, ...keys };
  },

  /**
   * Buscar usando Tavily (mejor calidad, requiere API key)
   */
  async searchTavily(query: string): Promise<SearchResult[]> {
    try {
      const apiKey = SEARCH_API_KEYS.tavily;
      
      if (!apiKey || apiKey.trim() === '') {
        throw new Error('Tavily API key no configurada. Ve a Configuración para añadirla.');
      }

      const response = await axios.post('https://api.tavily.com/search', {
        api_key: apiKey,
        query: query,
        max_results: 5,
        include_answer: true
      }, {
        timeout: 15000
      });

      const results: SearchResult[] = [];

      if (response.data.results) {
        response.data.results.forEach((result: any) => {
          results.push({
            title: result.title,
            snippet: result.content || result.description || '',
            url: result.url
          });
        });
      }

      return results;
    } catch (error: any) {
      if (error.message?.includes('API key')) {
        throw error;
      }
      throw new Error('Error conectando con Tavily: ' + (error.message || 'Error desconocido'));
    }
  },

  /**
   * Buscar usando Google Custom Search
   */
  async searchGoogle(query: string): Promise<SearchResult[]> {
    try {
      const apiKey = SEARCH_API_KEYS.google;
      
      if (!apiKey || apiKey.trim() === '') {
        throw new Error('Google API key no configurada. Ve a Configuración para añadirla.');
      }

      // Google Custom Search requiere también un Search Engine ID
      // Por ahora lanzamos error informativo
      throw new Error('Google Search requiere configuración adicional (Custom Search Engine ID)');
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Buscar usando Bing Search API
   */
  async searchBing(query: string): Promise<SearchResult[]> {
    try {
      const apiKey = SEARCH_API_KEYS.bing;
      
      if (!apiKey || apiKey.trim() === '') {
        throw new Error('Bing API key no configurada. Ve a Configuración para añadirla.');
      }

      const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
        params: { q: query, count: 5 },
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey
        },
        timeout: 15000
      });

      const results: SearchResult[] = [];

      if (response.data.webPages?.value) {
        response.data.webPages.value.forEach((result: any) => {
          results.push({
            title: result.name,
            snippet: result.snippet || '',
            url: result.url
          });
        });
      }

      return results;
    } catch (error: any) {
      if (error.message?.includes('API key')) {
        throw error;
      }
      throw new Error('Error conectando con Bing: ' + (error.message || 'Error desconocido'));
    }
  },

  /**
   * Buscar usando DuckDuckGo (sin API key, gratuito pero limitado)
   */
  async searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    try {
      // DuckDuckGo Instant Answer API (gratuito)
      const response = await axios.get('https://api.duckduckgo.com/', {
        params: {
          q: query,
          format: 'json',
          no_html: 1,
          skip_disambig: 1
        },
        timeout: 15000
      });

      const results: SearchResult[] = [];

      // Resultado principal
      if (response.data.AbstractText) {
        results.push({
          title: response.data.Heading || 'DuckDuckGo',
          snippet: response.data.AbstractText,
          url: response.data.AbstractURL || 'https://duckduckgo.com/?q=' + encodeURIComponent(query)
        });
      }

      // Resultados relacionados
      if (response.data.RelatedTopics) {
        response.data.RelatedTopics.slice(0, 4).forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Resultado',
              snippet: topic.Text,
              url: topic.FirstURL
            });
          }
        });
      }

      if (results.length === 0) {
        results.push({
          title: 'Búsqueda en DuckDuckGo',
          snippet: 'No se encontraron resultados directos. Intenta con términos más específicos.',
          url: 'https://duckduckgo.com/?q=' + encodeURIComponent(query)
        });
      }

      return results;
    } catch (error: any) {
      throw new Error('Error conectando con DuckDuckGo: ' + (error.message || 'Error desconocido'));
    }
  },

  /**
   * Búsqueda combinada: Intenta motor seleccionado
   */
  async search(
    query: string, 
    engine: SearchEngine = 'tavily'
  ): Promise<SearchResult[]> {
    try {
      switch (engine) {
        case 'tavily':
          return await this.searchTavily(query);
        case 'google':
          return await this.searchGoogle(query);
        case 'bing':
          return await this.searchBing(query);
        case 'duckduckgo':
          return await this.searchDuckDuckGo(query);
        default:
          return await this.searchDuckDuckGo(query);
      }
    } catch (error: any) {
      console.error('Error de búsqueda:', error);
      throw error;
    }
  },

  /**
   * Formatear resultados de búsqueda
   */
  formatSearchResults(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'No se encontraron resultados de búsqueda.';
    }

    return results.map((r, i) => 
      `[${i + 1}] ${r.title}\n${r.snippet}\nFuente: ${r.url}`
    ).join('\n\n---\n\n');
  }
};