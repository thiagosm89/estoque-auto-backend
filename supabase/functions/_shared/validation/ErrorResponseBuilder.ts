import type { ResponseErrorType } from '../exception/errors.ts';

/**
 * Classe utilitária para construção padronizada de respostas de erro para edge functions.
 * Cada erro contém: field, description e code.
 */
export default class ErrorResponseBuilder {

    private errors: { field: string | null; description: string; code: string }[] = [];

    /**
     * Adiciona um erro ao array de erros.
     * @param field Campo relacionado ao erro (ou null para erro geral)
     * @param responseErrorType erro que ocorreu com código de identificacao única
     */
    public add(field: string | null, responseErrorType: ResponseErrorType): this {
        const description = responseErrorType.description;
        const code = responseErrorType.code;

        this.errors.push({ field, description, code });

        return this;
    }

    /**
     * Retorna a resposta HTTP padronizada com os erros.
     * @param status Código HTTP (default: 400)
     * @param customHeaders Headers adicionais a serem enviados na resposta
     */
    public buildResponse(status: number = 400, customHeaders: Record<string, string> = {}): Response {
        return new Response(JSON.stringify({ formErrors: this.errors }), {
            status,
            headers: {
                'Content-Type': 'application/json',
                ...customHeaders
            },
        });
    }

    /**
     * Verifica se há erros acumulados.
     */
    public hasErrors(): boolean {
        return this.errors.length > 0;
    }
} 