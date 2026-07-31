import axios from "axios";
import type { Candle } from "../types/Candle";

const API_BASE_URL = "http://localhost:8080";

export type CandleRequest = {
  symbol: string;
  interval: string;
  startDate: string;
  endDate: string;
};

export async function fetchCandles(request: CandleRequest): Promise<Candle[]> {
  const response = await axios.get<Candle[]>(`${API_BASE_URL}/api/candles`, {
    params: request,
  });

  return response.data;
}