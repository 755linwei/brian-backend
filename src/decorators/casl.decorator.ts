import { SetMetadata } from '@nestjs/common';
import { AnyMongoAbility, InferSubjects } from '@casl/ability';
import { Action } from 'src/enum/action.enum';

export enum CHECK_POLICIES_KEY {
  HANDLER = 'CHECK_POLICIES_HANDLER',
  CAN = 'CHECK_POLICIES_CAN',
  CANNOT = 'CHECK_POLICIES_CANNOT',
}

export type PolicyHandlerCallback = (ability: AnyMongoAbility) => boolean;

export type CaslHandlerType = PolicyHandlerCallback | PolicyHandlerCallback[];

// GUARDS -> routes meta -> @CheckPolicies @Can @Cannot

// @CheckPolicies -> handler -> ability => boolean
export const CheckPolices = (...handlers: PolicyHandlerCallback[]) => {
   console.log('[CheckPolices 装饰器执行] 注册handler数量：', handlers.length);
   return SetMetadata(CHECK_POLICIES_KEY.HANDLER, handlers);
};

// @Can -> Action, Subject, Conditions
export const Can = (
  action: Action,
  subject: InferSubjects<any>,
  conditions?: any,
) =>
  SetMetadata(CHECK_POLICIES_KEY.CAN, (ability: AnyMongoAbility) => {
    const result = ability.can(action, subject, conditions);
    console.log(`👉@Can运行校验: action=${action} subject=${String(subject)} 校验结果=${result}`);
    return result;
  });
// @Cannot -> Action, Subject, Conditions
export const Cannot = (
  action: Action,
  subject: InferSubjects<any>,
  conditions?: any,
) =>
  SetMetadata(CHECK_POLICIES_KEY.CANNOT, (ability: AnyMongoAbility) => {
    const result = ability.cannot(action, subject, conditions);
    console.log(`👉@Cannot运行校验: action=${action} subject=${String(subject)} 校验结果=${result}`);
    return result;
   }
  );
