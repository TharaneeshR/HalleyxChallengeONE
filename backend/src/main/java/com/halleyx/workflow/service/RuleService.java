package com.halleyx.workflow.service;

import com.halleyx.workflow.dto.RuleRequest;
import com.halleyx.workflow.dto.RuleResponse;

import java.util.List;

public interface RuleService {
    RuleResponse create(String stepId, RuleRequest request);
    List<RuleResponse> listByStep(String stepId);
    RuleResponse update(String ruleId, RuleRequest request);
    void delete(String ruleId);
}
