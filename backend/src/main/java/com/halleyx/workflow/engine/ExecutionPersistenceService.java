package com.halleyx.workflow.engine;

import com.halleyx.workflow.entity.Execution;
import com.halleyx.workflow.enums.ExecutionStatus;
import com.halleyx.workflow.repository.ExecutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExecutionPersistenceService {

    private final ExecutionRepository executionRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Execution save(Execution execution) {
        return executionRepository.save(execution);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<Execution> findById(String id) {
        return executionRepository.findById(id);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(String executionId, String message) {
        executionRepository.findById(executionId).ifPresent(e -> {
            e.setStatus(ExecutionStatus.FAILED);
            e.setEndedAt(LocalDateTime.now());
            executionRepository.save(e);
            log.info("Execution {} marked FAILED: {}", executionId, message);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markCompleted(String executionId) {
        executionRepository.findById(executionId).ifPresent(e -> {
            e.setStatus(ExecutionStatus.COMPLETED);
            e.setCurrentStepId(null);
            e.setCurrentStepName(null);
            e.setEndedAt(LocalDateTime.now());
            executionRepository.save(e);
            log.info("Execution {} marked COMPLETED", executionId);
        });
    }
}
