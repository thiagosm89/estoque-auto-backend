import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import ErrorResponseBuilder from "../_shared/validation/ErrorResponseBuilder.ts";
import { getSupabaseClient } from "../_shared/helper/supabaseClient.ts";
import { EnvHelper } from "../_shared/helper/envHelper.ts";
import { handlerRequest, handlerRequestAuth } from "../_shared/handler/httpHandler.ts";

// Interface para o body do onboarding
export interface OnboardingBody {
    legalRepresentativeName: string;
    legalRepresentativeCpf: string;
    cep: string;
    address: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    plan: 'anual' | 'semestral';
    cardHolderName: string;
    cardHolderCpf: string;
    cardNumber: string; // número completo, mas só os 4 últimos serão salvos
    cardExpiry: string;
    cardCvv: string;
    signature: string;
    signatureCpf: string;
    termHash: string;
}

if (!EnvHelper.isLocal()) {
    serve((req, ctx) => execute()(req, ctx));
}

export function execute() {
    return handlerRequestAuth(async (req: Request, ctx) => {
        const supabase = getSupabaseClient();
        try {
            const body: OnboardingBody = await req.json();
            const user = ctx.user;

            // Validação básica dos campos obrigatórios
            const errorBuilder = new ErrorResponseBuilder();
            if (!body.legalRepresentativeName) errorBuilder.add("legalRepresentativeName", "Nome do representante é obrigatório.", "LEGAL_REPRESENTATIVE_NAME_REQUIRED");
            if (!body.legalRepresentativeCpf) errorBuilder.add("legalRepresentativeCpf", "CPF do representante é obrigatório.", "LEGAL_REPRESENTATIVE_CPF_REQUIRED");
            if (!body.cep) errorBuilder.add("cep", "CEP é obrigatório.", "CEP_REQUIRED");
            if (!body.address) errorBuilder.add("address", "Endereço é obrigatório.", "ADDRESS_REQUIRED");
            if (!body.number) errorBuilder.add("number", "Número é obrigatório.", "NUMBER_REQUIRED");
            if (!body.city) errorBuilder.add("city", "Cidade é obrigatória.", "CITY_REQUIRED");
            if (!body.state) errorBuilder.add("state", "Estado é obrigatório.", "STATE_REQUIRED");
            if (!body.plan) errorBuilder.add("plan", "Plano é obrigatório.", "PLAN_REQUIRED");
            if (!body.cardHolderName) errorBuilder.add("cardHolderName", "Nome do titular do cartão é obrigatório.", "CARD_HOLDER_NAME_REQUIRED");
            if (!body.cardHolderCpf) errorBuilder.add("cardHolderCpf", "CPF do titular do cartão é obrigatório.", "CARD_HOLDER_CPF_REQUIRED");
            if (!body.cardNumber) errorBuilder.add("cardNumber", "Número do cartão é obrigatório.", "CARD_NUMBER_REQUIRED");
            if (!body.cardExpiry) errorBuilder.add("cardExpiry", "Validade do cartão é obrigatória.", "CARD_EXPIRY_REQUIRED");
            if (!body.cardCvv) errorBuilder.add("cardCvv", "CVV do cartão é obrigatório.", "CARD_CVV_REQUIRED");
            if (!body.signature) errorBuilder.add("signature", "Assinatura é obrigatória.", "SIGNATURE_REQUIRED");
            if (!body.signatureCpf) errorBuilder.add("signatureCpf", "CPF da assinatura é obrigatório.", "SIGNATURE_CPF_REQUIRED");
            if (!body.termHash) errorBuilder.add("termHash", "Hash do termo é obrigatório.", "TERM_HASH_REQUIRED");
            if (errorBuilder.hasErrors()) return errorBuilder.buildResponse(400);

            // Validar hash do termo vigente
            const { data: currentTerm, error: termError } = await supabase
                .from('company_terms')
                .select('hash')
                .eq('is_active', true)
                .order('effective_from', { ascending: false })
                .limit(1)
                .single();
            if (termError || !currentTerm) {
                return new ErrorResponseBuilder()
                    .add(null, 'Termo vigente não encontrado.', 'TERM_NOT_FOUND')
                    .buildResponse(400);
            }
            if (!body.termHash || body.termHash !== currentTerm.hash) {
                return new ErrorResponseBuilder()
                    .add('termHash', 'O termo foi atualizado. Recarregue a tela para aceitar o termo vigente.', 'TERM_OUTDATED')
                    .buildResponse(409);
            }

            // Chamar a função transacional via RPC
            const { error } = await supabase.rpc('onboarding_company_transaction', {
                p_owner_id: user.id,
                p_legal_representative_name: body.legalRepresentativeName,
                p_legal_representative_cpf: body.legalRepresentativeCpf,
                p_cep: body.cep,
                p_address: body.address,
                p_number: body.number,
                p_complement: body.complement || null,
                p_city: body.city,
                p_state: body.state,
                p_plan_type: body.plan,
                p_card_holder_name: body.cardHolderName,
                p_card_holder_cpf: body.cardHolderCpf,
                p_card_last_digits: body.cardNumber.slice(-4),
                p_signature_name: body.signature,
                p_signature_cpf: body.signatureCpf,
                p_term_hash: body.termHash
            });
            if (error) {
                return new ErrorResponseBuilder()
                    .add(null, "Erro ao executar onboarding transacional: " + error.message, "ONBOARDING_TRANSACTION_ERROR")
                    .buildResponse(500);
            }

            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } catch (err) {
            return new ErrorResponseBuilder()
                .add(null, "Erro inesperado: " + err, "UNEXPECTED_ERROR")
                .buildResponse(500);
        }
    });
} 