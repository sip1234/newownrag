import api from '@/utils/api';
import request from '@/utils/request';

export type OutputRuleAction = 'reject' | 'guidance' | 'direct_answer';

export type OutputRule = {
  id: string;
  name: string;
  keywords: string[];
  regex_patterns: string[];
  action_type: OutputRuleAction;
  response_content: string;
  priority: number;
  enabled: boolean;
};

export type OutputRulePayload = Omit<OutputRule, 'id'>;

const outputRuleService = {
  list: () => request.get(api.listOutputRules),
  create: (data: OutputRulePayload) =>
    request.post(api.createOutputRule, { data }),
  update: ({ id, ...data }: OutputRule) =>
    request.put(api.updateOutputRule(id), { data }),
  delete: (id: string) => request.delete(api.deleteOutputRule(id)),
};

export default outputRuleService;
