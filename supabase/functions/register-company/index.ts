import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import ErrorResponseBuilder from "../_shared/validation/ErrorResponseBuilder.ts";
import { fetchCnpjData } from "../_shared/outbound/httpclient/cnpjService.ts";
import { getSupabaseClient } from "../_shared/helper/supabaseClient.ts";
import {EnvHelper} from "../_shared/helper/envHelper.ts";
import {handlerRequest} from "../_shared/handler/httpHandler.ts";

// Interface para o body do cadastro
export interface RegisterCompanyBody {
    companyName: string;
    cnpj: string;
    email: string;
    password: string;
}

if(!EnvHelper.isLocal()) {
    serve(execute());
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
            const {data: user, error: userError} = await supabase.auth.admin.createUser({
                email: body.email,
                password: body.password,
                email_confirm: false
            });
            if (userError || !user || !user.user) {
                return new ErrorResponseBuilder()
                    .add(null, ErrorMap.AuthCreateError.description, ErrorMap.AuthCreateError.code)
                    .buildResponse();
            }

            // 4. Criar empresa vinculada ao user_id
            const {data: company, error: companyError} = await supabase
                .from("companies")
                .insert({
                    cnpj: body.cnpj,
                    name: body.companyName,
                    owner_user_id: user.user.id
                })
                .select()
                .single();
            if (companyError) {
                return new ErrorResponseBuilder()
                    .add(null, ErrorMap.CompanyCreateError.description, ErrorMap.CompanyCreateError.code)
                    .buildResponse();
            }

            return new Response(JSON.stringify({
                success: true,
                user_id: user.user.id,
                company_id: company.id
            }), {status: 200});
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
    const { companyName, cnpj, email, password } = body;
    const errorBuilder = new ErrorResponseBuilder();
    if (!companyName) errorBuilder.add(FormFields.CompanyName, ErrorMap.CompanyNameRequired.description, ErrorMap.CompanyNameRequired.code);
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
    // Conferir se o nome da empresa bate
    const nomeReceita = (cnpjResult.companyName || '').trim().toLowerCase();
    const nomeInformado = body.companyName.trim().toLowerCase();
    if (nomeReceita !== nomeInformado) {
        return errorBuilder
            .add(FormFields.CompanyName, ErrorMap.CompanyNameMismatch.description, ErrorMap.CompanyNameMismatch.code);
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
    CompanyName = "companyName",
    Cnpj = "cnpj",
    Email = "email",
    Password = "password"
}

// Enum único para códigos e descrições de erro
export const ErrorMap = {
    CompanyNameRequired: { code: "COMPANY_NAME_REQUIRED", description: "Nome da empresa é obrigatório." },
    CnpjRequired: { code: "CNPJ_REQUIRED", description: "CNPJ é obrigatório." },
    EmailRequired: { code: "EMAIL_REQUIRED", description: "E-mail é obrigatório." },
    PasswordRequired: { code: "PASSWORD_REQUIRED", description: "Senha é obrigatória." },
    CnpjNotFound: { code: "CNPJ_NOT_FOUND", description: "CNPJ inválido ou não encontrado na Receita Federal." },
    CnpjNotActive: { code: "CNPJ_NOT_ACTIVE", description: "CNPJ não está ativo." },
    CompanyNameMismatch: { code: "COMPANY_NAME_MISMATCH", description: "O nome da empresa não confere com o registrado na Receita Federal." },
    EmailCheckError: { code: "EMAIL_CHECK_ERROR", description: "Erro ao verificar e-mail." },
    EmailAlreadyRegistered: { code: "EMAIL_ALREADY_REGISTERED", description: "E-mail já cadastrado." },
    AuthCreateError: { code: "AUTH_CREATE_ERROR", description: "Erro ao criar usuário." },
    CompanyCreateError: { code: "COMPANY_CREATE_ERROR", description: "Erro ao criar empresa." },
    UnexpectedError: { code: "UNEXPECTED_ERROR", description: "Erro inesperado: " }
} as const; 