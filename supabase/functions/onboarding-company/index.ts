import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import ErrorResponseBuilder from "../_shared/validation/ErrorResponseBuilder.ts";
import { getSupabaseClient } from "../_shared/helper/supabaseClient.ts";
import { EnvHelper } from "../_shared/helper/envHelper.ts";
import { handlerRequest, handlerRequestAuth } from "../_shared/handler/httpHandler.ts";
import { getUserFromRequest } from "../_shared/helper/authHelper.ts";
import { ResponseErrorConst, SingleFormError, UnexpectedError } from '../_shared/exception/errors.ts';

// Interface para o body do onboarding
export interface OnboardingBody {
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
    Deno.serve(execute());
}

export function execute() {
    return handlerRequestAuth(async (req: Request) => {
        const supabase = getSupabaseClient();
        try {
            const body: OnboardingBody = await req.json();
            const { user } = await getUserFromRequest(req);

            // Validação básica dos campos obrigatórios
            const errorBuilder = new ErrorResponseBuilder();
            if (!body.cep) errorBuilder.add("cep", ResponseErrorConst.CepRequired);
            if (!body.address) errorBuilder.add("address", ResponseErrorConst.AddressRequired);
            if (!body.number) errorBuilder.add("number", ResponseErrorConst.NumberRequired);
            if (!body.city) errorBuilder.add("city", ResponseErrorConst.CityRequired);
            if (!body.state) errorBuilder.add("state", ResponseErrorConst.StateRequired);
            if (!body.plan) errorBuilder.add("plan", ResponseErrorConst.PlanRequired);
            if (!body.cardHolderName) errorBuilder.add("cardHolderName", ResponseErrorConst.CardHolderNameRequired);
            if (!body.cardHolderCpf) errorBuilder.add("cardHolderCpf", ResponseErrorConst.CardHolderCpfRequired);
            if (!body.cardNumber) errorBuilder.add("cardNumber", ResponseErrorConst.CardNumberRequired);
            if (!body.cardExpiry) errorBuilder.add("cardExpiry", ResponseErrorConst.CardExpiryRequired);
            if (!body.cardCvv) errorBuilder.add("cardCvv", ResponseErrorConst.CardCvvRequired);
            if (!body.signature) errorBuilder.add("signature", ResponseErrorConst.SignatureRequired);
            if (!body.signatureCpf) errorBuilder.add("signatureCpf", ResponseErrorConst.SignatureCpfRequired);
            if (!body.termHash) errorBuilder.add("termHash", ResponseErrorConst.TermHashRequired);
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
            const payload = {
                owner_id: user.id,
                legalRepresentativeName: body.signature,
                legalRepresentativeCpf: body.signatureCpf,
                cep: body.cep,
                address: body.address,
                number: body.number,
                complement: body.complement || null,
                city: body.city,
                state: body.state,
                plan: body.plan,
                cardHolderName: body.cardHolderName,
                cardHolderCpf: body.cardHolderCpf,
                cardNumber: body.cardNumber,
                cardExpiry: body.cardExpiry,
                cardCvv: body.cardCvv,
                signature: body.signature,
                signatureCpf: body.signatureCpf,
                termHash: body.termHash
            };
            const { error } = await supabase.rpc('onboarding_company_transaction', { payload });
            if (error) {
                throw new SingleFormError(null, ResponseErrorConst.OnboardingSaveError, error, 500);
            }

            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } catch (err) {
            return new ErrorResponseBuilder()
                .add(null, "Erro inesperado: " + err, "UNEXPECTED_ERROR")
                .buildResponse(500);
        }
    });
} 