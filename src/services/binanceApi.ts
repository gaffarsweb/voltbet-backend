import axios, { AxiosInstance } from 'axios';

export interface SymbolPriceTicker {
  symbol?: string;
}

export interface SymbolPriceTickerResponse {
  symbol: string;
  price: string;
}

export class BinanceApi {
  private readonly httpService: AxiosInstance;

  constructor() {
    this.httpService = axios.create({
      baseURL: 'https://api.binance.com',
      timeout: 10000,
    });
  }

  async symbolPriceTicker(
    params: SymbolPriceTicker,
  ): Promise<SymbolPriceTickerResponse | undefined> {
    try {
      const response = await this.httpService.get<SymbolPriceTickerResponse[]>(
        '/api/v3/ticker/price',
        { params }
      );
      
      // If symbol provided, return single result
      if (params.symbol) {
        return response.data.find(t => t.symbol === params.symbol);
      }
      
      return response.data as any;
    } catch (error) {
      console.error('BinanceApi error:', error);
    }
  }
}

// Singleton instance
let binanceApiInstance: BinanceApi | null = null;

export function getBinanceApi(): BinanceApi {
  if (!binanceApiInstance) {
    binanceApiInstance = new BinanceApi();
  }
  return binanceApiInstance;
}