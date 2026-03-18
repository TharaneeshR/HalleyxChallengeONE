package com.halleyx.workflow.engine;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.halleyx.workflow.entity.Execution;
import com.halleyx.workflow.entity.Step;
import com.halleyx.workflow.entity.Workflow;
import com.halleyx.workflow.enums.ExecutionStatus;
import com.halleyx.workflow.exception.WorkflowException;
import com.halleyx.workflow.repository.ExecutionRepository;
import com.halleyx.workflow.repository.StepRepository;
import com.halleyx.workflow.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowExecutionEngine {

    private final WorkflowRepository workflowRepository;
    private final StepRepository stepRepository;
    private final ExecutionRepository executionRepository;
    private final RuleEngine ruleEngine;
    private final ObjectMapper objectMapper;

    @Value("${app.rule-engine.max-loop-iterations:10}")
    private int maxLoopIterations;

    @Async("workflowExecutor")
    public void execute(String executionId) {
        log.info(">>> execute() called for {}", executionId);
        try {
            doExecute(executionId);
        } catch (Exception e) {
            log.error("!!! execute() top-level error for {}: {}", executionId, e.getMessage(), e);
            try {
                Execution ex = executionRepository.findById(executionId).orElse(null);
                if (ex != null) {
                    ex.setStatus(ExecutionStatus.FAILED);
                    ex.setEndedAt(LocalDateTime.now());
                    executionRepository.save(ex);
                }
            } catch (Exception ignored) {}
        }
    }

    @Transactional
    public void doExecute(String executionId) throws Exception {
        log.info(">>> doExecute() START {}", executionId);

        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new WorkflowException("Execution not found: " + executionId));

        Workflow workflow = workflowRepository.findById(execution.getWorkflowId())
                .orElseThrow(() -> new WorkflowException("Workflow not found: " + execution.getWorkflowId()));

        log.info("Workflow: name={} startStepId={}", workflow.getName(), workflow.getStartStepId());

        if (workflow.getStartStepId() == null) {
            execution.setStatus(ExecutionStatus.FAILED);
            execution.setEndedAt(LocalDateTime.now());
            executionRepository.save(execution);
            throw new WorkflowException("Workflow has no start step defined");
        }

        execution.setStatus(ExecutionStatus.IN_PROGRESS);
        executionRepository.save(execution);
        log.info("Execution {} → IN_PROGRESS", executionId);

        Map<String, Object> inputData = objectMapper.readValue(
                execution.getData(), new TypeReference<>() {});
        log.info("Input data: {}", inputData);

        List<Map<String, Object>> logs = new ArrayList<>();
        String currentStepId = workflow.getStartStepId();
        Map<String, Integer> visitCounts = new HashMap<>();

        while (currentStepId != null) {
            int visits = visitCounts.getOrDefault(currentStepId, 0) + 1;
            visitCounts.put(currentStepId, visits);
            if (visits > maxLoopIterations) {
                throw new WorkflowException("Max loop iterations exceeded at: " + currentStepId);
            }

            // Re-check status for cancellation
            ExecutionStatus currentStatus = executionRepository.findById(executionId)
                    .map(Execution::getStatus).orElse(ExecutionStatus.CANCELED);
            if (currentStatus == ExecutionStatus.CANCELED) {
                log.info("Execution {} was canceled", executionId);
                return;
            }

            final String stepId = currentStepId;
            Step step = stepRepository.findById(stepId)
                    .orElseThrow(() -> new WorkflowException("Step not found: " + stepId));

            log.info("Processing step: {} ({})", step.getName(), step.getStepType());
            execution.setCurrentStepId(stepId);
            execution.setCurrentStepName(step.getName());
            executionRepository.save(execution);

            LocalDateTime stepStart = LocalDateTime.now();
            Map<String, Object> stepLog = new LinkedHashMap<>();
            stepLog.put("step_name", step.getName());
            stepLog.put("step_type", step.getStepType().name().toLowerCase());
            stepLog.put("started_at", stepStart.toString());

            try {
                RuleEngine.RuleEvaluationResult result = ruleEngine.evaluate(stepId, inputData);
                log.info("Step {} result: nextStep={} endWorkflow={}",
                        step.getName(), result.nextStepName, result.endWorkflow);

                List<Map<String, Object>> evalRules = new ArrayList<>();
                for (RuleEngine.RuleEvalDetail d : result.evalDetails) {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("rule", d.getRule());
                    r.put("result", d.isResult());
                    if (d.getError() != null && !"DEFAULT (fallback)".equals(d.getError())) {
                        r.put("error", d.getError());
                    }
                    evalRules.add(r);
                }

                stepLog.put("evaluated_rules", evalRules);
                stepLog.put("selected_next_step", result.nextStepName);
                stepLog.put("status", "completed");

                if (step.getMetadata() != null) {
                    try {
                        stepLog.put("metadata",
                                objectMapper.readValue(step.getMetadata(), new TypeReference<>() {}));
                    } catch (Exception ignored) {}
                }

                long durationMs = ChronoUnit.MILLIS.between(stepStart, LocalDateTime.now());
                stepLog.put("ended_at", LocalDateTime.now().toString());
                stepLog.put("duration_ms", durationMs);

                logs.add(stepLog);
                execution.setLogs(objectMapper.writeValueAsString(logs));
                executionRepository.save(execution);

                currentStepId = result.endWorkflow ? null : result.nextStepId;

            } catch (Exception e) {
                log.error("Step {} failed: {}", step.getName(), e.getMessage(), e);
                stepLog.put("status", "failed");
                stepLog.put("error_message", e.getMessage());
                stepLog.put("ended_at", LocalDateTime.now().toString());
                logs.add(stepLog);
                execution.setLogs(objectMapper.writeValueAsString(logs));
                execution.setStatus(ExecutionStatus.FAILED);
                execution.setEndedAt(LocalDateTime.now());
                executionRepository.save(execution);
                return;
            }
        }

        execution.setStatus(ExecutionStatus.COMPLETED);
        execution.setCurrentStepId(null);
        execution.setCurrentStepName(null);
        execution.setEndedAt(LocalDateTime.now());
        executionRepository.save(execution);
        log.info("Execution {} COMPLETED successfully", executionId);
    }

    public void retryFailedStep(String executionId) {
        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new WorkflowException("Execution not found"));
        if (execution.getStatus() != ExecutionStatus.FAILED) {
            throw new WorkflowException("Only failed executions can be retried");
        }
        execution.setStatus(ExecutionStatus.IN_PROGRESS);
        execution.setRetries(execution.getRetries() + 1);
        execution.setEndedAt(null);
        executionRepository.save(execution);
        execute(executionId);
    }
}