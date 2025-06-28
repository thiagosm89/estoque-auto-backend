export class EnvHelper {
    /**
     * Recupera o valor de uma variável de ambiente do Deno.
     * Lança erro se não existir.
     */
    static get(key: string): string {
        const value = Deno.env.get(key);
        if (!value) {
            throw new Error(`Variável de ambiente '${key}' não definida.`);
        }
        return value;
    }

    static getOrNull(key: string): string {
        return Deno.env.get(key);
    }

    /**
     * Recupera o valor de uma variável de ambiente do Deno, ou retorna um valor padrão se não existir.
     */
    static getOrDefault(key: string, defaultValue: string): string {
        const value = Deno.env.get(key);
        return value ?? defaultValue;
    }

    /**
     * Retorna true se PROFILE === 'local'.
     */
    static isLocal(): boolean {
        return EnvHelper.getOrNull('PROFILE')?.toLocaleLowerCase() === 'local';
    }
} 