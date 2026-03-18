package com.halleyx.workflow.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.halleyx.workflow.dto.ExecutionRequest;
import com.halleyx.workflow.dto.ExecutionResponse;
import com.halleyx.workflow.dto.PageResponse;
import com.halleyx.workflow.engine.WorkflowExecutionEngine;
import com.halleyx.workflow.entity.Execution;
import com.halleyx.workflow.entity.Workflow;
import com.halleyx.workflow.enums.ExecutionStatus;
import com.halleyx.workflow.exception.ResourceNotFoundException;
import com.halleyx.workflow.exception.WorkflowException;
import com.halleyx.workflow.repository.ExecutionRepository;
import com.halleyx.workflow.repository.WorkflowRepository;
import com.halleyx.workflow.service.ExecutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExecutionServiceImpl implements ExecutionService {

    private final ExecutionRepository executionRepository;
    private final WorkflowRepository workflowRepository;
    private final WorkflowExecutionEngine executionEngine;
    private final ObjectMapper objectMapper;

    @Override
    public ExecutionResponse startExecution(String workflowId, ExecutionRequest request) {
        // NOTE: No @Transactional here on purpose.
        // The save must COMMIT before the async engine thread tries to read the row.
        // If we wrap this in @Transactional, the async thread starts before commit
        // and gets "Execution not found".

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found: " + workflowId));

        if (!Boolean.TRUE.equals(workflow.getIsActive())) {
            throw new WorkflowException("Workflow is not active");
        }

        if (workflow.getStartStepId() == null) {
            throw new WorkflowException("Workflow has no start step defined");
        }

        try {
            String dataJson = objectMapper.writeValueAsString(
                    request.getData() != null ? request.getData() : Collections.emptyMap());

            Execution execution = Execution.builder()
                    .workflowId(workflowId)
                    .workflowVersion(workflow.getVersion())
                    .workflowName(workflow.getName())
                    .status(ExecutionStatus.PENDING)
                    .data(dataJson)
                    .triggeredBy(request.getTriggeredBy() != null ? request.getTriggeredBy() : "system")
                    .build();

            // Save and flush immediately — committed to DB before engine thread starts
            execution = saveAndFlush(execution);
            log.info("Execution {} saved and committed. Starting engine...", execution.getId());

            // Now safe to call async — DB row is visible to the engine thread
            executionEngine.execute(execution.getId());

            return toResponse(execution);
        } catch (WorkflowException e) {
            throw e;
        } catch (Exception e) {
            throw new WorkflowException("Failed to start execution: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Execution saveAndFlush(Execution execution) {
        return executionRepository.saveAndFlush(execution);
    }

    @Override
    public ExecutionResponse getById(String executionId) {
        return toResponse(findExecution(executionId));
    }

    @Override
    @Transactional
    public ExecutionResponse cancel(String executionId) {
        Execution execution = findExecution(executionId);
        if (execution.getStatus() == ExecutionStatus.COMPLETED ||
                execution.getStatus() == ExecutionStatus.CANCELED) {
            throw new WorkflowException("Cannot cancel execution in status: " + execution.getStatus());
        }
        execution.setStatus(ExecutionStatus.CANCELED);
        execution.setEndedAt(LocalDateTime.now());
        return toResponse(executionRepository.save(execution));
    }

    @Override
    @Transactional
    public ExecutionResponse retry(String executionId) {
        Execution execution = findExecution(executionId);
        if (execution.getStatus() != ExecutionStatus.FAILED) {
            throw new WorkflowException("Only FAILED executions can be retried");
        }
        execution.setStatus(ExecutionStatus.IN_PROGRESS);
        execution.setRetries(execution.getRetries() + 1);
        execution.setEndedAt(null);
        executionRepository.saveAndFlush(execution);
        executionEngine.execute(executionId);
        return toResponse(execution);
    }

    @Override
    public PageResponse<ExecutionResponse> list(String workflowId, ExecutionStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("startedAt").descending());
        Page<Execution> resultPage = executionRepository.findAllWithFilters(workflowId, status, pageable);
        List<ExecutionResponse> content = resultPage.getContent().stream()
                .map(this::toResponse).collect(Collectors.toList());
        return PageResponse.<ExecutionResponse>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(resultPage.getTotalElements())
                .totalPages(resultPage.getTotalPages())
                .last(resultPage.isLast())
                .build();
    }

    private Execution findExecution(String id) {
        return executionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Execution not found: " + id));
    }

    private ExecutionResponse toResponse(Execution execution) {
        Map<String, Object> dataMap = null;
        List<Object> logsList = null;
        try {
            if (execution.getData() != null)
                dataMap = objectMapper.readValue(execution.getData(), new TypeReference<>() {});
            if (execution.getLogs() != null)
                logsList = objectMapper.readValue(execution.getLogs(), new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Failed to parse execution data/logs: {}", e.getMessage());
        }
        return ExecutionResponse.builder()
                .id(execution.getId())
                .workflowId(execution.getWorkflowId())
                .workflowName(execution.getWorkflowName())
                .workflowVersion(execution.getWorkflowVersion())
                .status(execution.getStatus())
                .data(dataMap)
                .logs(logsList)
                .currentStepId(execution.getCurrentStepId())
                .currentStepName(execution.getCurrentStepName())
                .retries(execution.getRetries())
                .triggeredBy(execution.getTriggeredBy())
                .startedAt(execution.getStartedAt())
                .endedAt(execution.getEndedAt())
                .build();
    }
}