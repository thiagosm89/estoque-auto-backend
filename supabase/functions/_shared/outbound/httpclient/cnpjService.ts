export type CnpjResult = {
    valid: boolean;
    active: boolean;
    companyName: string | null;
    errorType: 'NOT_FOUND' | 'NOT_ACTIVE' | 'NETWORK' | null;
};

export async function fetchCnpjData(cnpj: string): Promise<CnpjResult> {
    try {
        const cnpjLimpo = cnpj.replace(/\D/g, "");
        const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
        if (!resp.ok) {
            return {
                valid: false,
                active: false,
                companyName: null,
                errorType: 'NOT_FOUND',
            };
        }
        const data = await resp.json();
        if (data.descricao_situacao_cadastral !== "ATIVA") {
            return {
                valid: true,
                active: false,
                companyName: data.razao_social || null,
                errorType: 'NOT_ACTIVE',
            };
        }
        return {
            valid: true,
            active: true,
            companyName: data.razao_social || null,
            errorType: null,
        };
    } catch (e) {
        return {
            valid: false,
            active: false,
            companyName: null,
            errorType: 'NETWORK',
        };
    }
} 