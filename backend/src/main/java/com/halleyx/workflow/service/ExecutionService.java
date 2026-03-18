package com.halleyx.workflow.service;

import com.halleyx.workflow.dto.ExecutionRequest;
import com.halleyx.workflow.dto.ExecutionResponse;
import com.halleyx.workflow.dto.PageResponse;
import com.halleyx.workflow.enums.ExecutionStatus;

public interface ExecutionService {
    ExecutionResponse startExecution(String workflowId, ExecutionRequest request);
    ExecutionResponse getById(String executionId);
    ExecutionResponse cancel(String executionId);
    ExecutionResponse retry(String executionId);
    PageResponse<ExecutionResponse> list(String workflowId, ExecutionStatus status, int page, int size);
}
