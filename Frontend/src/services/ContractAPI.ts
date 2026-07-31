import axios from "axios";
import type { ContractInfo } from "../types/ContractInfo";

const API_BASE_URL = "http://localhost:8080";

export async function fetchContractInfo(symbol: string): Promise<ContractInfo> {
  const response = await axios.get<ContractInfo>(
    `${API_BASE_URL}/api/contract-info`,
    {
      params: {
        symbol,
      },
    }
  );

  return response.data;
}