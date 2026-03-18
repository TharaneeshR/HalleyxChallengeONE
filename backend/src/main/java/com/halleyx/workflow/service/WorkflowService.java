package com.halleyx.workflow.service;

import com.halleyx.workflow.dto.PageResponse;
import com.halleyx.workflow.dto.WorkflowRequest;
import com.halleyx.workflow.dto.WorkflowResponse;

public interface WorkflowService {
    WorkflowResponse create(WorkflowRequest request);
    PageResponse<WorkflowResponse> list(String search, Boolean isActive, int page, int size);
    WorkflowResponse getById(String id);
    WorkflowResponse update(String id, WorkflowRequest request);
    void delete(String id);
}
