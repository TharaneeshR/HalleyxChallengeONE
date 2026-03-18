package com.halleyx.workflow.service;

import com.halleyx.workflow.dto.StepRequest;
import com.halleyx.workflow.dto.StepResponse;

import java.util.List;

public interface StepService {
    StepResponse create(String workflowId, StepRequest request);
    List<StepResponse> listByWorkflow(String workflowId);
    StepResponse update(String stepId, StepRequest request);
    void delete(String stepId);
    StepResponse getById(String stepId);
}
