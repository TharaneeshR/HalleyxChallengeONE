package com.halleyx.workflow.service.impl;

import com.halleyx.workflow.dto.RuleResponse;
import com.halleyx.workflow.dto.StepRequest;
import com.halleyx.workflow.dto.StepResponse;
import com.halleyx.workflow.entity.Step;
import com.halleyx.workflow.entity.Workflow;
import com.halleyx.workflow.exception.ResourceNotFoundException;
import com.halleyx.workflow.repository.RuleRepository;
import com.halleyx.workflow.repository.StepRepository;
import com.halleyx.workflow.repository.WorkflowRepository;
import com.halleyx.workflow.service.StepService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StepServiceImpl implements StepService {

    private final StepRepository stepRepository;
    private final WorkflowRepository workflowRepository;
    private final RuleRepository ruleRepository;

    @Override
    @Transactional
    public StepResponse create(String workflowId, StepRequest request) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found: " + workflowId));

        // Determine order if not specified
        int order = request.getOrder() != null ? request.getOrder() :
                stepRepository.findByWorkflowIdOrderByOrderAsc(workflowId).size() + 1;

        Step step = Step.builder()
                .workflow(workflow)
                .name(request.getName())
                .stepType(request.getStepType())
                .order(order)
                .metadata(request.getMetadata())
                .build();

        step = stepRepository.save(step);

        // Auto-set as start step if first step
        if (workflow.getStartStepId() == null) {
            workflow.setStartStepId(step.getId());
            workflowRepository.save(workflow);
        }

        return toResponse(step);
    }

    @Override
    public List<StepResponse> listByWorkflow(String workflowId) {
        if (!workflowRepository.existsById(workflowId)) {
            throw new ResourceNotFoundException("Workflow not found: " + workflowId);
        }
        return stepRepository.findByWorkflowIdOrderByOrderAsc(workflowId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public StepResponse update(String stepId, StepRequest request) {
        Step step = findStep(stepId);
        step.setName(request.getName());
        step.setStepType(request.getStepType());
        if (request.getOrder() != null) step.setOrder(request.getOrder());
        if (request.getMetadata() != null) step.setMetadata(request.getMetadata());
        return toResponse(stepRepository.save(step));
    }

    @Override
    @Transactional
    public void delete(String stepId) {
        Step step = findStep(stepId);
        // If this was the start step, clear it
        Workflow workflow = step.getWorkflow();
        if (stepId.equals(workflow.getStartStepId())) {
            workflow.setStartStepId(null);
            workflowRepository.save(workflow);
        }
        stepRepository.delete(step);
    }

    @Override
    public StepResponse getById(String stepId) {
        return toResponse(findStep(stepId));
    }

    private Step findStep(String stepId) {
        return stepRepository.findById(stepId)
                .orElseThrow(() -> new ResourceNotFoundException("Step not found: " + stepId));
    }

    private StepResponse toResponse(Step step) {
        List<RuleResponse> rules = ruleRepository.findByStepIdOrderByPriorityAsc(step.getId())
                .stream().map(r -> RuleResponse.builder()
                        .id(r.getId())
                        .stepId(step.getId())
                        .condition(r.getCondition())
                        .nextStepId(r.getNextStepId())
                        .priority(r.getPriority())
                        .createdAt(r.getCreatedAt())
                        .updatedAt(r.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());

        return StepResponse.builder()
                .id(step.getId())
                .workflowId(step.getWorkflow().getId())
                .name(step.getName())
                .stepType(step.getStepType())
                .order(step.getOrder())
                .metadata(step.getMetadata())
                .createdAt(step.getCreatedAt())
                .updatedAt(step.getUpdatedAt())
                .rules(rules)
                .build();
    }
}
