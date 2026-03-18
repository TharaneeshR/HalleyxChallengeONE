package com.halleyx.workflow.service.impl;

import com.halleyx.workflow.dto.*;
import com.halleyx.workflow.entity.Step;
import com.halleyx.workflow.entity.Workflow;
import com.halleyx.workflow.exception.ResourceNotFoundException;
import com.halleyx.workflow.repository.RuleRepository;
import com.halleyx.workflow.repository.StepRepository;
import com.halleyx.workflow.repository.WorkflowRepository;
import com.halleyx.workflow.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkflowServiceImpl implements WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final StepRepository stepRepository;
    private final RuleRepository ruleRepository;

    @Override
    @Transactional
    public WorkflowResponse create(WorkflowRequest request) {
        Workflow workflow = Workflow.builder()
                .name(request.getName())
                .description(request.getDescription())
                .inputSchema(request.getInputSchema())
                .startStepId(request.getStartStepId())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .version(1)
                .build();
        return toResponse(workflowRepository.save(workflow), false);
    }

    @Override
    public PageResponse<WorkflowResponse> list(String search, Boolean isActive, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Workflow> resultPage = workflowRepository.findAllWithFilters(search, isActive, pageable);

        List<WorkflowResponse> content = resultPage.getContent().stream()
                .map(w -> toResponse(w, false))
                .collect(Collectors.toList());

        return PageResponse.<WorkflowResponse>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(resultPage.getTotalElements())
                .totalPages(resultPage.getTotalPages())
                .last(resultPage.isLast())
                .build();
    }

    @Override
    public WorkflowResponse getById(String id) {
        Workflow workflow = findWorkflow(id);
        return toResponse(workflow, true);
    }

    @Override
    @Transactional
    public WorkflowResponse update(String id, WorkflowRequest request) {
        Workflow workflow = findWorkflow(id);
        workflow.setName(request.getName());
        workflow.setDescription(request.getDescription());
        workflow.setInputSchema(request.getInputSchema());
        if (request.getStartStepId() != null) {
            workflow.setStartStepId(request.getStartStepId());
        }
        if (request.getIsActive() != null) {
            workflow.setIsActive(request.getIsActive());
        }
        workflow.setVersion(workflow.getVersion() + 1);
        return toResponse(workflowRepository.save(workflow), true);
    }

    @Override
    @Transactional
    public void delete(String id) {
        Workflow workflow = findWorkflow(id);
        workflowRepository.delete(workflow);
    }

    private Workflow findWorkflow(String id) {
        return workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found: " + id));
    }

    private WorkflowResponse toResponse(Workflow workflow, boolean includeSteps) {
        List<StepResponse> steps = null;
        int stepCount = 0;

        if (includeSteps) {
            List<Step> stepEntities = stepRepository.findByWorkflowIdOrderByOrderAsc(workflow.getId());
            stepCount = stepEntities.size();
            steps = stepEntities.stream().map(s -> toStepResponse(s, true)).collect(Collectors.toList());
        } else {
            stepCount = (int) stepRepository.findByWorkflowIdOrderByOrderAsc(workflow.getId()).size();
        }

        return WorkflowResponse.builder()
                .id(workflow.getId())
                .name(workflow.getName())
                .description(workflow.getDescription())
                .version(workflow.getVersion())
                .isActive(workflow.getIsActive())
                .inputSchema(workflow.getInputSchema())
                .startStepId(workflow.getStartStepId())
                .createdAt(workflow.getCreatedAt())
                .updatedAt(workflow.getUpdatedAt())
                .steps(steps)
                .stepCount(stepCount)
                .build();
    }

    private StepResponse toStepResponse(Step step, boolean includeRules) {
        var builder = StepResponse.builder()
                .id(step.getId())
                .workflowId(step.getWorkflow().getId())
                .name(step.getName())
                .stepType(step.getStepType())
                .order(step.getOrder())
                .metadata(step.getMetadata())
                .createdAt(step.getCreatedAt())
                .updatedAt(step.getUpdatedAt());

        if (includeRules) {
            var rules = ruleRepository.findByStepIdOrderByPriorityAsc(step.getId()).stream()
                    .map(r -> RuleResponse.builder()
                            .id(r.getId())
                            .stepId(step.getId())
                            .condition(r.getCondition())
                            .nextStepId(r.getNextStepId())
                            .priority(r.getPriority())
                            .createdAt(r.getCreatedAt())
                            .updatedAt(r.getUpdatedAt())
                            .build())
                    .collect(Collectors.toList());
            builder.rules(rules);
        }
        return builder.build();
    }
}
