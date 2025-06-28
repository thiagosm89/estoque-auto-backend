const RENAVE_CNAES_START = "45111";

export type CnaeInfo = {
    code: string;
    primary: boolean;
};

export class CnpjResult {
    constructor(
        public readonly valid: boolean,
        public readonly active: boolean,
        public readonly companyName: string | null,
        public readonly cnaes: CnaeInfo[],
        public readonly errorType: 'NOT_FOUND' | 'NOT_ACTIVE' | 'NETWORK' | null
    ) { }

    hasValidRenaveCnae(): boolean {
        return this.cnaes.some(cnae => cnae.code.startsWith(RENAVE_CNAES_START));
    }
}

export async function fetchCnpjData(cnpj: string): Promise<CnpjResult> {
    try {
        const cnpjLimpo = cnpj.replace(/\D/g, "");
        const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
        if (!resp.ok) {
            return new CnpjResult(
                false, // valid
                false, // active
                null,  // companyName
                [],    // cnaes
                'NOT_FOUND' // errorType
            );
        }
        const data = await resp.json();
        const cnaes: CnaeInfo[] = [];
        if (data.cnae_fiscal) {
            cnaes.push({ code: String(data.cnae_fiscal), primary: true });
        }
        if (Array.isArray(data.cnaes_secundarios)) {
            for (const c of data.cnaes_secundarios) {
                cnaes.push({ code: String(c.codigo), primary: false });
            }
        }

        if (data.descricao_situacao_cadastral !== "ATIVA") {
            return new CnpjResult(
                true, // valid
                false, // active
                data.razao_social || null, // companyName
                cnaes,
                'NOT_ACTIVE' // errorType
            );
        }
        return new CnpjResult(
            true, // valid
            true, // active
            data.razao_social || null, // companyName
            cnaes,
            null // errorType
        );
    } catch (e) {
        return new CnpjResult(
            false, // valid
            false, // active
            null,  // companyName
            [],    // cnaes
            'NETWORK' // errorType
        );
    }
} 