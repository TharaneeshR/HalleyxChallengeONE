package com.halleyx.workflow.service.impl;

import com.halleyx.workflow.dto.RuleRequest;
import com.halleyx.workflow.dto.RuleResponse;
import com.halleyx.workflow.entity.Rule;
import com.halleyx.workflow.entity.Step;
import com.halleyx.workflow.exception.ResourceNotFoundException;
import com.halleyx.workflow.repository.RuleRepository;
import com.halleyx.workflow.repository.StepRepository;
import com.halleyx.workflow.service.RuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RuleServiceImpl implements RuleService {

    private final RuleRepository ruleRepository;
    private final StepRepository stepRepository;

    @Override
    @Transactional
    public RuleResponse create(String stepId, RuleRequest request) {
        Step step = findStep(stepId);
        Rule rule = Rule.builder()
                .step(step)
                .condition(request.getCondition())
                .nextStepId(request.getNextStepId())
                .priority(request.getPriority())
                .build();
        return toResponse(ruleRepository.save(rule));
    }

    @Override
    public List<RuleResponse> listByStep(String stepId) {
        if (!stepRepository.existsById(stepId)) {
            throw new ResourceNotFoundException("Step not found: " + stepId);
        }
        return ruleRepository.findByStepIdOrderByPriorityAsc(stepId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RuleResponse update(String ruleId, RuleRequest request) {
        Rule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("Rule not found: " + ruleId));
        rule.setCondition(request.getCondition());
        rule.setNextStepId(request.getNextStepId());
        rule.setPriority(request.getPriority());
        return toResponse(ruleRepository.save(rule));
    }

    @Override
    @Transactional
    public void delete(String ruleId) {
        Rule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("Rule not found: " + ruleId));
        ruleRepository.delete(rule);
    }

    private Step findStep(String stepId) {
        return stepRepository.findById(stepId)
                .orElseThrow(() -> new ResourceNotFoundException("Step not found: " + stepId));
    }

    private RuleResponse toResponse(Rule rule) {
        return RuleResponse.builder()
                .id(rule.getId())
                .stepId(rule.getStep().getId())
                .condition(rule.getCondition())
                .nextStepId(rule.getNextStepId())
                .priority(rule.getPriority())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .build();
    }
}
