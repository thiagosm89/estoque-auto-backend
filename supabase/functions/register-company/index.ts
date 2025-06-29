import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import ErrorResponseBuilder from "../_shared/validation/ErrorResponseBuilder.ts";
import { fetchCnpjData } from "../_shared/outbound/httpclient/cnpjService.ts";
import { getSupabaseClient } from "../_shared/helper/supabaseClient.ts";
import { EnvHelper } from "../_shared/helper/envHelper.ts";
import { handlerRequest } from "../_shared/handler/httpHandler.ts";

// Interface para o body do cadastro
export interface RegisterCompanyBody {
    fantasyName: string;
    corporateName: string;
    cnpj: string;
    email: string;
    password: string;
}

if (!EnvHelper.isLocal()) {
    Deno.serve(execute());
}

export function execute() {
    return handlerRequest(async (req) => {
        const supabase = getSupabaseClient();

        try {
            const body: RegisterCompanyBody = await req.json();

            // Validação extraída para função separada
            const validationResult = await validateRegisterCompany(body, supabase);
            if (validationResult) return validationResult.buildResponse();

            // 3. Criar usuário no Auth
            const { data: user, error: userError } = await supabase.auth.admin.createUser({
                email: body.email,
                password: body.password,
                email_confirm: true,
                user_metadata: {
                    fantasy_name: body.fantasyName,
                    corporate_name: body.corporateName,
                    cnpj: body.cnpj
                }
            });
            if (userError || !user || !user.user) {
                console.error(userError);

                return new ErrorResponseBuilder()
                    .add(null, ErrorMap.AuthCreateError.description, ErrorMap.AuthCreateError.code)
                    .buildResponse();
            }

            // 4. Buscar a empresa criada pela trigger usando o owner_id
            const { data: company, error: companyError } = await supabase
                .from("companies")
                .select("id")
                .eq("owner_id", user.user.id)
                .single();
            if (companyError || !company) {
                return new ErrorResponseBuilder()
                    .add(null, ErrorMap.CompanyCreateError.description, ErrorMap.CompanyCreateError.code)
                    .buildResponse();
            }

            return new Response(JSON.stringify({
                success: true,
                user_id: user.user.id,
                company_id: company.id
            }), { status: 200 });
        } catch (err) {
            return new ErrorResponseBuilder()
                .add(null, ErrorMap.UnexpectedError.description + err, ErrorMap.UnexpectedError.code)
                .buildResponse(500);
        }
    });
}

// Função de validação extraída
async function validateRegisterCompany(
    body: RegisterCompanyBody,
    supabase
) {
    const { fantasyName, corporateName, cnpj, email, password } = body;
    const errorBuilder = new ErrorResponseBuilder();
    if (!fantasyName) errorBuilder.add(FormFields.FantasyName, ErrorMap.FantasyNameRequired.description, ErrorMap.FantasyNameRequired.code);
    if (!corporateName) errorBuilder.add(FormFields.CorporateName, ErrorMap.CorporateNameRequired.description, ErrorMap.CorporateNameRequired.code);
    if (!cnpj) errorBuilder.add(FormFields.Cnpj, ErrorMap.CnpjRequired.description, ErrorMap.CnpjRequired.code);
    if (!email) errorBuilder.add(FormFields.Email, ErrorMap.EmailRequired.description, ErrorMap.EmailRequired.code);
    if (!password) errorBuilder.add(FormFields.Password, ErrorMap.PasswordRequired.description, ErrorMap.PasswordRequired.code);
    if (errorBuilder.hasErrors()) return errorBuilder;

    // 1. Validação de CNPJ via serviço externo adaptado
    const cnpjResult = await fetchCnpjData(cnpj);
    if (!cnpjResult.valid) {
        if (cnpjResult.errorType === 'NOT_FOUND') {
            return errorBuilder
                .add(FormFields.Cnpj, ErrorMap.CnpjNotFound.description, ErrorMap.CnpjNotFound.code);
        }
        if (cnpjResult.errorType === 'NETWORK') {
            return errorBuilder
                .add(FormFields.Cnpj, 'Erro de rede ao consultar CNPJ.', 'CNPJ_NETWORK_ERROR');
        }
    }
    if (!cnpjResult.active) {
        return errorBuilder
            .add(FormFields.Cnpj, ErrorMap.CnpjNotActive.description, ErrorMap.CnpjNotActive.code);
    }
    // Conferir se a razão social e nome fantasia batem
    const razaoReceita = (cnpjResult.corporateName || '').trim().toLowerCase();
    const razaoInformada = corporateName.trim().toLowerCase();
    if (razaoReceita !== razaoInformada) {
        return errorBuilder
            .add(FormFields.CorporateName, ErrorMap.CorporateNameMismatch.description, ErrorMap.CorporateNameMismatch.code);
    }
    const fantasiaReceita = (cnpjResult.fantasyName || '').trim().toLowerCase();
    const fantasiaInformada = fantasyName.trim().toLowerCase();
    if (fantasiaReceita !== fantasiaInformada) {
        return errorBuilder
            .add(FormFields.FantasyName, ErrorMap.FantasyNameMismatch.description, ErrorMap.FantasyNameMismatch.code);
    }

    // 2. Verificar se o e-mail já existe
    const { data: userExists, error: userExistsError } = await supabase.auth.admin.listUsers({ email: body.email });
    if (userExistsError) {
        return errorBuilder
            .add(null, ErrorMap.EmailCheckError.description, ErrorMap.EmailCheckError.code);
    }
    if (userExists && userExists.users && userExists.users.length > 0) {
        return errorBuilder
            .add(FormFields.Email, ErrorMap.EmailAlreadyRegistered.description, ErrorMap.EmailAlreadyRegistered.code);
    }

    return errorBuilder.hasErrors() ? errorBuilder : null;
}

// Enum dos campos do formulário específico desta edge function
export enum FormFields {
    FantasyName = "fantasyName",
    CorporateName = "corporateName",
    Cnpj = "cnpj",
    Email = "email",
    Password = "password"
}

// Enum único para códigos e descrições de erro
export const ErrorMap = {
    FantasyNameRequired: { code: "FANTASY_NAME_REQUIRED", description: "Nome fantasia é obrigatório." },
    CorporateNameRequired: { code: "CORPORATE_NAME_REQUIRED", description: "Razão social é obrigatória." },
    CnpjRequired: { code: "CNPJ_REQUIRED", description: "CNPJ é obrigatório." },
    EmailRequired: { code: "EMAIL_REQUIRED", description: "E-mail é obrigatório." },
    PasswordRequired: { code: "PASSWORD_REQUIRED", description: "Senha é obrigatória." },
    CnpjNotFound: { code: "CNPJ_NOT_FOUND", description: "CNPJ inválido ou não encontrado na Receita Federal." },
    CnpjNotActive: { code: "CNPJ_NOT_ACTIVE", description: "CNPJ não está ativo." },
    CorporateNameMismatch: { code: "CORPORATE_NAME_MISMATCH", description: "A razão social não confere com o registrado na Receita Federal." },
    FantasyNameMismatch: { code: "FANTASY_NAME_MISMATCH", description: "O nome fantasia não confere com o registrado na Receita Federal." },
    EmailCheckError: { code: "EMAIL_CHECK_ERROR", description: "Erro ao verificar e-mail." },
    EmailAlreadyRegistered: { code: "EMAIL_ALREADY_REGISTERED", description: "E-mail já cadastrado." },
    AuthCreateError: { code: "AUTH_CREATE_ERROR", description: "Erro ao criar usuário." },
    CompanyCreateError: { code: "COMPANY_CREATE_ERROR", description: "Erro ao criar empresa." },
    UnexpectedError: { code: "UNEXPECTED_ERROR", description: "Erro inesperado: " }
} as const; 