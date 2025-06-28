/**
 * Classe utilitária para construção padronizada de respostas de erro para edge functions.
 * Cada erro contém: field, description e code.
 */
export default class ErrorResponseBuilder {
    private errors: { field: string | null; description: string; code: string }[] = [];

    /**
     * Adiciona um erro ao array de erros.
     * @param field Campo relacionado ao erro (ou null para erro geral)
     * @param description Mensagem legível para o usuário
     * @param code Código único do erro para tradução
     */
    public add(field: string | null, description: string, code: string): this {
        this.errors.push({ field, description, code });
        return this;
    }

    /**
     * Retorna a resposta HTTP padronizada com os erros.
     * @param status Código HTTP (default: 400)
     */
    public buildResponse(status: number = 400): Response {
        return new Response(JSON.stringify({ formErrors: this.errors }), {
            status,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    /**
     * Verifica se há erros acumulados.
     */
    public hasErrors(): boolean {
        return this.errors.length > 0;
    }
} 