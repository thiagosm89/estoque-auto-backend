export type ResponseErrorType = { code: string; description: string };

// Enum único para códigos e descrições de erro
export const ResponseErrorConst = {
    FantasyNameRequired: { code: "FANTASY_NAME_REQUIRED", description: "Nome fantasia é obrigatório." },
    CorporateNameRequired: { code: "CORPORATE_NAME_REQUIRED", description: "Razão social é obrigatória." },
    CnpjRequired: { code: "CNPJ_REQUIRED", description: "CNPJ é obrigatório." },
    EmailRequired: { code: "EMAIL_REQUIRED", description: "E-mail é obrigatório." },
    PasswordRequired: { code: "PASSWORD_REQUIRED", description: "Senha é obrigatória." },
    CnpjRestError: { code: "CNPJ_REST_ERROR", description: "Erro no serviço que consulta o CNPJ." },
    CnpjNotFound: { code: "CNPJ_NOT_FOUND", description: "CNPJ inválido ou não encontrado na Receita Federal." },
    CnpjNotActive: { code: "CNPJ_NOT_ACTIVE", description: "CNPJ não está ativo." },
    CorporateNameMismatch: { code: "CORPORATE_NAME_MISMATCH", description: "A razão social não confere com o registrado na Receita Federal." },
    FantasyNameMismatch: { code: "FANTASY_NAME_MISMATCH", description: "O nome fantasia não confere com o registrado na Receita Federal." },
    EmailCheckError: { code: "EMAIL_CHECK_ERROR", description: "Erro ao verificar e-mail." },
    EmailAlreadyRegistered: { code: "EMAIL_ALREADY_REGISTERED", description: "E-mail já cadastrado." },
    AuthCreateError: { code: "AUTH_CREATE_ERROR", description: "Erro ao criar usuário." },
    CompanyCreateError: { code: "COMPANY_CREATE_ERROR", description: "Erro ao criar empresa." },
    CompanyAlreadyExists: { code: "COMPANY_ALREADY_EXISTS", description: "Empresa já está cadastrada." },
    UnexpectedError: { code: "UNEXPECTED_ERROR", description: "Erro inesperado." },
    OnboardingSaveError: { code: "ONBOARDING_SAVE_ERROR", description: "Erro ao tentar salvar dados do onboarding." },
};

export class SingleFormError extends Error {
    field: string;
    error: ResponseErrorType
    status: number

    constructor(field: string, error: ResponseErrorType, cause: any = null, status: number = 400) {
        super(cause?.message);

        this.field = field;
        this.error = error;
        this.cause = cause;
        this.status = status;
        this.name = "SingleFormError";
    }
}

export class ReceitaCommunicationError extends Error {
    error: ResponseErrorType
    status: number

    constructor(error: ResponseErrorType, cause: any = null, status: number = 500) {
        super(cause?.message);

        this.error = error;
        this.cause = cause;
        this.status = status;
        this.name = "ReceitaCommunicationError";
    }
}

export class UnexpectedError extends Error {
    error: ResponseErrorType
    status: number

    constructor(cause: any = null, status: number = 500) {
        super(cause?.message);

        this.error = ResponseErrorConst.UnexpectedError;
        this.cause = cause;
        this.status = status;
        this.name = "UnexpectedError";
    }
}