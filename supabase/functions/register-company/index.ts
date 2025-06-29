import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import ErrorResponseBuilder from '../_shared/validation/ErrorResponseBuilder.ts';
import {
  CnpjResult,
  fetchCnpjData,
} from '../_shared/outbound/httpclient/cnpjService.ts';
import { getSupabaseClient } from '../_shared/helper/supabaseClient.ts';
import { EnvHelper } from '../_shared/helper/envHelper.ts';
import { handlerRequest } from '../_shared/handler/httpHandler.ts';
import {
  ReceitaCommunicationError,
  ResponseErrorConst,
  SingleFormError,
  UnexpectedError,
} from '../_shared/exception/errors.ts';
import { STATUS_CODE as StatusCode } from 'https://deno.land/std@0.224.0/http/status.ts';

if (!EnvHelper.isLocal()) {
  Deno.serve(execute());
}

export function execute() {
  return handlerRequest(async req => {
    const supabase = getSupabaseClient();

    const body: RegisterCompanyBody = await req.json();

    // Validação extraída para função separada
    const validationResult = await validatePost(body, supabase);
    if (validationResult) return validationResult.buildResponse();

    // 3. Criar usuário no Auth
    const { data: user, error: userError } =
      await supabase.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          fantasy_name: body.fantasyName,
          corporate_name: body.corporateName,
          cnpj: body.cnpj,
        },
      });

    if (
      userError?.message.toLowerCase === DatabaseErrors.CompanyUniqueConstraint
    ) {
      throw new SingleFormError(
        FormFields.Cnpj,
        ResponseErrorConst.CompanyAlreadyExists,
        userError
      );
    }

    if (userError || !user || !user.user) {
      throw new UnexpectedError(userError);
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.user.id)
      .single();
    if (companyError || !company) {
      throw new UnexpectedError(companyError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: user.user.id,
        company_id: company.id,
      }),
      { status: 200 }
    );
  });
}

async function validateEmailAlreadyExists(supabase, body: RegisterCompanyBody) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1)
    .eq('email', body.email);

  if (error) {
    throw new SingleFormError(
      FormFields.Email,
      ResponseErrorConst.EmailCheckError,
      error,
      StatusCode.InternalServerError
    );
  }

  if (data && data.length > 0) {
    throw new SingleFormError(
      FormFields.Email,
      ResponseErrorConst.EmailAlreadyRegistered,
      error
    );
  }
}

async function validateFantasyName(
  cnpjResultRestServer: CnpjResult,
  registerCompanyBody: RegisterCompanyBody
) {
  const fantasiaReceita = (cnpjResultRestServer.fantasyName || '')
    .trim()
    .toLowerCase();

  const fantasiaInformada = registerCompanyBody.fantasyName
    .trim()
    .toLowerCase();

  if (fantasiaReceita === fantasiaInformada) {
    return;
  }

  throw new SingleFormError(
    FormFields.FantasyName,
    ResponseErrorConst.FantasyNameMismatch
  );
}

async function validateCorporateName(
  cnpjResult: CnpjResult,
  registerCompanyBody: RegisterCompanyBody
) {
  // Conferir se a razão social e nome fantasia batem
  const razaoReceita = (cnpjResult.corporateName || '').trim().toLowerCase();
  const razaoInformada = registerCompanyBody.corporateName.trim().toLowerCase();

  if (razaoReceita === razaoInformada) {
    return;
  }

  throw new SingleFormError(
    FormFields.CorporateName,
    ResponseErrorConst.CorporateNameMismatch
  );
}

async function validateIfActive(cnpjResult: CnpjResult) {
  if (cnpjResult.active) {
    return;
  }

  throw new SingleFormError(FormFields.Cnpj, ResponseErrorConst.CnpjNotActive);
}

async function validateIfExistsCnpj(cnpjResult: CnpjResult) {
  if (!cnpjResult.valid) {
    if (cnpjResult.errorType === 'NOT_FOUND') {
      throw new SingleFormError(
        FormFields.Cnpj,
        ResponseErrorConst.CnpjNotFound
      );
    }

    if (cnpjResult.errorType === 'NETWORK') {
      throw new ReceitaCommunicationError(ResponseErrorConst.CnpjRestError);
    }
  }
}

async function validateCompany(body: RegisterCompanyBody) {
  // chamamos um site para validar os CNPJs
  const cnpjResult = await fetchCnpjData(body.cnpj);

  await validateIfExistsCnpj(cnpjResult);
  await validateIfActive(cnpjResult);
  await validateCorporateName(cnpjResult, body);
  await validateFantasyName(cnpjResult, body);
}

// Função de validação extraída
async function validatePost(body: RegisterCompanyBody, supabase) {
  const errorBuilder = new ErrorResponseBuilder();
  if (!body.fantasyName)
    errorBuilder.add(
      FormFields.FantasyName,
      ResponseErrorConst.FantasyNameRequired
    );
  if (!body.corporateName)
    errorBuilder.add(
      FormFields.CorporateName,
      ResponseErrorConst.CorporateNameRequired
    );
  if (!body.cnpj)
    errorBuilder.add(FormFields.Cnpj, ResponseErrorConst.CnpjRequired);
  if (!body.email)
    errorBuilder.add(FormFields.Email, ResponseErrorConst.EmailRequired);
  if (!body.password)
    errorBuilder.add(FormFields.Password, ResponseErrorConst.PasswordRequired);
  if (errorBuilder.hasErrors()) return errorBuilder;

  await validateCompany(body);
  await validateEmailAlreadyExists(supabase, body);

  return errorBuilder.hasErrors() ? errorBuilder : null;
}

// Interface para o body do cadastro
export interface RegisterCompanyBody {
  fantasyName: string;
  corporateName: string;
  cnpj: string;
  email: string;
  password: string;
}

// Enum dos campos do formulário específico desta edge function
export enum FormFields {
  FantasyName = 'fantasyName',
  CorporateName = 'corporateName',
  Cnpj = 'cnpj',
  Email = 'email',
  Password = 'password',
}

const DatabaseErrors = {
  CompanyUniqueConstraint:
    'duplicate key value violates unique constraint "companies_cnpj_key"'
      .toLowerCase,
};
