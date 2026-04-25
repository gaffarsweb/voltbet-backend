import axios, { AxiosInstance } from 'axios';

export interface SymbolPriceTicker {
    symbol?: string;
    symbols?: string;
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
    ): Promise<SymbolPriceTickerResponse[] | undefined> {
        try {
            const response = await this.httpService.get<SymbolPriceTickerResponse[]>(
                '/api/v3/ticker/price',
                { params }
            );

            return response.data;
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